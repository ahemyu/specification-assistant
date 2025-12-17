"""Router for PDF download endpoints."""

import logging
from io import BytesIO

from backend.schemas.requests import ExcelDownloadRequest
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["pdf"])


@router.post("/download-extraction-pdf")
async def download_extraction_pdf(request: ExcelDownloadRequest):
    """
    Download extraction results as a PDF file with key-value pairs in table format.

    Requires:
    - extraction_results: Dictionary mapping key names to their extraction results

    Returns:
    - PDF file with extracted key-value pairs in a clean table format
    """
    try:
        # Prepare data for PDF table
        table_data = []

        # Add header row
        table_data.append(["Key", "Extracted Value"])

        # Add data rows
        for key_name, result in request.extraction_results.items():
            if result is None:
                table_data.append([key_name, "Extraction failed"])
                continue

            # Extract value from result
            if isinstance(result, dict):
                key_value = result.get("key_value", "Not found")
            else:
                key_value = getattr(result, "key_value", "Not found")

            table_data.append([key_name, key_value if key_value is not None else "Not found"])

        # Create PDF in memory
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            title="Extracted Keys Report",
            leftMargin=0.5 * inch,
            rightMargin=0.5 * inch,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch,
        )

        # Create styles
        styles = getSampleStyleSheet()

        # Custom style for table header
        header_style = ParagraphStyle(
            name="TableHeader",
            parent=styles["Heading2"],
            fontSize=12,
            leading=14,
            textColor=colors.white,
            alignment=1,  # Center alignment
            spaceAfter=6,
        )

        # Custom style for table content
        content_style = ParagraphStyle(
            name="TableContent", parent=styles["Normal"], fontSize=10, leading=12, spaceAfter=6
        )

        # Create story (content elements)
        story = []

        # Add title
        story.append(Paragraph("Extracted Keys Report", styles["Title"]))
        story.append(Spacer(1, 0.2 * inch))

        # Create table with styled data
        styled_table_data = []

        # Add styled header row
        styled_table_data.append([Paragraph("Key", header_style), Paragraph("Extracted Value", header_style)])

        # Add styled data rows
        for row in table_data[1:]:
            styled_table_data.append([Paragraph(row[0], content_style), Paragraph(row[1], content_style)])

        # Create table
        table = Table(styled_table_data, colWidths=[3 * inch, 3 * inch])

        # Style the table
        table_style = TableStyle(
            [
                # Header row styling
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                # Data rows styling
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.black),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
                ("TOPPADDING", (0, 1), (-1, -1), 8),
                ("LEFTPADDING", (0, 1), (-1, -1), 6),
                ("RIGHTPADDING", (0, 1), (-1, -1), 6),
                # Grid lines
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                # Alternating row colors
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
            ]
        )

        # Apply alternating row colors
        for i in range(1, len(styled_table_data)):
            if i % 2 == 0:
                table_style.add("BACKGROUND", (0, i), (-1, i), colors.lightgrey)

        table.setStyle(table_style)

        # Add table to story
        story.append(table)

        # Build PDF
        doc.build(story)

        # Reset buffer position
        buffer.seek(0)

        # Return as streaming response
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=extracted_keys.pdf"},
        )

    except Exception as e:
        logger.error(f"Error generating PDF file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating PDF file: {str(e)}")
