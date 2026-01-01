"""LLM-based key extraction service using LangChain and Google Gemini."""

import asyncio
import logging
import time

from backend.config import (
    DEFAULT_BATCH_SIZE,
    GEMINI_MODEL,
    GOOGLE_API_KEY,
    MAX_CONCURRENT_BATCHES,
)
from backend.schemas.domain import (
    CoreWindingCountResult,
    KeyExtractionResult,
    MultiKeyExtractionResult,
    PDFComparisonResult,
    ProductTypeDetectionResult,
)
from backend.services.key_metadata import format_key_metadata_for_prompt
from backend.services.llm_prompts import (
    CORE_WINDING_COUNT_PROMPT,
    MULTI_KEY_EXTRACTION_PROMPT,
    PDF_COMPARISON_PROMPT,
    PRODUCT_TYPE_DETECTION_PROMPT,
    QA_SYSTEM_PROMPT,
)
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)


def _create_gemini_llm(temperature: float = 1.0) -> ChatGoogleGenerativeAI:
    """Create a ChatGoogleGenerativeAI instance for Google Gemini models."""
    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY is not set. LLM features will fail.")
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        google_api_key=GOOGLE_API_KEY,
        temperature=temperature,
    )


def _build_pdf_context(pdf_data: list[dict]) -> str:
    """
    Build a combined text context from multiple PDF data dictionaries.

    Args:
        pdf_data: List of dictionaries containing PDF data from process_single_pdf()
                  Each dict should have a "formatted_text" key.

    Returns:
        Combined formatted text from all PDFs as a single string.
    """
    return "".join(pdf.get("formatted_text", "") for pdf in pdf_data)


