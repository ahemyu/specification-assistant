"""Router for LLM-based endpoints (key extraction and question answering)."""
import json
import logging

from dependencies import get_llm_extractor, get_pdf_storage
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from schemas.requests import KeyExtractionRequest, QuestionRequest
from services.llm_key_extractor import LLMKeyExtractor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["llm"])


@router.post("/extract-keys")
async def extract_keys(
    request: KeyExtractionRequest,
    llm_extractor: LLMKeyExtractor = Depends(get_llm_extractor)
) -> dict:
    """
    Extract keys from one or more previously uploaded PDFs using LLM.

    Requires:
    - file_ids: List of file IDs from previous /upload requests
    - key_names: List of keys to extract
    - additional_context (optional): Additional context to help the LLM

    Returns:
    - Dictionary mapping each key name to its KeyExtractionResult
    """
    pdf_storage = get_pdf_storage()

    # Load the processed PDF data for each file_id from memory
    pdf_data_list = []
    for file_id in request.file_ids:
        if file_id not in pdf_storage:
            raise HTTPException(
                status_code=404,
                detail=f"File with ID {file_id} not found. Please upload the file first."
            )

        pdf_data_list.append(pdf_storage[file_id])

    # Extract all keys using LLM
    try:
        results = llm_extractor.extract_keys(
            key_names=request.key_names,
            pdf_data=pdf_data_list,
            additional_context=request.additional_context or ""
        )
        # Convert results to dict with serializable values
        return {
            key: result.model_dump() if result else None
            for key, result in results.items()
        }
    except Exception as e:
        logger.error(f"Error during LLM multiple key extraction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during key extraction: {str(e)}"
        )


@router.post("/ask-question-stream")
async def ask_question_stream(
    request: QuestionRequest,
    llm_extractor: LLMKeyExtractor = Depends(get_llm_extractor)
):
    """
    Ask a general question about one or more previously uploaded PDFs using LLM with streaming.

    Requires:
    - file_ids: List of file IDs from previous /upload requests
    - question: The question to ask about the documents

    Returns:
    - Streaming response with Server-Sent Events (SSE) format
    """
    pdf_storage = get_pdf_storage()

    # Load the processed PDF data for each file_id from memory
    pdf_data_list = []
    for file_id in request.file_ids:
        if file_id not in pdf_storage:
            raise HTTPException(
                status_code=404,
                detail=f"File with ID {file_id} not found. Please upload the file first."
            )

        pdf_data_list.append(pdf_storage[file_id])

    # Convert conversation history to dict format for LLM
    conversation_history = None
    if request.conversation_history:
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]

    async def event_generator():
        """Generate SSE events for streaming response."""
        try:
            async for chunk, system_message in llm_extractor.answer_question_stream(
                question=request.question,
                pdf_data=pdf_data_list,
                conversation_history=conversation_history,
                model_name=request.model_name
            ):
                # Send system message if this is the first message
                if system_message:
                    system_event = {
                        "type": "system_message",
                        "content": system_message
                    }
                    yield f"data: {json.dumps(system_event)}\n\n"

                # Send the chunk
                chunk_event = {
                    "type": "chunk",
                    "content": chunk
                }
                yield f"data: {json.dumps(chunk_event)}\n\n"

            # Send completion event
            done_event = {
                "type": "done"
            }
            yield f"data: {json.dumps(done_event)}\n\n"

        except Exception as e:
            logger.error(f"Error during streaming: {str(e)}")
            error_event = {
                "type": "error",
                "content": str(e)
            }
            yield f"data: {json.dumps(error_event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
