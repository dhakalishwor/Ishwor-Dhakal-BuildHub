import cv2
import pytesseract
import re
import os
from difflib import SequenceMatcher
from pdf2image import convert_from_path
from PIL import Image
import numpy as np

# Set Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def normalize_nepali_digits(text):
    nepali_to_eng = {
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
        '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
    }
    for nep, eng in nepali_to_eng.items():
        text = text.replace(nep, eng)
    return text

def clean_name(text):
    if not text: return ""
    # Keep only English letters, Nepali characters, and spaces
    text = re.sub(r'[^a-zA-Z\u0900-\u097F\s]', '', text)
    # Remove extra spaces and newlines
    text = " ".join(text.split())
    return text.strip()

def extract_text(image_path):
    full_text = ""
    try:
        # Check if it's a PDF
        if image_path.lower().endswith('.pdf'):
            images = convert_from_path(image_path)
        else:
            images = [Image.open(image_path)]

        for idx, pil_img in enumerate(images):
            # Convert PIL to OpenCV format
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            
            # Improve OCR accuracy
            img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # More robust preprocessing: Otsu's thresholding
            gray = cv2.GaussianBlur(gray, (5, 5), 0)
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

            print(f"Running OCR on page/image {idx+1} for {os.path.basename(image_path)}...")
            try:
                # Check available languages
                langs = "eng+nep"
                available_langs = pytesseract.get_languages()
                if "nep" not in available_langs:
                    print("WARNING: 'nep' (Nepali) language data not found in Tesseract. OCR may be inaccurate.")
                    print("Please download 'nep.traineddata' from Tesseract-OCR GitHub and place it in the 'tessdata' folder.")
                    langs = "eng" # Fallback to English

                # Try with PSM 6 (Single uniform block of text) first, then PSM 11 as fallback
                text = pytesseract.image_to_string(
                    thresh,
                    lang=langs,
                    config="--psm 6" 
                )
                if len(text.strip()) < 10:
                    text = pytesseract.image_to_string(
                        thresh,
                        lang="eng+nep",
                        config="--psm 11" 
                    )
                full_text += text + "\n"
            except Exception as e:
                print(f"OCR Error: {e}")
                continue

        print(f"OCR finished for {os.path.basename(image_path)}")
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        
    return normalize_nepali_digits(full_text)

def similarity(a, b):
    if not a or not b: return 0.0
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def verify_contractor_documents(file_paths):
    all_doc_candidates = []

    for path in file_paths:
        text = extract_text(path)
        doc_candidates = []
        if not text:
            all_doc_candidates.append(doc_candidates)
            continue
        
        # 1. Try patterns first
        patterns = [
            r"(?:Full Name|Name|नाम[,/ \s]*थर|नाम|waa|sare|ataa|taat|Proprietor|प्रोपप्रयेटर)\s*[:\- ]+\s*([a-zA-Z\u0900-\u097F\s]{3,})",
            r"(?:Full Name|Name|नाम[,/ \s]*थर|नाम|waa|sare|ataa|taat|Proprietor|प्रोपप्रयेटर)\s*\n\s*([a-zA-Z\u0900-\u097F\s]{3,})",
        ]
        
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                raw_val = match.group(1)
                if raw_val:
                    name = clean_name(raw_val.strip().split('\n')[0])
                    if name and name not in doc_candidates:
                        doc_candidates.append(name)

        # 2. Heuristic candidates
        ignore_words = [
            "CERTIFICATE", "NEPAL", "GOVERNMENT", "OFFICES", "CLASS", "LICENSE", "DIGIT", 
            "MOBILE", "PHONE", "CITIZEN", "DATE", "BIRTH", "CONTRACTOR", "OFFICE",
            "निमार्ण", "व्यवसायी", "इजाजतपत्र", "नागरिकता", "प्रमाणपत्र", "नेपाल", "सरकार"
        ]
        for line in text.split('\n'):
            cleaned = clean_name(line.strip())
            if not cleaned or any(c.isdigit() for c in cleaned):
                continue
            words = cleaned.split()
            if 2 <= len(words) <= 4:
                if not any(w.upper() in ignore_words for w in words):
                    alpha_count = sum(1 for c in cleaned if c.isalpha() or '\u0900' <= c <= '\u097F')
                    if alpha_count / len(cleaned) > 0.8:
                        if cleaned not in doc_candidates:
                            doc_candidates.append(cleaned)

        doc_name = os.path.basename(path)
        print(f"Candidates from {doc_name}: {doc_candidates}")
        all_doc_candidates.append(doc_candidates)

    if len(all_doc_candidates) < 2:
        return {"verified": False, "message": "Could not process both documents."}

    cands1 = all_doc_candidates[0]
    cands2 = all_doc_candidates[1]
    
    if not cands1 or not cands2:
        missing = "both documents" if not cands1 and not cands2 else ("Document 1" if not cands1 else "Document 2")
        return {
            "verified": False,
            "message": f"No name-like patterns found in {missing}. Please ensure images are clear.",
            "documents": [{"file": os.path.basename(file_paths[i]), "candidates": all_doc_candidates[i]} for i in range(len(file_paths))]
        }

    best_score = 0.0
    best_pair = ("", "")

    for n1 in cands1:
        for n2 in cands2:
            score = similarity(n1, n2)
            if score > best_score:
                best_score = score
                best_pair = (n1, n2)

    confidence = round(best_score * 100, 2)

    if best_score > 0.80:
        print("\n" + "="*40)
        print("   FINAL EXTRACTED NAME MATCH")
        print(f"   Name 1: {best_pair[0]}")
        print(f"   Name 2: {best_pair[1]}")
        print(f"   Confidence: {confidence}%")
        print("="*40 + "\n")
        
        return {
            "verified": True,
            "message": f"Match found between documents! ('{best_pair[0]}' matched '{best_pair[1]}')",
            "confidence_score": confidence,
            "best_match": best_pair,
            "redirect_to": "/login"
        }
    else:
        # Fallback message if no match
        p1 = best_pair[0] if best_pair[0] else "Unknown"
        p2 = best_pair[1] if best_pair[1] else "Unknown"
        
        print("\n" + "!"*40)
        print("   VERIFICATION FAILED")
        print(f"   Best Guess 1: {p1}")
        print(f"   Best Guess 2: {p2}")
        print(f"   Match Score: {confidence}%")
        print("!"*40 + "\n")

        return {
            "verified": False,
            "message": f"No matching names found. Best attempt: '{p1}' vs '{p2}' ({confidence}% match).",
            "confidence_score": confidence,
            "best_match": best_pair
        }