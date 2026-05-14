"""Supabase Storage service for file uploads."""

import logging
import httpx
from typing import BinaryIO
import uuid

from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Service for managing file uploads to Supabase Storage."""
    
    def __init__(self):
        self.supabase_url = settings.supabase_url
        self.service_role_key = settings.supabase_service_role_key
        self.bucket_name = "resumes"
    
    async def upload_resume(
        self,
        user_id: str,
        file_name: str,
        file_content: bytes,
        content_type: str,
    ) -> str:
        """
        Upload a resume file to Supabase Storage.
        
        Returns:
            Public URL of the uploaded file
        """
        try:
            # Generate unique file path
            file_extension = file_name.split(".")[-1] if "." in file_name else "pdf"
            unique_filename = f"{user_id}/{uuid.uuid4()}.{file_extension}"
            
            # Upload to Supabase Storage
            upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{unique_filename}"
            
            headers = {
                "Authorization": f"Bearer {self.service_role_key}",
                "Content-Type": content_type,
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    upload_url,
                    content=file_content,
                    headers=headers,
                    timeout=60.0
                )
                
                if response.status_code not in [200, 201]:
                    logger.error(f"Upload failed: {response.status_code} - {response.text}")
                    raise ValueError(f"Failed to upload file: {response.text}")
            
            # Return public URL
            public_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{unique_filename}"
            return public_url
        
        except Exception as e:
            logger.error(f"Failed to upload resume: {e}")
            raise ValueError(f"Failed to upload file: {str(e)}")
    
    async def delete_resume(self, file_url: str) -> bool:
        """
        Delete a resume file from Supabase Storage.
        
        Args:
            file_url: Public URL of the file
        
        Returns:
            True if deleted successfully
        """
        try:
            # Extract file path from URL
            # URL format: https://{project}.supabase.co/storage/v1/object/public/resumes/{path}
            path_parts = file_url.split(f"/object/public/{self.bucket_name}/")
            if len(path_parts) != 2:
                raise ValueError("Invalid file URL")
            
            file_path = path_parts[1]
            
            # Delete from Supabase Storage
            delete_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{file_path}"
            
            headers = {
                "Authorization": f"Bearer {self.service_role_key}",
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    delete_url,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code not in [200, 204]:
                    logger.error(f"Delete failed: {response.status_code} - {response.text}")
                    return False
            
            return True
        
        except Exception as e:
            logger.error(f"Failed to delete resume: {e}")
            return False
