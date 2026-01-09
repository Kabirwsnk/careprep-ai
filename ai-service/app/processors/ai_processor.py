"""
AI Processor for CarePrep AI
Handles OpenRouter API integration (free models)
"""

import os
import json
import re
import time
from typing import Dict, Any, List, Optional

import requests

from ..prompts.prompts import (
    get_symptom_summary_prompt,
    get_document_summary_prompt,
    get_pre_visit_chat_prompt,
    get_post_visit_chat_prompt,
    get_ocr_cleanup_prompt,
    MEDICAL_DISCLAIMER
)

# OpenRouter API configuration
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


class AIProcessor:
    """AI processing using OpenRouter API (free models)"""
    
    def __init__(self):
        """Initialize AI processor with OpenRouter client"""
        self.api_key = os.getenv('OPENROUTER_API_KEY')
        self.model = os.getenv('OPENROUTER_MODEL', 'mistralai/mistral-7b-instruct')
        
        if self.api_key:
            self.available = True
        else:
            self.available = False
            print("OPENROUTER_API_KEY environment variable not set")
    
    def _make_request(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1500) -> Optional[str]:
        """
        Make a request to OpenRouter API
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            
        Returns:
            Response content string or None on error
        """
        if not self.available:
            return None
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://careprep-ai.local",
            "X-Title": "CarePrep AI"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    OPENROUTER_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=60
                )
                
                if response.status_code == 429:
                    # Rate limited - wait and retry
                    wait_time = retry_delay * (2 ** attempt)
                    print(f"Rate limited, waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                
                response.raise_for_status()
                data = response.json()
                
                if 'choices' in data and len(data['choices']) > 0:
                    return data['choices'][0]['message']['content']
                else:
                    print(f"Unexpected response format: {data}")
                    return None
                    
            except requests.exceptions.Timeout:
                print(f"Request timeout on attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                return None
            except requests.exceptions.RequestException as e:
                print(f"Request error: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                return None
        
        return None
    
    def generate_symptom_summary(self, symptoms: List[Dict]) -> Dict[str, Any]:
        """
        Generate a doctor-friendly summary of symptoms
        
        Args:
            symptoms: List of symptom records
            
        Returns:
            Dict with summary text
        """
        if not self.available:
            return self._fallback_symptom_summary(symptoms)
        
        try:
            prompt = get_symptom_summary_prompt(symptoms)
            
            content = self._make_request(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            
            if content:
                return {
                    'success': True,
                    'summary': content
                }
            else:
                return self._fallback_symptom_summary(symptoms)
            
        except Exception as e:
            print(f"AI error: {e}")
            return self._fallback_symptom_summary(symptoms)
    
    def summarize_document(self, document_text: str) -> Dict[str, Any]:
        """
        Summarize a medical document
        
        Args:
            document_text: Extracted text from document
            
        Returns:
            Dict with summaries, medications, follow-ups, and red flags
        """
        if not self.available:
            return self._fallback_document_summary(document_text)
        
        try:
            prompt = get_document_summary_prompt(document_text)
            
            content = self._make_request(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=2000
            )
            
            if content:
                # Parse the structured response
                parsed = self._parse_document_summary(content)
                
                return {
                    'success': True,
                    'processedText': document_text,
                    'doctorSummary': document_text[:1000] + '...' if len(document_text) > 1000 else document_text,
                    'patientSummary': parsed.get('patientSummary', content),
                    'medications': parsed.get('medications', []),
                    'followUps': parsed.get('followUps', []),
                    'redFlags': parsed.get('redFlags', [])
                }
            else:
                return self._fallback_document_summary(document_text)
            
        except Exception as e:
            print(f"AI error: {e}")
            return self._fallback_document_summary(document_text)
    
    def chat(self, message: str, mode: str, context: Dict) -> Dict[str, Any]:
        """
        Generate chat response
        
        Args:
            message: User's message
            mode: 'pre_visit' or 'post_visit'
            context: Additional context (symptoms or summary)
            
        Returns:
            Dict with AI response
        """
        if not self.available:
            return self._fallback_chat_response(message, mode)
        
        try:
            if mode == 'pre_visit':
                symptoms = context.get('symptoms', [])
                prompt = get_pre_visit_chat_prompt(message, symptoms)
            else:
                summary = context.get('summary', {})
                prompt = get_post_visit_chat_prompt(message, summary)
            
            content = self._make_request(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=800
            )
            
            if content:
                return {
                    'success': True,
                    'response': content
                }
            else:
                return self._fallback_chat_response(message, mode)
            
        except Exception as e:
            print(f"AI error: {e}")
            return self._fallback_chat_response(message, mode)
    
    def cleanup_ocr_text(self, raw_text: str) -> str:
        """
        Use AI to clean up OCR text
        
        Args:
            raw_text: Raw OCR extracted text
            
        Returns:
            Cleaned text
        """
        if not self.available or len(raw_text) < 50:
            return raw_text
        
        try:
            prompt = get_ocr_cleanup_prompt(raw_text)
            
            content = self._make_request(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=2000
            )
            
            return content if content else raw_text
            
        except Exception:
            return raw_text
    
    def _parse_document_summary(self, content: str) -> Dict[str, Any]:
        """Parse structured content from AI response"""
        result = {
            'patientSummary': '',
            'medications': [],
            'followUps': [],
            'redFlags': []
        }
        
        try:
            # Extract patient summary (first major section)
            summary_match = re.search(
                r'\*\*PATIENT-FRIENDLY SUMMARY\*\*[:\s]*(.+?)(?=\*\*MEDICATIONS\*\*|\*\*FOLLOW-UP|\*\*RED FLAGS|$)',
                content, 
                re.DOTALL | re.IGNORECASE
            )
            if summary_match:
                result['patientSummary'] = summary_match.group(1).strip()
            else:
                # Use first portion as summary
                result['patientSummary'] = content[:1500] if len(content) > 1500 else content
            
            # Extract medications
            meds_match = re.search(
                r'\*\*MEDICATIONS\*\*[:\s]*(.+?)(?=\*\*FOLLOW-UP|\*\*RED FLAGS|$)',
                content,
                re.DOTALL | re.IGNORECASE
            )
            if meds_match:
                meds_text = meds_match.group(1)
                # Simple parsing for medication entries
                med_entries = re.findall(r'-\s*name:\s*(.+?)(?:\n|$)', meds_text, re.IGNORECASE)
                for med in med_entries:
                    result['medications'].append({
                        'name': med.strip(),
                        'dosage': 'As prescribed',
                        'timing': 'Follow doctor instructions',
                        'notes': ''
                    })
            
            # Extract follow-ups
            followup_match = re.search(
                r'\*\*FOLLOW-UP (?:ACTIONS?)?\*\*[:\s]*(.+?)(?=\*\*RED FLAGS|$)',
                content,
                re.DOTALL | re.IGNORECASE
            )
            if followup_match:
                followup_text = followup_match.group(1)
                followup_items = re.findall(r'-\s*action:\s*(.+?)(?:\n|$)', followup_text, re.IGNORECASE)
                for item in followup_items:
                    result['followUps'].append({
                        'action': item.strip(),
                        'timing': 'As scheduled'
                    })
            
            # Extract red flags
            redflags_match = re.search(
                r'\*\*RED FLAGS\*\*[:\s]*(.+?)$',
                content,
                re.DOTALL | re.IGNORECASE
            )
            if redflags_match:
                redflag_text = redflags_match.group(1)
                redflag_items = re.findall(r'[-•]\s*(.+?)(?:\n|$)', redflag_text)
                result['redFlags'] = [item.strip() for item in redflag_items if item.strip()]
            
        except Exception as e:
            print(f"Error parsing document summary: {e}")
        
        return result
    
    def _fallback_symptom_summary(self, symptoms: List[Dict]) -> Dict[str, Any]:
        """Fallback when AI is unavailable"""
        symptom_list = "\n".join([
            f"• {s.get('date', 'Unknown date')}: {s.get('symptom', 'Unknown symptom')} "
            f"(Severity: {s.get('severity', 'N/A')}/10)"
            for s in symptoms[:10]
        ])
        
        return {
            'success': True,
            'summary': f"""**Symptom Summary for Your Doctor**

You have logged {len(symptoms)} symptom(s). Here's a summary to share with your healthcare provider:

{symptom_list}

**Next Steps:**
• Discuss these symptoms with your doctor
• Mention any patterns you've noticed
• Ask about possible causes and treatments

{MEDICAL_DISCLAIMER}"""
        }
    
    def _fallback_document_summary(self, document_text: str) -> Dict[str, Any]:
        """Fallback when AI is unavailable"""
        preview = document_text[:500] + '...' if len(document_text) > 500 else document_text
        
        return {
            'success': True,
            'processedText': document_text,
            'doctorSummary': preview,
            'patientSummary': f"""Your document has been processed. Here's a preview:

{preview}

For a detailed explanation of this document, please consult with your healthcare provider.

{MEDICAL_DISCLAIMER}""",
            'medications': [],
            'followUps': [{
                'action': 'Discuss this document with your healthcare provider',
                'timing': 'At your next appointment'
            }],
            'redFlags': ['Contact your doctor if you have questions about this document']
        }
    
    def _fallback_chat_response(self, message: str, mode: str) -> Dict[str, Any]:
        """Fallback chat response when AI is unavailable"""
        if mode == 'pre_visit':
            response = f"""I understand you have a question about preparing for your doctor visit.

While I can't provide specific advice right now, here are some general tips:

1. **Write down your symptoms** - Note when they started, how often they occur, and their severity
2. **List your medications** - Include supplements and over-the-counter drugs
3. **Prepare your questions** - Write them down so you don't forget
4. **Bring relevant documents** - Test results, previous records, etc.

Your question was: "{message}"

Please discuss this with your healthcare provider during your visit.

{MEDICAL_DISCLAIMER}"""
        else:
            response = f"""I understand you have a question about your visit notes.

While I can't process your specific question right now, here's general guidance:

1. **Review your documents** - Read through them carefully
2. **Note any unclear terms** - Ask your doctor to explain
3. **Follow medication instructions** - Take as prescribed
4. **Schedule follow-ups** - As recommended by your doctor

Your question was: "{message}"

For specific questions about your treatment, please contact your healthcare provider.

{MEDICAL_DISCLAIMER}"""
        
        return {
            'success': True,
            'response': response
        }
