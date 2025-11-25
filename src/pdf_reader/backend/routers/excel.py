"""Router for Excel download endpoints."""
import logging
from io import BytesIO

import pandas as pd
from backend.schemas.requests import ExcelDownloadRequest
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["excel"])


@router.post("/download-extraction-excel")
async def download_extraction_excel(request: ExcelDownloadRequest):
    """
    Download extraction results as an Excel file with four columns: Key, Value, Description, and Reference.

    Requires:
    - extraction_results: Dictionary mapping key names to their extraction results

    Returns:
    - Excel file (.xlsx) with extracted key-value pairs, descriptions, and references
    """
    try:
        # Prepare data for Excel
        data_rows = []

        for key_name, result in request.extraction_results.items():
            # Handle None results (failed extractions)
            if result is None:
                data_rows.append({
                    "Key": key_name,
                    "Value": "Extraction failed",
                    "Description": "Extraction failed",
                    "Reference": "Extraction failed"
                })
                continue

            # Extract value and description from result
            # Handle both single key results and multiple key results
            if isinstance(result, dict):
                key_value = result.get("key_value", "Not found")
                description = result.get("description", "No description")
                source_locations = result.get("source_locations", [])
            else:
                key_value = getattr(result, "key_value", "Not found")
                description = getattr(result, "description", "No description")
                source_locations = getattr(result, "source_locations", [])

            # Format references
            if source_locations:
                references = []
                for source in source_locations:
                    # Handle both dict and object source formats
                    if isinstance(source, dict):
                        pdf_filename = source.get("pdf_filename", "Unknown")
                        page_numbers = source.get("page_numbers", [])
                    else:
                        pdf_filename = getattr(source, "pdf_filename", "Unknown")
                        page_numbers = getattr(source, "page_numbers", [])

                    pages_str = ", ".join(map(str, page_numbers))
                    references.append(f"{pdf_filename} (Pages: {pages_str})")
                reference = "; ".join(references)
            else:
                reference = "No reference"

            data_rows.append({
                "Key": key_name,
                "Value": key_value if key_value is not None else "Not found",
                "Description": description,
                "Reference": reference
            })

        # Create DataFrame
        df = pd.DataFrame(data_rows)

        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Extracted Keys')

        output.seek(0)

        # Return as streaming response
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=extracted_keys.xlsx"
            }
        )

    except Exception as e:
        logger.error(f"Error generating Excel file: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating Excel file: {str(e)}"
        )
