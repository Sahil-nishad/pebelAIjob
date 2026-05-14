"""PDF parsing service."""

import logging
import httpx
import pdfplumber
from io import BytesIO

logger = logging.getLogger(__name__)


class PDFParser:
    """Service for parsing PDF files."""
    
    async def extract_text(self, file_url: str) -> str:
        """
        Extract text from a PDF file.
        
        Args:
            file_url: URL to the PDF file (Supabase Storage URL)
        
        Returns:
            Extracted text content
        """
        try:
            # Download PDF
            async with httpx.AsyncClient() as client:
                response = await client.get(file_url, timeout=30.0)
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
            
            return full_text
        
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            raise ValueError(f"Failed to parse PDF: {str(e)}")
    
    async def extract_text_from_docx(self, file_url: str) -> str:
        """
        Extract text from a DOCX file.
        
        Args:
            file_url: URL to the DOCX file
        
        Returns:
            Extracted text content
        """
        try:
            from docx import Document
            
            # Download DOCX
            async with httpx.AsyncClient() as client:
                response = await client.get(file_url, timeout=30.0)
                response.raise_for_status()
                docx_content = response.content
            
            # Extract text
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
