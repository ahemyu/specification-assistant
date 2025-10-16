"""LLM-based key extraction service using LangChain and Google Gemini."""
import logging
from typing import List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class SourceLocation(BaseModel):
    """Location information for where a key was found."""

    pdf_filename: str = Field(description="Name of the PDF file where the information was found")
    page_numbers: List[int] = Field(description="List of page numbers where the information was found")


class KeyExtractionResult(BaseModel):
    """Structured output for key extraction from PDF text."""

    key_value: Optional[str] = Field(
        description="The extracted value for the requested key. If not found, this should be null."
    )
    source_locations: List[SourceLocation] = Field(
        description="List of source locations (PDF files and page numbers) where the key information was found"
    )
    description: str = Field(
        description="A brief description of where and how the key was found in the documents"
    )


class LLMKeyExtractor:
    """Service class for extracting specific keys from PDF text using LLM."""

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash"):
        """
        Initialize the LLM key extractor.

        Args:
            api_key: Google API key for Gemini
            model_name: Name of the Gemini model to use (default: gemini-2.0-flash-exp)
        """
        self.llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0  # Use deterministic output for extraction tasks
        )
        self.qa_llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0.3  # Slightly higher temperature for more natural Q&A responses
        )
        self.structured_llm = self.llm.with_structured_output(KeyExtractionResult)
        logger.info(f"Initialized LLM key extractor with model: {model_name}")

    def extract_key(
        self,
        key_name: str,
        pdf_data: List[dict],
        additional_context: str = ""
    ) -> KeyExtractionResult:
        """
        Extract a specific key from one or more processed PDFs.

        Args:
            key_name: The name of the key to extract (e.g., "voltage rating", "manufacturer")
            pdf_data: List of dictionaries containing PDF data from process_single_pdf_to_dict()
                      Each dict should have: {"filename": str, "total_pages": int, "pages": [...]}
            additional_context: Optional additional context to help the LLM understand what to look for

        Returns:
            KeyExtractionResult with the extracted key value and source locations
        """
        logger.info(f"Extracting key '{key_name}' from {len(pdf_data)} PDF(s)")

        # Build the context from all PDFs
        context_parts = []
        for pdf in pdf_data:
            filename = pdf.get("filename", "unknown.pdf")
            pages = pdf.get("pages", [])

            context_parts.append(f"\n{'='*80}\nDOCUMENT: {filename}\n{'='*80}\n")

            for page_data in pages:
                page_num = page_data.get("page_number", 0)
                text = page_data.get("text", "")
                tables = page_data.get("tables", [])

                context_parts.append(f"\n--- PAGE {page_num} ---\n")

                if text:
                    context_parts.append(f"Text content:\n{text}\n")

                if tables:
                    context_parts.append(f"\nTables on page {page_num}:\n")
                    for i, table in enumerate(tables, 1):
                        context_parts.append(f"Table {i}:\n")
                        for row in table:
                            context_parts.append(" | ".join([str(cell) if cell is not None else "" for cell in row]))
                        context_parts.append("\n")

        full_context = "".join(context_parts)

        # Build the prompt
        prompt = f"""
        You are an expert at extracting specific information from technical documents.
        Your task is to find and extract the value for the key: "{key_name}"
        {f"Additional context: {additional_context}" if additional_context else ""}
        Below are the contents of one or more PDF documents. Each document includes page numbers to help you track where information is found.
        IMPORTANT INSTRUCTIONS:
        1. Extract the exact value/s for the requested key
        2. Record ALL PDF filenames and page numbers where you found relevant information (they COULD be spread to different pdfs/pages)
        3. Provide a clear description of where and how you found the information
        4. If the key is not found in any document, set key_value to null and explain in the description
        5. Be precise about page numbers - always reference the specific pages where information was found
        
        DOCUMENT CONTENTS:
        {full_context}
        Now extract the key "{key_name}" and provide the structured output."""

        try:
            result = self.structured_llm.invoke(prompt)
            logger.info(f"Successfully extracted key '{key_name}'")
            return result
        except Exception as e:
            logger.error(f"Error extracting key '{key_name}': {str(e)}")
            raise

    def extract_multiple_keys(
        self,
        key_names: List[str],
        pdf_data: List[dict],
        additional_context: str = ""
    ) -> dict:
        """
        Extract multiple keys from the same PDF data.

        Args:
            key_names: List of key names to extract
            pdf_data: List of dictionaries containing PDF data
            additional_context: Optional additional context

        Returns:
            Dictionary mapping key names to their extraction results
        """
        results = {}
        for key_name in key_names:
            try:
                results[key_name] = self.extract_key(key_name, pdf_data, additional_context)
            except Exception as e:
                logger.error(f"Failed to extract key '{key_name}': {str(e)}")
                # Continue with other keys even if one fails
                results[key_name] = None

        return results

    def answer_question(
        self,
        question: str,
        pdf_data: List[dict]
    ) -> str:
        """
        Answer a general question about the PDF documents.

        Args:
            question: The user's question about the documents
            pdf_data: List of dictionaries containing PDF data from process_single_pdf_to_dict()
                      Each dict should have: {"filename": str, "total_pages": int, "pages": [...]}

        Returns:
            String containing the LLM's answer to the question
        """
        logger.info(f"Answering question about {len(pdf_data)} PDF(s)")

        # Build the context from all PDFs
        context_parts = []
        for pdf in pdf_data:
            filename = pdf.get("filename", "unknown.pdf")
            pages = pdf.get("pages", [])

            context_parts.append(f"\n{'='*80}\nDOCUMENT: {filename}\n{'='*80}\n")

            for page_data in pages:
                page_num = page_data.get("page_number", 0)
                text = page_data.get("text", "")
                tables = page_data.get("tables", [])

                context_parts.append(f"\n--- PAGE {page_num} ---\n")

                if text:
                    context_parts.append(f"Text content:\n{text}\n")

                if tables:
                    context_parts.append(f"\nTables on page {page_num}:\n")
                    for i, table in enumerate(tables, 1):
                        context_parts.append(f"Table {i}:\n")
                        for row in table:
                            context_parts.append(" | ".join([str(cell) if cell is not None else "" for cell in row]))
                        context_parts.append("\n")

        full_context = "".join(context_parts)

        # Build the prompt
        prompt = f"""
            You are an expert assistant helping users understand technical documents.
            Below are the contents of one or more PDF documents. Each document includes page numbers.
            Your task is to answer the following question based on the provided documents:

            QUESTION: {question}

            IMPORTANT INSTRUCTIONS:
            1. Provide a clear, comprehensive answer based on the document contents
            2. If referencing specific information, mention which document and page number it came from
            3. If the answer cannot be found in the documents, clearly state that
            4. Be precise and cite page numbers when possible
            5. If the question is ambiguous, provide the most reasonable interpretation

            DOCUMENT CONTENTS:
            {full_context}

            Now answer the question in a clear and helpful way:
            """

        try:
            response = self.qa_llm.invoke(prompt)
            answer = response.content if hasattr(response, 'content') else str(response)
            logger.info("Successfully answered question")
            return answer
        except Exception as e:
            logger.error(f"Error answering question: {str(e)}")
            raise
