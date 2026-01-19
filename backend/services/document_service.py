import subprocess
import logging
from pathlib import Path
import shutil
import pypandoc
from pdf2docx import Converter

logger = logging.getLogger("filevora")

class DocumentService:
    @staticmethod
    def pdf_to_epub(job_input: Path, output_path: Path):
        """
        Converts PDF to EPUB in two steps:
        1. PDF -> DOCX (using pdf2docx for better layout)
        2. DOCX -> EPUB (using pandoc)
        """
        try:
            # Step 1: PDF to DOCX
            docx_path = job_input.parent / f"{job_input.stem}_temp.docx"
            cv = Converter(str(job_input))
            cv.convert(str(docx_path))
            cv.close()

            # Step 2: DOCX to EPUB using pypandoc
            # Ensure pypandoc can find the binary (in Docker it's installed via apt)
            pypandoc.convert_file(
                str(docx_path),
                'epub',
                outputfile=str(output_path)
            )

            # Cleanup
            if docx_path.exists():
                docx_path.unlink()

            return output_path

        except Exception as e:
            logger.error(f"PDF to EPUB failed: {str(e)}")
            raise ValueError(f"Failed to convert PDF to EPUB: {str(e)}")

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
