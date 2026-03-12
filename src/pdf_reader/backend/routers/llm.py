"""Router for LLM-based endpoints (key extraction and question answering)."""

import json
import logging

from backend.database import get_db
from backend.dependencies import get_current_user, get_llm_extractor, get_pdf_data_for_document_ids_async
from backend.models.user import User
from backend.schemas.domain import SourceLocation
from backend.schemas.requests import (
    CoreWindingCountRequest,
    KeyExtractionRequest,
    PDFComparisonRequest,
    ProductTypeDetectionRequest,
    QuestionRequest,
)
from backend.services.extraction_result import create_extraction_result
from backend.services.llm_key_extractor import LLMKeyExtractor
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["llm"])


@router.post("/extract-keys")
async def extract_keys(
    request: KeyExtractionRequest,
    db: AsyncSession = Depends(get_db),
    llm_extractor: LLMKeyExtractor = Depends(get_llm_extractor),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Extract keys from one or more previously uploaded PDFs using LLM.

    Args:
    - request: KeyExtractionRequest containing document_ids and key_names
    - db: AsyncSession database session
    - llm_extractor: LLMKeyExtractor service for key extraction
    - current_user: Authenticated user

    Returns:
    - Dictionary mapping each key name to its KeyExtractionResult
    """
    pdf_data_list = await get_pdf_data_for_document_ids_async(db, request.document_ids)

    # Extract all keys using LLM
    try:
        results = await llm_extractor.extract_keys(
            key_names=request.key_names, pdf_data=pdf_data_list, language=request.language
        )

        # Transform matched_line_ids to individual highlight boxes.
        for key, result in results.items():
            if result and result.matched_line_ids:
                new_source_locations = []

                for source_loc in result.source_locations:
                    pdf_filename = source_loc.pdf_filename
                    document_id = source_loc.document_id

                    matching_pdf = None
                    if document_id is not None:
                        matching_pdf = next(
                            (pdf for pdf in pdf_data_list if pdf.get("document_id") == document_id),
                            None,
                        )

                    if matching_pdf is None:
                        matching_pdfs = [pdf for pdf in pdf_data_list if pdf.get("filename") == pdf_filename]
                        if len(matching_pdfs) == 1:
                            matching_pdf = matching_pdfs[0]

                    if not matching_pdf or "line_id_map" not in matching_pdf:
                        new_source_locations.append(source_loc)
                        continue

                    line_id_map = matching_pdf["line_id_map"]
                    has_highlight = False

                    for line_id in result.matched_line_ids:
                        bbox = line_id_map.get(line_id)
                        if bbox is None:
                            continue

                        try:
                            line_page_num = int(line_id.split("_")[0])
                        except (ValueError, IndexError):
                            continue

                        if line_page_num not in source_loc.page_numbers:
                            continue

                        new_source_locations.append(
                            SourceLocation(
                                document_id=matching_pdf.get("document_id"),
                                pdf_filename=pdf_filename,
                                page_numbers=[line_page_num],
                                bounding_box=bbox,
                            )
                        )
                        has_highlight = True

                    if not has_highlight:
                        if source_loc.document_id is None:
                            source_loc.document_id = matching_pdf.get("document_id") if matching_pdf else None
                        new_source_locations.append(source_loc)

                result.source_locations = new_source_locations

                result.matched_line_ids = None

        # Convert results to dict with serializable values
        results_dict = {key: result.model_dump() if result else None for key, result in results.items()}

        # Extract simple key-value pairs for database storage
        simple_results = {}
        for key, result_data in results_dict.items():
            if result_data:
                simple_results[key] = result_data.get("key_value")
            else:
                simple_results[key] = None

        try:
            await create_extraction_result(
                db=db,
                user_id=current_user.id,
                document_ids=request.document_ids,
                extraction_results=simple_results,
                language=request.language,
            )
            logger.info(f"Successfully saved extraction results for user {current_user.id}")
        except Exception as e:
            logger.error(f"Error saving extraction results to database: {str(e)}")

        return results_dict
    except Exception as e:
        logger.error(f"Error during LLM multiple key extraction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during key extraction: {str(e)}")


@router.post("/ask-question-stream")
async def ask_question_stream(
    request: QuestionRequest,
    db: AsyncSession = Depends(get_db),
    llm_extractor: LLMKeyExtractor = Depends(get_llm_extractor),
):
    """
    Ask a general question about one or more previously uploaded PDFs using LLM with streaming.

    Args:
    - request: QuestionRequest containing document_ids and question
    - db: AsyncSession database session
    - llm_extractor: LLMKeyExtractor service for question answering

    Returns:
    - Streaming response with Server-Sent Events (SSE) format
    """
    pdf_data_list = await get_pdf_data_for_document_ids_async(db, request.document_ids)

    # Convert conversation history to dict format for LLM
    conversation_history = None
    if request.conversation_history:
        conversation_history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]

    async def event_generator():
        """Generate SSE events for streaming response."""
        try:
            async for chunk, system_message in llm_extractor.answer_question_stream(
                question=request.question,
                pdf_data=pdf_data_list,
                conversation_history=conversation_history,
                language=request.language,
            ):
                # Send system message if this is the first message
                if system_message:
                    system_event = {"type": "system_message", "content": system_message}
                    yield f"data: {json.dumps(system_event)}\n\n"

                # Send the chunk
                chunk_event = {"type": "chunk", "content": chunk}
                yield f"data: {json.dumps(chunk_event)}\n\n"

            # Send completion event
            done_event = {"type": "done"}
            yield f"data: {json.dumps(done_event)}\n\n"

        except Exception as e:
            logger.error(f"Error during streaming: {str(e)}")
            error_event = {"type": "error", "content": str(e)}
            yield f"data: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.post("/detect-product-type")
async def detect_product_type(
    request: ProductTypeDetectionRequest,
    db: AsyncSession = Depends(get_db),
    llm_extractor: LLMKeyExtractor = Depends(get_llm_extractor),
) -> dict:
    """
    Detect product type from uploaded PDF specifications.

    Uses LLM to analyze PDF content and identify whether the product is:
    - Stromwandler (Current Instrument Transformer)
    - Spannungswandler (Voltage Instrument Transformer)
    - Kombiwandler (Combined Instrument Transformer)

    Args:
    - request: ProductTypeDetectionRequest containing document_ids
    - db: AsyncSession database session
    - llm_extractor: LLMKeyExtractor service for product type detection

    Returns:
    - ProductTypeDetectionResult with detected type, confidence, and evidence
    """
    pdf_data_list = await get_pdf_data_for_document_ids_async(db, request.document_ids)

    # Detect product type using LLM
    try:
        result = await llm_extractor.detect_product_type(pdf_data=pdf_data_list)
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error during product type detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during product type detection: {str(e)}")


@router.post("/detect-core-winding-count")
async def detect_core_winding_count(
    request: CoreWindingCountRequest,
    db: AsyncSession = Depends(get_db),
    llm_extractor: LLMKeyExtractor = Depends(get_llm_extractor),
) -> dict:
    """
    Detect the maximum number of cores/windings based on product type.

    This endpoint analyzes PDF content to determine how many cores (Kern)
    or windings (Wicklung) are specified, based on the product type.

    Args:
    - request: CoreWindingCountRequest containing document_ids and product_type
    - db: AsyncSession database session
    - llm_extractor: LLMKeyExtractor service for core/winding count detection

    Returns:
    - CoreWindingCountResult with max_core_number and max_winding_number
    """
    pdf_data_list = await get_pdf_data_for_document_ids_async(db, request.document_ids)

    # Detect core/winding count using LLM
    try:
        result = await llm_extractor.detect_core_winding_count(
            pdf_data=pdf_data_list, product_type=request.product_type
        )
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error during core/winding count detection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during core/winding count detection: {str(e)}")


@router.post("/compare-pdfs")
async def compare_pdfs(
    request: PDFComparisonRequest,
    db: AsyncSession = Depends(get_db),
    llm_extractor: LLMKeyExtractor = Depends(get_llm_extractor),
) -> dict:
    """
    Compare two versions of a PDF to identify changes in specifications.

    Args:
    - request: PDFComparisonRequest containing base_document_id, new_document_id, and additional_context
    - db: AsyncSession database session
    - llm_extractor: LLMKeyExtractor service for PDF comparison

    Returns:
    - PDFComparisonResult with summary and list of changes
    """
    # Get both PDFs - helper will raise HTTPException if not found
    pdf_data_list = await get_pdf_data_for_document_ids_async(
        db, [request.base_document_id, request.new_document_id]
    )
    base_pdf_data, new_pdf_data = pdf_data_list[0], pdf_data_list[1]

    # Compare the PDFs using LLM
    try:
        result = await llm_extractor.compare_pdfs(
            base_pdf_data=base_pdf_data,
            new_pdf_data=new_pdf_data,
            additional_context=request.additional_context or "",
        )
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error during PDF comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during PDF comparison: {str(e)}")
