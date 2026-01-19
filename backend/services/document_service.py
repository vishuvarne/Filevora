import subprocess
import logging
from pathlib import Path
import shutil

logger = logging.getLogger("filevora")

class DocumentService:
    @staticmethod
    def docx_to_pdf(job_input: Path, output_path: Path):
        """
        Converts DOCX to PDF using LibreOffice (Headless).
        Works on Linux/Docker.
        """
        try:
            # LibreOffice requires an output directory, not filename
            output_dir = output_path.parent
            
            # Command: soffice --headless --convert-to pdf <input> --outdir <output_dir>
            cmd = [
                "soffice",
                "--headless",
                "--convert-to", "pdf",
                str(job_input),
                "--outdir",
                str(output_dir)
            ]
            
            logger.info(f"Running LibreOffice conversion: {' '.join(cmd)}")
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            logger.info(result.stdout)
            
            # LibreOffice creates the file with the same name as input but .pdf extension
            # verify it matches our expected output path or rename it
            created_pdf = output_dir / f"{job_input.stem}.pdf"
            
            if created_pdf.exists() and created_pdf != output_path:
                shutil.move(created_pdf, output_path)
                
            return output_path

        except subprocess.CalledProcessError as e:
            logger.error(f"LibreOffice failed: {e.stderr}")
            raise ValueError(f"Failed to convert DOCX to PDF: {e.stderr}")
        except Exception as e:
            logger.error(f"Conversion error: {str(e)}")
            raise ValueError(f"Failed to convert DOCX to PDF: {str(e)}")
