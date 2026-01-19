
import os
from pathlib import Path
from typing import Union, IO
import shutil
import pythoncom 

class DocumentService:
    @staticmethod
    def docx_to_pdf(job_input: Path, output_path: Path):
        """
        Converts DOCX to PDF using docx2pdf (requires Word installed on Windows).
        """
        from docx2pdf import convert
        
        try:
            # docx2pdf requires absolute paths
            input_abs = str(job_input.resolve())
            output_abs = str(output_path.resolve())
            
            # Initialize COM for this thread (needed for FastAPI threads)
            pythoncom.CoInitialize()
            
            convert(input_abs, output_abs)
            
            return output_path
        except Exception as e:
            raise ValueError(f"Failed to convert DOCX to PDF: {e}")
        finally:
            # Uninitialize COM is tricky in threads, docx2pdf might handle part of it, 
            # but usually good practice to try/finally if we purely manage COM. 
            # For docx2pdf, it manages the word instance, but thread initialization is key.
            # pythoncom.CoUninitialize() # Can cause issues if not careful, keeping safely omitted unless needed
            pass
