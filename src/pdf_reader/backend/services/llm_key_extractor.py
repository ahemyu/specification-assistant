"""LLM-based key extraction service using LangChain and OpenAI."""
import asyncio
import logging
import sys
from pathlib import Path

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

# Add parent directory to path to allow imports from pdf_reader root
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.schemas.domain import KeyExtractionResult, PDFComparisonResult
from backend.services.llm_prompts import (
    KEY_EXTRACTION_PROMPT,
    PDF_COMPARISON_PROMPT,
    QA_SYSTEM_PROMPT,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)



class LLMKeyExtractor:
    """Service class for extracting specific keys from PDF text using LLM."""

    def __init__(self, api_key: str, model_name: str = "gpt-4.1"):
        """
        Initialize the LLM key extractor.

        Args:
            api_key: Azure OpenAI API key
            model_name: Name of the OpenAI model to use for key extraction (default: gpt-4.1)
        """
        # Azure OpenAI endpoint from azure_demo.txt
        base_url = "https://westeurope.api.cognitive.microsoft.com/openai/v1/"

        self.llm = ChatOpenAI(
            model=model_name,
            api_key=api_key,
            base_url=base_url,
            temperature=0  # Use deterministic output for extraction tasks
        )
        # Store API credentials for creating Q&A LLM instances with different models
        self.api_key = api_key
        self.base_url = base_url
        self.structured_llm = self.llm.with_structured_output(KeyExtractionResult)
        logger.info(f"Initialized LLM key extractor with model: {model_name}")

    async def _extract_key(
        self,
        key_name: str,
        pdf_data: list[dict]
    ) -> KeyExtractionResult:
        """
        Extract a specific key from one or more processed PDFs asynchronously.

        Args:
            key_name: The name of the key to extract (e.g., "voltage rating", "manufacturer")
            pdf_data: List of dictionaries containing PDF data from process_single_pdf_to_dict()
                      Each dict should have: {"filename": str, "total_pages": int, "pages": [...]}

        Returns:
            KeyExtractionResult with the extracted key value and source locations
        """
        logger.info(f"Extracting key '{key_name}' from {len(pdf_data)} PDF(s)")

        # Use pre-formatted text that was created during PDF processing
        full_context = "".join([pdf.get("formatted_text", "") for pdf in pdf_data])

        # Build the prompt
        prompt = f"""
                You are an expert at extracting specific information from technical documents.
                Your task is to find and extract the value for the key: "{key_name}"
                Below are the contents of one or more PDF documents. Each document includes
                page numbers to help you track where information is found.

                COORDINATE SYSTEM:
                The text is annotated with location markers:
                - [line_id: X_Y] for regular text lines (e.g., [line_id: 3_5] = Page 3, Line 5)
                - [cell_id: X_tY_rZ_cW] for table cells (e.g., [cell_id: 3_t0_r1_c2] = Page 3, Table 0, Row 1, Column 2)

                IMPORTANT INSTRUCTIONS:
                1. Extract the exact value/s for the requested key
                2. Record ALL PDF filenames and page numbers where you found relevant information
                   (they COULD be spread to different pdfs/pages)
                3. CRITICAL: When you find the key's value, you MUST identify and return the line_id(s)
                   or cell_id(s) where the value appears. Include ALL IDs that contain the complete answer.
                   Put these IDs in the matched_line_ids field as a list of strings.
                4. Provide a clear description of where and how you found the information
                5. If the key is not found in any document, set key_value to null and explain
                   in the description
                6. Be precise about page numbers - always reference the specific pages where
                   information was found

                DOCUMENT CONTENTS:
                {full_context}
                Now extract the key "{key_name}" and provide the structured output."""

        try:
            result = await self.structured_llm.ainvoke(prompt)
            logger.info(f"Successfully extracted key '{key_name}'")
            return result
        except Exception as e:
            logger.error(f"Error extracting key '{key_name}': {str(e)}")
            raise

    async def extract_keys(
        self,
        key_names: list[str],
        pdf_data: list[dict]
    ) -> dict:
        """
        Extract multiple keys from the same PDF data asynchronously in parallel.

        Args:
            key_names: List of key names to extract
            pdf_data: List of dictionaries containing PDF data

        Returns:
            Dictionary mapping key names to their extraction results
        """
        logger.info(f"Starting parallel extraction of {len(key_names)} keys")

        # Create a task for each key extraction
        async def extract_with_error_handling(key_name: str):
            try:
                return key_name, await self._extract_key(key_name, pdf_data)
            except Exception as e:
                logger.error(f"Failed to extract key '{key_name}': {str(e)}")
                # Return None for failed extractions
                return key_name, None

        # Execute all extractions in parallel
        extraction_results = await asyncio.gather(
            *[extract_with_error_handling(key_name) for key_name in key_names]
        )

        # Convert list of tuples to dictionary
        results = dict(extraction_results)
        logger.info(f"Completed parallel extraction of {len(key_names)} keys")

        return results


    async def answer_question_stream(
        self,
        question: str,
        pdf_data: list[dict],
        conversation_history: list[dict[str, str]] | None = None,
        model_name: str | None = None
    ):
        """
        Answer a general question about the PDF documents with streaming response.

        Args:
            question: The user's question about the documents
            pdf_data: List of dictionaries containing PDF data from process_single_pdf_to_dict()
                      Each dict should have: {"filename": str, "total_pages": int, "pages": [...]}
            conversation_history: Optional list of previous messages in format
                                  [{"role": "system"|"user"|"assistant", "content": str}]
            model_name: Optional model name (defaults to gpt-4.1)

        Yields:
            Tuples of (chunk_content, system_message_content)
            - chunk_content: Text chunk from the LLM response
            - system_message_content: The system message content (only on first chunk for first
                                      message, None otherwise)
        """
        logger.info(f"Answering question with streaming about {len(pdf_data)} PDF(s)")

        # Create Q&A LLM instance with the specified model
        selected_model = model_name or "gpt-4.1"
        qa_llm = ChatOpenAI(
            model=selected_model,
            api_key=self.api_key,
            base_url=self.base_url,
            temperature=0.3
        )
        logger.info(f"Using model: {selected_model}")

        # Check if we have a system message in conversation history
        has_system_message = (
            conversation_history
            and len(conversation_history) > 0
            and conversation_history[0].get("role") == "system"
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
            # Use pre-formatted text that was created during PDF processing
            full_context = "".join([pdf.get("formatted_text", "") for pdf in pdf_data])

            # Build system message using the template
            system_content = QA_SYSTEM_PROMPT.format(document_contents=full_context)

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
            async for chunk in qa_llm.astream(messages):
                content = chunk.content if hasattr(chunk, 'content') else str(chunk)
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

    async def compare_pdfs(
        self,
        base_pdf_data: dict,
        new_pdf_data: dict,
        additional_context: str = ""
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
        logger.info(
            f"Comparing PDFs: '{base_pdf_data['filename']}' vs '{new_pdf_data['filename']}'"
        )

        # Use pre-formatted text from both PDFs
        base_context = base_pdf_data.get("formatted_text", "")
        new_context = new_pdf_data.get("formatted_text", "")

        # Build the comparison prompt using the template
        additional_context_section = (
            f"Additional context about what to focus on: {additional_context}"
            if additional_context
            else ""
        )
        prompt = PDF_COMPARISON_PROMPT.format(
            additional_context_section=additional_context_section,
            base_filename=base_pdf_data['filename'],
            base_context=base_context,
            new_filename=new_pdf_data['filename'],
            new_context=new_context
        )

        try:
            # Create a structured output LLM for comparison
            structured_comparison_llm = self.llm.with_structured_output(PDFComparisonResult)
            result = await structured_comparison_llm.ainvoke(prompt)
            logger.info(
                f"Successfully compared PDFs. Found {result.total_changes} changes."
            )
            return result
        except Exception as e:
            logger.error(f"Error comparing PDFs: {str(e)}")
            raise
