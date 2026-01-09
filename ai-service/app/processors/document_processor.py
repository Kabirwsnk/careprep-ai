"""
Document Processor for CarePrep AI
Handles PDF, images, CSV, and Excel file processing
"""

import io
import os
import tempfile
import requests
from typing import Optional, Dict, Any
import pandas as pd
from PIL import Image

# Optional imports with fallbacks
try:
    from pdf2image import convert_from_bytes
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False
    print("Warning: pdf2image not available. PDF processing will be limited.")

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("Warning: python-docx not available. Word document processing will be limited.")


class DocumentProcessor:
    """Process various document types for text extraction"""
    
    def __init__(self):
        self.supported_types = {
            'pdf': self._process_pdf,
            'image': self._process_image,
            'csv': self._process_csv,
            'excel': self._process_excel,
            'docx': self._process_docx
        }
    
    def process(self, file_url: str, file_type: str) -> Dict[str, Any]:
        """
        Process a document from URL and extract text
        
        Args:
            file_url: URL of the file to process
            file_type: MIME type of the file
            
        Returns:
            Dict with extracted text and metadata
        """
        try:
            # Download file
            response = requests.get(file_url, timeout=30)
            response.raise_for_status()
            file_bytes = response.content
            
            # Determine processor based on file type
            if 'pdf' in file_type.lower():
                return self._process_pdf(file_bytes)
            elif 'image' in file_type.lower() or file_type.lower() in ['image/jpeg', 'image/png', 'image/jpg']:
                return self._process_image(file_bytes)
            elif 'csv' in file_type.lower():
                return self._process_csv(file_bytes)
            elif 'spreadsheet' in file_type.lower() or 'excel' in file_type.lower():
                return self._process_excel(file_bytes)
            elif 'word' in file_type.lower() or 'docx' in file_type.lower():
                return self._process_docx(file_bytes)
            else:
                return {
                    'success': False,
                    'error': f'Unsupported file type: {file_type}',
                    'text': ''
                }
                
        except requests.RequestException as e:
            return {
                'success': False,
                'error': f'Failed to download file: {str(e)}',
                'text': ''
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Processing error: {str(e)}',
                'text': ''
            }
    
    def _process_pdf(self, file_bytes: bytes) -> Dict[str, Any]:
        """Process PDF file using pdf2image and OCR"""
        if not PDF2IMAGE_AVAILABLE:
            return {
                'success': False,
                'error': 'PDF processing requires pdf2image and poppler. Please install them.',
                'text': ''
            }
        
        try:
            from .ocr_processor import OCRProcessor
            ocr = OCRProcessor()
            
            # Convert PDF pages to images
            images = convert_from_bytes(file_bytes, dpi=200)
            
            all_text = []
            for i, image in enumerate(images):
                # Convert PIL Image to bytes for OCR
                img_buffer = io.BytesIO()
                image.save(img_buffer, format='PNG')
                img_bytes = img_buffer.getvalue()
                
                # Extract text from image
                result = ocr.extract_text(img_bytes)
                if result.get('success'):
                    all_text.append(f"--- Page {i+1} ---\n{result['text']}")
            
            return {
                'success': True,
                'text': '\n\n'.join(all_text),
                'pages': len(images)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'PDF processing error: {str(e)}',
                'text': ''
            }
    
    def _process_image(self, file_bytes: bytes) -> Dict[str, Any]:
        """Process image file using OCR"""
        try:
            from .ocr_processor import OCRProcessor
            ocr = OCRProcessor()
            return ocr.extract_text(file_bytes)
        except Exception as e:
            return {
                'success': False,
                'error': f'Image processing error: {str(e)}',
                'text': ''
            }
    
    def _process_csv(self, file_bytes: bytes) -> Dict[str, Any]:
        """Process CSV file"""
        try:
            df = pd.read_csv(io.BytesIO(file_bytes))
            
            # Convert to readable text format
            text_parts = []
            text_parts.append(f"CSV Data Summary:")
            text_parts.append(f"Columns: {', '.join(df.columns.tolist())}")
            text_parts.append(f"Rows: {len(df)}")
            text_parts.append("\nData Preview:")
            text_parts.append(df.to_string(max_rows=50))
            
            return {
                'success': True,
                'text': '\n'.join(text_parts),
                'rows': len(df),
                'columns': len(df.columns)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'CSV processing error: {str(e)}',
                'text': ''
            }
    
    def _process_excel(self, file_bytes: bytes) -> Dict[str, Any]:
        """Process Excel file"""
        try:
            # Read all sheets
            excel_file = pd.ExcelFile(io.BytesIO(file_bytes))
            
            text_parts = []
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                text_parts.append(f"\n=== Sheet: {sheet_name} ===")
                text_parts.append(f"Columns: {', '.join(df.columns.astype(str).tolist())}")
                text_parts.append(f"Rows: {len(df)}")
                text_parts.append("\nData:")
                text_parts.append(df.to_string(max_rows=30))
            
            return {
                'success': True,
                'text': '\n'.join(text_parts),
                'sheets': len(excel_file.sheet_names)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Excel processing error: {str(e)}',
                'text': ''
            }
    
    def _process_docx(self, file_bytes: bytes) -> Dict[str, Any]:
        """Process Word document"""
        if not DOCX_AVAILABLE:
            return {
                'success': False,
                'error': 'Word document processing requires python-docx',
                'text': ''
            }
        
        try:
            doc = Document(io.BytesIO(file_bytes))
            
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            
            return {
                'success': True,
                'text': '\n\n'.join(paragraphs),
                'paragraphs': len(paragraphs)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Word document processing error: {str(e)}',
                'text': ''
            }