class LLMKeyExtractor:
    """Service class for extracting specific keys from PDF text using LLM.

    Model usage:
    - gemini-2.5-flash: Used for all operations (extraction, chat, detection).
    """

    def __init__(self):
        """Initialize the LLM key extractor."""
        # Initialize Gemini LLM
        self.llm = _create_gemini_llm()

        # Structured output models
        self.multi_structured_llm = self.llm.with_structured_output(MultiKeyExtractionResult)
        self.comparison_llm = self.llm.with_structured_output(PDFComparisonResult)
        self.product_type_llm = self.llm.with_structured_output(ProductTypeDetectionResult)
        self.core_winding_llm = self.llm.with_structured_output(CoreWindingCountResult)

        # Chat LLM
        self.qa_llm = _create_gemini_llm()

        logger.info(f"Initialized LLM key extractor using {GEMINI_MODEL}")

    async def _extract_keys_batch(
        self,
        key_names: list[str],
        pdf_data: list[dict],
        language: str = "en",
    ) -> dict[str, KeyExtractionResult | None]:
        """
        Extract a batch of keys from the same PDF data in a single LLM call.

        Args:
            key_names: List of key names to extract in this batch
            pdf_data: List of PDF data dictionaries
            language: Language for extracted values and descriptions ("en" or "de")

        Returns:
            Dictionary mapping key names to KeyExtractionResult objects (or None if failed)
        """
        logger.info("Extracting batch of %s keys from %s PDF(s) using Gemini", len(key_names), len(pdf_data))

        full_context = _build_pdf_context(pdf_data)

        # Build keys_section
        keys_lines = [f"- {name}" for name in key_names]
        keys_section = "\n".join(keys_lines)

        # Build combined metadata section (optional, only include keys that have metadata)
        metadata_items: list[str] = []
        for key_name in key_names:
            metadata_text = format_key_metadata_for_prompt(key_name)
            if metadata_text:
                metadata_items.append(f"- {key_name}: {metadata_text}")
        key_metadata_section = ""
        if metadata_items:
            key_metadata_section = "KEY METADATA:\n" + "\n".join(metadata_items) + "\n"

        # Set the "not found" text based on language
        not_found_text = "Nicht gefunden" if language == "de" else "Not found"

        prompt = MULTI_KEY_EXTRACTION_PROMPT.format(
            keys_section=keys_section,
            key_metadata_section=key_metadata_section,
            full_context=full_context,
            language=language,
            not_found_text=not_found_text,
        )

        # Estimate tokens for logging purposes (rough estimate: ~4 chars per token)
        estimated_tokens = len(prompt) // 4
        logger.info(f"Estimated tokens for batch of {len(key_names)} keys: ~{estimated_tokens:,}")

        # Track actual LLM call time
        llm_call_start = time.time()

        try:
            multi_result: MultiKeyExtractionResult = await self.multi_structured_llm.ainvoke(prompt)
            llm_call_time = time.time() - llm_call_start
            logger.info(f"Successfully extracted batch of {len(key_names)} keys in {llm_call_time:.1f}s")

            # Convert list of items to a mapping keyed by key_name
            results_by_key: dict[str, KeyExtractionResult | None] = {
                item.key_name: item.result for item in multi_result.items
            }

            # Ensure that every requested key is present in the mapping
            for key_name in key_names:
                if key_name not in results_by_key:
                    results_by_key[key_name] = None

            return results_by_key
        except Exception as e:
            llm_call_time = time.time() - llm_call_start
            logger.error(f"Error extracting batch of keys {key_names} after {llm_call_time:.1f}s: {str(e)}")
            return {name: None for name in key_names}

    async def extract_keys(
        self,
        key_names: list[str],
        pdf_data: list[dict],
        batch_size: int = DEFAULT_BATCH_SIZE,
        language: str = "en",
    ) -> dict[str, KeyExtractionResult | None]:
        """
        Extract multiple keys from the same PDF data using batched LLM calls.

        Keys are grouped into batches to reduce the number of requests while respecting
        context limits and optimizing for latency.

        Args:
            key_names: List of key names to extract
            pdf_data: List of PDF data dictionaries
            batch_size: Number of keys per batch
            language: Language for extracted values and descriptions ("en" or "de")

        Returns:
            Dictionary mapping key names to KeyExtractionResult objects (or None)
        """
        if not key_names:
            return {}

        # Use the configured max concurrent batches (default 5 for Gemini)
        max_concurrent = MAX_CONCURRENT_BATCHES
        start_time = time.time()

        logger.info(
            "Starting batched extraction of %s keys (batch_size=%s, max_concurrent=%s, model=Gemini)",
            len(key_names),
            batch_size,
            max_concurrent,
        )

        # Split keys into batches
        batches: list[list[str]] = [key_names[i : i + batch_size] for i in range(0, len(key_names), batch_size)]

        logger.info(f"Split {len(key_names)} keys into {len(batches)} batches")

        semaphore = asyncio.Semaphore(max_concurrent)

        async def run_batch(batch_index: int, batch: list[str]) -> dict[str, KeyExtractionResult | None]:
            async with semaphore:
                return await self._extract_keys_batch(batch, pdf_data, language)

        # Execute batches (with concurrency limit via semaphore)
        batch_results_list = await asyncio.gather(*(run_batch(i, batch) for i, batch in enumerate(batches)))

        # Merge all batch results into a single mapping
        merged_results: dict[str, KeyExtractionResult | None] = {}
        for batch_results in batch_results_list:
            merged_results.update(batch_results)

        elapsed_time = time.time() - start_time
        logger.info(
            f"Completed batched extraction of {len(key_names)} keys in {elapsed_time:.1f}s "
            f"({len(batches)} requests, avg {elapsed_time / len(batches):.1f}s per request)"
        )

        return merged_results

    async def answer_question_stream(
        self,
        question: str,
        pdf_data: list[dict],
        conversation_history: list[dict[str, str]] | None = None,
        language: str = "en",
    ):
        """
        Answer a general question about the PDF documents with streaming response.

        Args:
            question: The user's question about the documents
            pdf_data: List of dictionaries containing PDF data from process_single_pdf_to_dict()
                      Each dict should have: {"filename": str, "total_pages": int, "pages": [...]}
            conversation_history: Optional list of previous messages in format
                                  [{"role": "system"|"user"|"assistant", "content": str}]
            language: Language for the response ("en" or "de")

        Yields:
            Tuples of (chunk_content, system_message_content)
            - chunk_content: Text chunk from the LLM response
            - system_message_content: The system message content (only on first chunk for first
                                      message, None otherwise)
        """
        logger.info(f"Answering question with streaming about {len(pdf_data)} PDF(s) using Gemini")

        # Check if we have a system message in conversation history
        has_system_message = (
            conversation_history and len(conversation_history) > 0 and conversation_history[0].get("role") == "system"
        )

        system_message_to_return = None

        # Build message list
        messages = []

        if has_system_message:
            # Use existing system message from history
            messages.append(SystemMessage(content=conversation_history[0]["content"]))

            # Add rest of conversation history (skip first system message)
            for msg in conversation_history[1:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        else:
            # No system message in history - create new one and add conversation history
            full_context = _build_pdf_context(pdf_data)

            # Build system message using the template
            system_content = QA_SYSTEM_PROMPT.format(document_contents=full_context, language=language)

            messages.append(SystemMessage(content=system_content))
            system_message_to_return = system_content

            # Add all conversation history (system messages were filtered out by frontend)
            for msg in conversation_history or []:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

        # Add current question
        messages.append(HumanMessage(content=question))

        try:
            first_chunk = True
            async for chunk in self.qa_llm.astream(messages):
                content = chunk.content if hasattr(chunk, "content") else str(chunk)
                if content:
                    # Yield system message only with the first chunk
                    if first_chunk:
                        yield content, system_message_to_return
                        first_chunk = False
                    else:
                        yield content, None
            logger.info("Successfully answered question with streaming")
        except Exception as e:
            logger.error(f"Error answering question with streaming: {str(e)}")
            raise

    async def detect_product_type(self, pdf_data: list[dict]) -> ProductTypeDetectionResult:
        """
        Detect the product type from PDF specifications.

        Args:
            pdf_data: List of dictionaries containing PDF data from process_single_pdf()
                      Each dict should have: {"filename": str, "total_pages": int, "pages": [...]}

        Returns:
            ProductTypeDetectionResult with detected type, confidence, and evidence
        """
        logger.info(f"Detecting product type from {len(pdf_data)} PDF(s) using Gemini")

        full_context = _build_pdf_context(pdf_data)
        prompt = PRODUCT_TYPE_DETECTION_PROMPT.format(full_context=full_context)

        try:
            result = await self.product_type_llm.ainvoke(prompt)
            logger.info(f"Successfully detected product type: {result.product_type} (confidence: {result.confidence})")
            return result
        except Exception as e:
            logger.error(f"Error detecting product type: {str(e)}")
            raise

    async def detect_core_winding_count(self, pdf_data: list[dict], product_type: str) -> CoreWindingCountResult:
        """
        Detect the maximum number of cores and/or windings based on product type.

        Args:
            pdf_data: List of dictionaries containing PDF data from process_single_pdf()
            product_type: Product type ('Stromwandler', 'Spannungswandler', 'Kombiwandler')

        Returns:
            CoreWindingCountResult with max core and winding numbers
        """
        logger.info(f"Detecting core/winding count for {product_type} from {len(pdf_data)} PDF(s) using Gemini")

        full_context = _build_pdf_context(pdf_data)

        # Build product-specific search instructions
        if product_type == "Stromwandler":
            search_target = "cores (Kern)"
            search_instructions = """**Looking for Cores (Kern):**
- Search for "Kern 1", "Kern 2", up to "Kern 7"
- Check for parameters like "Genauigkeitsklasse Kern X", "Nennstrom primär (A) Kern X"
- Look in tables for core-specific specifications
- Set max_core_number to the highest Kern number found
- Set max_winding_number to 0 (not applicable for Stromwandler)"""
        elif product_type == "Spannungswandler":
            search_target = "windings (Wicklung)"
            search_instructions = """**Looking for Windings (Wicklung):**
- Search for "Wicklung 1", "Wicklung 2", up to "Wicklung 5"
- Check for parameters like "Genauigkeitsklasse Wicklung X",
"Nennspannung primär (V) Wicklung X"
- Look in tables for winding-specific specifications
- Set max_winding_number to the highest Wicklung number found
- Set max_core_number to 0 (not applicable for Spannungswandler)"""
        else:  # Kombiwandler
            search_target = "cores (Kern) and windings (Wicklung)"
            search_instructions = """**Looking for both Cores AND Windings:**

For Cores (Kern):
- Search for "Kern 1" through "Kern 7"
- Check parameters like "Genauigkeitsklasse Kern X", "Nennstrom primär (A) Kern X"

For Windings (Wicklung):
- Search for "Wicklung 1" through "Wicklung 5"
- Check parameters like "Genauigkeitsklasse Wicklung X", "Nennspannung primär (V) Wicklung X"

Return both max_core_number and max_winding_number."""

        prompt = CORE_WINDING_COUNT_PROMPT.format(
            product_type=product_type,
            search_target=search_target,
            search_instructions=search_instructions,
            full_context=full_context,
        )

        try:
            result = await self.core_winding_llm.ainvoke(prompt)
            logger.info(
                f"Successfully detected for {product_type}: "
                f"max_core={result.max_core_number}, max_winding={result.max_winding_number}"
            )
            return result
        except Exception as e:
            logger.error(f"Error detecting core/winding count: {str(e)}")
            raise

    async def compare_pdfs(
        self, base_pdf_data: dict, new_pdf_data: dict, additional_context: str = ""
    ) -> PDFComparisonResult:
        """
        Compare two PDF versions and identify changes in specifications.

        Args:
            base_pdf_data: Dictionary containing the base/old PDF data
            new_pdf_data: Dictionary containing the new/updated PDF data
            additional_context: Optional additional context to help the LLM understand
                                what types of changes are most relevant

        Returns:
            PDFComparisonResult with summary and list of changes
        """
        logger.info(f"Comparing PDFs: '{base_pdf_data['filename']}' vs '{new_pdf_data['filename']}' using Gemini")

        base_context = _build_pdf_context([base_pdf_data])
        new_context = _build_pdf_context([new_pdf_data])

        # Build the comparison prompt using the template
        additional_context_section = (
            f"Additional context about what to focus on: {additional_context}" if additional_context else ""
        )
        prompt = PDF_COMPARISON_PROMPT.format(
            additional_context_section=additional_context_section,
            base_filename=base_pdf_data["filename"],
            base_context=base_context,
            new_filename=new_pdf_data["filename"],
            new_context=new_context,
        )

        try:
            result = await self.comparison_llm.ainvoke(prompt)
            logger.info(f"Successfully compared PDFs. Found {result.total_changes} changes.")
            return result
        except Exception as e:
            logger.error(f"Error comparing PDFs: {str(e)}")
            raise
