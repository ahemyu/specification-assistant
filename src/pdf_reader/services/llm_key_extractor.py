"""LLM-based key extraction service using LangChain and Google Gemini."""
import asyncio
import logging
import sys
from pathlib import Path

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

# Add parent directory to path to allow imports from pdf_reader root
sys.path.insert(0, str(Path(__file__).parent.parent))

from schemas.domain import KeyExtractionResult

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)



class LLMKeyExtractor:
    """Service class for extracting specific keys from PDF text using LLM."""

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        """
        Initialize the LLM key extractor.

        Args:
            api_key: Google API key for Gemini
            model_name: Name of the Gemini model to use for key extraction (default: gemini-2.5-flash)
        """
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0  # Use deterministic output for extraction tasks
        )
        # Initialize Q&A LLM instances for both supported models
        self.qa_llm_flash = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0.3
        )
        self.qa_llm_pro = ChatGoogleGenerativeAI(
            model="gemini-2.5-pro",
            google_api_key=api_key,
            temperature=0.3
        )
        self.structured_llm = self.llm.with_structured_output(KeyExtractionResult)
        logger.info(f"Initialized LLM key extractor with model: {model_name}")

    async def _extract_key(
        self,
        key_name: str,
        pdf_data: list[dict],
        additional_context: str = ""
    ) -> KeyExtractionResult:
        """
        Extract a specific key from one or more processed PDFs asynchronously.

        Args:
            key_name: The name of the key to extract (e.g., "voltage rating", "manufacturer")
            pdf_data: List of dictionaries containing PDF data from process_single_pdf_to_dict()
                      Each dict should have: {"filename": str, "total_pages": int, "pages": [...]}
            additional_context: Optional additional context to help the LLM understand what to look for

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
                {f"Additional context: {additional_context}" if additional_context else ""}
                Below are the contents of one or more PDF documents. Each document includes
                page numbers to help you track where information is found.
                IMPORTANT INSTRUCTIONS:
                1. Extract the exact value/s for the requested key
                2. Record ALL PDF filenames and page numbers where you found relevant information
                   (they COULD be spread to different pdfs/pages)
                3. Provide a clear description of where and how you found the information
                4. If the key is not found in any document, set key_value to null and explain
                   in the description
                5. Be precise about page numbers - always reference the specific pages where
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
        pdf_data: list[dict],
        additional_context: str = ""
    ) -> dict:
        """
        Extract multiple keys from the same PDF data asynchronously in parallel.

        Args:
            key_names: List of key names to extract
            pdf_data: List of dictionaries containing PDF data
            additional_context: Optional additional context

        Returns:
            Dictionary mapping key names to their extraction results
        """
        logger.info(f"Starting parallel extraction of {len(key_names)} keys")

        # Create a task for each key extraction
        async def extract_with_error_handling(key_name: str):
            try:
                return key_name, await self._extract_key(key_name, pdf_data, additional_context)
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
            model_name: Optional model name ("gemini-2.5-flash" or "gemini-2.5-pro",
                        defaults to flash)

        Yields:
            Tuples of (chunk_content, system_message_content)
            - chunk_content: Text chunk from the LLM response
            - system_message_content: The system message content (only on first chunk for first
                                      message, None otherwise)
        """
        logger.info(f"Answering question with streaming about {len(pdf_data)} PDF(s)")
        # Select the appropriate Q&A LLM based on model_name
        qa_llm = self.qa_llm_pro if model_name == "gemini-2.5-pro" else self.qa_llm_flash
        logger.info(f"Using model: {model_name or 'gemini-2.5-flash'}")

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
            logger.info("Using existing system message from conversation history")
            messages.append(SystemMessage(content=conversation_history[0]["content"]))

            # Add rest of conversation history (skip first system message)
            for msg in conversation_history[1:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        else:
            # First message in conversation - create system message with document context
            logger.info("Creating new system message with document context")

            # Use pre-formatted text that was created during PDF processing
            full_context = "".join([pdf.get("formatted_text", "") for pdf in pdf_data])

            system_content = f"""You are an expert assistant helping users understand technical documents.
                            Below are the contents of one or more PDF documents. Each document includes page numbers.

                            IMPORTANT INSTRUCTIONS:
                            1. ALWAYS answer in THE SAME LANGUAGE the question was asked in.
                            2. Provide a clear, comprehensive answer based on the document contents
                            3. If referencing specific information, mention which document and page number it came from
                            4. If the answer cannot be found in the documents, clearly state that
                            5. Be precise and cite page numbers when possible
                            6. If the question is ambiguous, provide the most reasonable interpretation
                            7. Take into account the previous conversation context when answering

                            DOCUMENT CONTENTS:
                            {full_context}"""

            messages.append(SystemMessage(content=system_content))
            system_message_to_return = system_content

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
