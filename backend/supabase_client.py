import os
import re
import time
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jufenigdvmpjwguyjwqw.supabase.co").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
BUCKET_NAME = os.getenv("SUPABASE_STORAGE_BUCKET", "oumalya-images")

def get_headers(content_type: str = "application/json") -> dict:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type
    }

def upload_image_to_supabase(filename: str, content: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Uploads an image file to the Supabase Storage bucket 'oumalya-images'
    and returns its permanent global CDN public URL.
    """
    ext = os.path.splitext(filename)[1].lower() or ".jpg"
    base_name = os.path.splitext(filename)[0]
    clean_base = re.sub(r'[^a-z0-9_-]', '-', base_name.lower())[:30] or "img"
    clean_filename = f"{clean_base}-{int(time.time() * 1000)}{ext}"

    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{clean_filename}"
    headers = get_headers(content_type=mime_type)

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(upload_url, headers=headers, content=content)
            if resp.status_code in [200, 201]:
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{clean_filename}"
                return {
                    "success": True,
                    "url": public_url,
                    "filename": clean_filename,
                    "bucket": BUCKET_NAME,
                    "size": len(content),
                    "storage": "supabase"
                }
            else:
                print(f"[Supabase Storage] Upload error: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"[Supabase Storage] Network error: {e}")

    return {"success": False, "error": "Supabase upload failed"}

def delete_image_from_supabase(filename: str) -> bool:
    """Deletes an image from the Supabase Storage bucket"""
    delete_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}"
    headers = get_headers()
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.request("DELETE", delete_url, headers=headers, json={"prefixes": [filename]})
            return resp.status_code == 200
    except Exception as e:
        print(f"[Supabase Storage] Delete error: {e}")
        return False
