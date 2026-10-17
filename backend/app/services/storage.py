import os
import uuid
import io
from typing import Tuple, Optional
from PIL import Image, ImageOps
from fastapi import HTTPException, UploadFile, status
from app.config import settings

# Supported image formats
ALLOWED_FORMATS = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}
ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp"}


def secure_save_image(file: UploadFile, is_resolution_evidence: bool = False) -> Tuple[str, str, int]:
    """
    Validates, sanitizes, strips EXIF data, and securely writes an uploaded image.
    Returns:
        (storage_key, content_type, file_size)
    """
    # 1. Check claimed content type
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type '{file.content_type}'. Only JPEG, PNG, and WEBP are supported."
        )

    # 2. Read bytes into memory with size boundary
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = file.file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds the maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # 3. Validate image integrity and magic bytes using Pillow
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()  # Verifies file integrity
        # Re-open for transformation (verify() modifies internal state)
        image = Image.open(io.BytesIO(content))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupt image content."
        )

    image_format = image.format
    if image_format not in ALLOWED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Detected image format '{image_format}' is not permitted."
        )

    # 4. Strip EXIF (including GPS coordinates) by re-encoding into a fresh buffer
    # Correct orientation if EXIF had orientation tag before stripping
    try:
        image = ImageOps.exif_transpose(image)
    except Exception:
        pass

    # Convert RGBA to RGB if saving as JPEG
    output_buffer = io.BytesIO()
    if image_format == "JPEG":
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        image.save(output_buffer, format="JPEG", quality=85, optimize=True)
        content_type = "image/jpeg"
        ext = ".jpg"
    elif image_format == "PNG":
        image.save(output_buffer, format="PNG", optimize=True)
        content_type = "image/png"
        ext = ".png"
    elif image_format == "WEBP":
        image.save(output_buffer, format="WEBP", quality=85)
        content_type = "image/webp"
        ext = ".webp"
    else:
        ext = ALLOWED_FORMATS[image_format]
        content_type = file.content_type

    sanitized_bytes = output_buffer.getvalue()
    file_size = len(sanitized_bytes)

    # 5. Generate secure random filename
    storage_filename = f"{uuid.uuid4().hex}{ext}"
    os.makedirs(settings.UPLOAD_STORAGE_PATH, exist_ok=True)
    full_path = os.path.join(settings.UPLOAD_STORAGE_PATH, storage_filename)

    with open(full_path, "wb") as f:
        f.write(sanitized_bytes)

    return storage_filename, content_type, file_size


def get_image_path(storage_key: str) -> Optional[str]:
    """Resolves and validates image path, protecting against path traversal."""
    # Ensure no path traversal components
    clean_key = os.path.basename(storage_key)
    full_path = os.path.join(settings.UPLOAD_STORAGE_PATH, clean_key)
    if os.path.isfile(full_path):
        return full_path
    return None
