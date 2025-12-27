import os
import re
from typing import Optional, Tuple, List

import cv2
import numpy as np
from PIL import Image

import pytesseract
from rapidfuzz import fuzz

# Configure path from Django settings if available
try:
    from django.conf import settings
    tesseract_cmd = getattr(settings, "TESSERACT_CMD", None)
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
except ImportError:
    pass

try:
    from pdf2image import convert_from_path
except Exception:
    convert_from_path = None


SUPPORTED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}
SUPPORTED_PDF_EXTS = {".pdf"}


def normalize_name(s: str) -> str:
    """Normalize names for comparison: lower, remove punctuation, collapse whitespace."""
    s = s.lower()
    s = re.sub(r"[^a-z\s]", " ", s)   
    s = re.sub(r"\s+", " ", s).strip()
    return s


def preprocess_for_ocr(pil_img: Image.Image) -> np.ndarray:
    """
    Improve OCR accuracy using OpenCV preprocessing:
    - convert to grayscale
    - denoise
    - adaptive threshold
    """
    img = np.array(pil_img)

    # PIL to OpenCV uses RGB; convert to BGR then grayscale
    if len(img.shape) == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # Denoise
    gray = cv2.bilateralFilter(gray, 9, 75, 75)

    # Adaptive threshold
    thr = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 2
    )
    return thr


def ocr_image_to_text(pil_img: Image.Image) -> str:
    """Run OCR on a PIL image and return extracted text."""
    processed = preprocess_for_ocr(pil_img)

    # PSM 6: Assume a uniform block of text (good default for documents)
    config = "--oem 3 --psm 6"
    text = pytesseract.image_to_string(processed, lang="eng", config=config)
    return text or ""


def load_document_as_images(file_path: str, poppler_path: Optional[str] = None) -> List[Image.Image]:
    """
    Convert uploaded file to one or more PIL images:
    - If image -> list with one image
    - If PDF -> list of pages converted to images
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext in SUPPORTED_IMAGE_EXTS:
        return [Image.open(file_path).convert("RGB")]

    if ext in SUPPORTED_PDF_EXTS:
        if convert_from_path is None:
            raise RuntimeError("pdf2image is not installed or Poppler is missing.")
        # dpi can be increased (e.g. 300) for better OCR but slower
        pages = convert_from_path(file_path, dpi=250, poppler_path=poppler_path)
        return [p.convert("RGB") for p in pages]

    raise ValueError(f"Unsupported file type: {ext}")


def extract_name_from_text(text: str) -> Optional[str]:
    """
    Extract probable 'Name' from OCR text.

    Strategy:
    1) Try common labels: Name:, Licensee Name:, Holder Name:
    2) If not found, fallback to heuristic:
       - Look for lines with 2-4 words (typical full name)
       - Must start with capital letter (proper name format)
    """
    # 1) Label-based patterns (more specific)
    patterns = [
        r"(?:licensee\s*name|holder\s*name|name\s*of\s*licensee|name\s*of\s*holder)\s*[:\-]\s*([A-Z][A-Za-z\s\.]{2,60})",
        r"(?:issued\s*to|license\s*holder|contractor\s*name)\s*[:\-]?\s*([A-Z][A-Za-z\s\.]{2,60})",
        r"name\s*[:\-]\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})",  # Must have at least 2 capitalized words
    ]

    for pat in patterns:
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            candidate = m.group(1).strip()
            # cleanup
            candidate = re.sub(r"\s{2,}", " ", candidate)
            candidate = re.sub(r"[\.]{2,}", ".", candidate)
            # Must start with capital letter and have reasonable length
            if candidate and candidate[0].isupper() and 3 <= len(candidate) <= 60:
                # Must have at least 2 words (first and last name)
                words = candidate.split()
                if len(words) >= 2:
                    return candidate

    # 2) Heuristic fallback: choose best-looking line (stricter)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    candidates = []
    
    for ln in lines:
        # ignore lines that are mostly numbers or special chars
        if sum(ch.isdigit() for ch in ln) > 3:
            continue
        if sum(ch in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for ch in ln) > 2:
            continue
        
        # Must start with capital letter
        if not ln or not ln[0].isupper():
            continue
            
        # Extract words (only letters, at least 2 chars each)
        words = re.findall(r"[A-Za-z]{2,}", ln)
        if 2 <= len(words) <= 4:
            candidate = " ".join(words)
            # Must be reasonable length and have proper capitalization
            if 6 <= len(candidate) <= 40:
                # Check if it looks like a name (at least 2 capitalized words)
                capitalized_words = sum(1 for w in words if w[0].isupper())
                if capitalized_words >= 2:
                    candidates.append((candidate, capitalized_words))
    
    # Return the best candidate (most capitalized words, or first if tie)
    if candidates:
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[0][0]

    return None


def compute_name_match_score(registered_name: str, extracted_name: str) -> float:
    """
    Compute fuzzy match score between registered name and extracted name.
    Uses multiple matching strategies and returns the best score.
    """
    a = normalize_name(registered_name)
    b = normalize_name(extracted_name)
    
    # Try multiple matching strategies
    token_set = fuzz.token_set_ratio(a, b)  # Handles word order variations
    token_sort = fuzz.token_sort_ratio(a, b)  # Handles word order
    ratio = fuzz.ratio(a, b)  # Exact sequence match
    
    # Use the best score, but require at least 2 matching words
    best_score = max(token_set, token_sort, ratio)
    
    # Additional validation: check if at least 2 words match
    a_words = set(a.split())
    b_words = set(b.split())
    common_words = a_words.intersection(b_words)
    
    # If less than 2 words match, reduce the score significantly
    if len(common_words) < 2:
        # Penalize if not enough word overlap
        best_score = min(best_score, 70.0)
    
    return float(best_score)


def verify_contractor_license(
    file_path: str,
    registered_name: str,
    threshold: float = 90.0,  # Increased threshold for stricter matching
    poppler_path: Optional[str] = None
) -> Tuple[str, float, str]:
    """
    Main function:
    - read file -> images
    - OCR each image -> combined text
    - extract name
    - fuzzy match with registered_name
    Returns: (status, score, extracted_name_or_reason)
    """
    if not registered_name or len(registered_name.strip()) < 3:
        return ("UNDER_REVIEW", 0.0, "Registered name is invalid or too short.")

    images = load_document_as_images(file_path, poppler_path=poppler_path)

    full_text = ""
    for img in images[:3]:  # limit pages for speed (optional)
        full_text += "\n" + ocr_image_to_text(img)

    extracted = extract_name_from_text(full_text)
    if not extracted:
        return ("UNDER_REVIEW", 0.0, "Could not detect a name clearly from the document.")

    # Additional validation: extracted name should have at least 2 words
    extracted_words = extracted.split()
    if len(extracted_words) < 2:
        return ("UNDER_REVIEW", 0.0, f"Extracted name '{extracted}' appears incomplete (less than 2 words).")

    score = compute_name_match_score(registered_name, extracted)

    # Stricter verification: require high score
    if score >= threshold:
        return ("VERIFIED", score, extracted)

    # If score is moderately close, send to manual review
    if 75.0 <= score < threshold:
        return ("UNDER_REVIEW", score, extracted)

    # Low score: reject
    return ("REJECTED", score, extracted)
