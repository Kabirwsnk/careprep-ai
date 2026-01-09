"""
OCR Processor for CarePrep AI
Uses pytesseract for Optical Character Recognition
"""

import io
from typing import Dict, Any
from PIL import Image

# Optional import with fallback
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("Warning: pytesseract not available. OCR will be disabled.")


class OCRProcessor:
    """OCR processing using Tesseract"""
    
    def __init__(self, lang: str = 'eng'):
        """
        Initialize OCR processor
        
        Args:
            lang: Tesseract language code (default: English)
        """
        self.lang = lang
        self.available = TESSERACT_AVAILABLE
    
    def extract_text(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text from image bytes using OCR
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            Dict with extracted text and metadata
        """
        if not self.available:
            return {
                'success': False,
                'error': 'Tesseract OCR is not available. Please install pytesseract and Tesseract.',
                'text': ''
            }
        
        try:
            # Open image from bytes
            image = Image.open(io.BytesIO(image_bytes))
            
            # Pre-process image for better OCR results
            image = self._preprocess_image(image)
            
            # Perform OCR
            text = pytesseract.image_to_string(
                image, 
                lang=self.lang,
                config='--psm 6'  # Assume uniform block of text
            )
            
            # Clean up the extracted text
            text = self._clean_text(text)
            
            return {
                'success': True,
                'text': text,
                'confidence': self._get_confidence(image)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'OCR error: {str(e)}',
                'text': ''
            }
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Pre-process image for better OCR results
        
        Args:
            image: PIL Image object
            
        Returns:
            Processed PIL Image
        """
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to grayscale
        image = image.convert('L')
        
        # Increase size if too small
        width, height = image.size
        if width < 1000:
            ratio = 1000 / width
            new_size = (int(width * ratio), int(height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        return image
    
    def _clean_text(self, text: str) -> str:
        """
        Clean up OCR extracted text
        
        Args:
            text: Raw OCR text
            
        Returns:
            Cleaned text
        """
        if not text:
            return ''
        
        # Remove excessive whitespace
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if line:  # Skip empty lines
                cleaned_lines.append(line)
        
        # Join with single newlines
        return '\n'.join(cleaned_lines)
    
    def _get_confidence(self, image: Image.Image) -> float:
        """
        Get OCR confidence score
        
        Args:
            image: PIL Image object
            
        Returns:
            Average confidence score (0-100)
        """
        try:
            data = pytesseract.image_to_data(
                image, 
                lang=self.lang, 
                output_type=pytesseract.Output.DICT
            )
            
            confidences = [
                int(conf) for conf in data['conf'] 
                if conf != '-1' and str(conf).isdigit()
            ]
            
            if confidences:
                return sum(confidences) / len(confidences)
            return 0.0
            
        except Exception:
            return 0.0
