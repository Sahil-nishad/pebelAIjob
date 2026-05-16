"""PDF parsing service."""

import logging
import httpx
import pdfplumber
from io import BytesIO

from app.config import settings

logger = logging.getLogger(__name__)


class PDFParser:
    """Service for parsing PDF files."""

    async def extract_text(self, file_url: str) -> str:
        """
        Extract text from a PDF file stored in Supabase Storage.

        Uses service role key for authenticated download (private bucket).
        """
        try:
            # Build authenticated download URL
            # file_url looks like: https://xxx.supabase.co/storage/v1/object/public/resumes/user_id/file.pdf
            # We need: https://xxx.supabase.co/storage/v1/object/resumes/user_id/file.pdf (without 'public/')
            download_url = file_url.replace('/object/public/', '/object/')

            # Download PDF with service role key
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    download_url,
                    headers={
                        "Authorization": f"Bearer {settings.supabase_service_role_key}",
                        "apikey": settings.supabase_service_role_key,
                    },
                )
                response.raise_for_status()
                pdf_content = response.content

            # Extract text using pdfplumber
            text_content = []

            with pdfplumber.open(BytesIO(pdf_content)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        text_content.append(text)

            full_text = "\n\n".join(text_content)

            if not full_text.strip():
                raise ValueError("No text could be extracted from PDF")

            logger.info(f"Extracted {len(full_text)} chars from PDF")
            return full_text

        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            raise ValueError(f"Failed to parse PDF: {str(e)}")

    async def extract_text_from_docx(self, file_url: str) -> str:
        """Extract text from a DOCX file stored in Supabase Storage."""
        try:
            from docx import Document

            download_url = file_url.replace('/object/public/', '/object/')

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    download_url,
                    headers={
                        "Authorization": f"Bearer {settings.supabase_service_role_key}",
                        "apikey": settings.supabase_service_role_key,
                    },
                )
                response.raise_for_status()
                docx_content = response.content

            doc = Document(BytesIO(docx_content))
            text_content = []

            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_content.append(paragraph.text)

            full_text = "\n\n".join(text_content)

            if not full_text.strip():
                raise ValueError("No text could be extracted from DOCX")

            return full_text

        except Exception as e:
            logger.error(f"Failed to extract text from DOCX: {e}")
            raise ValueError(f"Failed to parse DOCX: {str(e)}")
