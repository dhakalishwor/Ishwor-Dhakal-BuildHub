import os
import re
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
from rapidfuzz import fuzz
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
def extract_text_from_file(file_path, poppler_path=None):
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        pages = convert_from_path(file_path, dpi=300, poppler_path=poppler_path)
        text = ""
        for page in pages[:2]:
            text += pytesseract.image_to_string(page, lang="nep+eng")
        return text

    img = Image.open(file_path)
    return pytesseract.image_to_string(img, lang="nep+eng")


def extract_name(text):
    patterns = [
        r"नाम[:\-\s]+([^\n]+)",
        r"Name[:\-\s]+([^\n]+)",
        r"Full Name[:\-\s]+([^\n]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines:
        if len(line.split()) >= 2 and len(line) < 50:
            return line

    return ""


def verify_contractor_license(file_path, registered_name, threshold=90.0, poppler_path=None):
    text = extract_text_from_file(file_path, poppler_path=poppler_path)
    extracted_name = extract_name(text)

    if not extracted_name:
        return "UNDER_REVIEW", 0, "Could not extract name from document."

    score = fuzz.token_sort_ratio(registered_name.lower(), extracted_name.lower())

    if score >= threshold:
        return "VERIFIED", score, extracted_name
    elif score >= 60:
        return "UNDER_REVIEW", score, extracted_name
    else:
        return "REJECTED", score, extracted_name