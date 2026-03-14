def verify_contractor_license(file_path, registered_name, threshold=90.0, poppler_path=None):
    """
    Mock OCR verification for contractor licenses.
    Returns: status (str), match_score (float), extracted_name_or_reason (str)
    """
    return "UNDER_REVIEW", 0.0, "OCR verification requires manual review."
