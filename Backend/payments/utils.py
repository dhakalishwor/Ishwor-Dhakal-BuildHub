import base64
import hashlib
import hmac

def esewa_generate_signature(secret_key: str, message: str) -> str:
    digest = hmac.new(
        secret_key.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).digest()
    return base64.b64encode(digest).decode("utf-8")
