import fitz  # PyMuPDF
from pathlib import Path
from typing import List, IO, Union

class PDFService:
    @staticmethod
    def merge_pdfs(inputs: List[Union[Path, IO[bytes], bytes]], output_path: Path):
        """
        Merges multiple PDFs into a single file using PyMuPDF.
        """
        doc_merged = fitz.open()
        
        for item in inputs:
            try:
                # Handle bytes, streams, or paths
                if isinstance(item, (bytes, bytearray)):
                    doc = fitz.open(stream=item, filetype="pdf")
                elif hasattr(item, "read"):
                    # It's a file-like object
                    # Reset stream position just in case
                    if hasattr(item, "seek"):
                        item.seek(0)
                    file_bytes = item.read()
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                else:
                    # It's a path
                    doc = fitz.open(item)
                    
                doc_merged.insert_pdf(doc)
            except Exception as e:
                print(f"Error merging item: {e}")
                raise ValueError(f"Failed to process PDF item")
        
        doc_merged.save(output_path)
        doc_merged.close()
        return output_path

    @staticmethod
    def split_pdf(job_input: Union[Path, IO[bytes], bytes], output_dir: Path):
        """
        Splits a PDF into individual pages.
        """
        try:
            if isinstance(job_input, (bytes, bytearray)):
                 doc = fitz.open(stream=job_input, filetype="pdf")
            elif hasattr(job_input, "read"):
                if hasattr(job_input, "seek"):
                    job_input.seek(0)
                doc = fitz.open(stream=job_input.read(), filetype="pdf")
            else:
                doc = fitz.open(job_input)
                
            for i in range(len(doc)):
                page = doc.load_page(i)
                new_doc = fitz.open()
                new_doc.insert_pdf(doc, from_page=i, to_page=i)
                new_doc.save(output_dir / f"page_{i+1}.pdf")
                new_doc.close()
            doc.close()
        except Exception as e:
             raise ValueError(f"Failed to split PDF: {e}")

    @staticmethod
    def compress_pdf(job_input: Union[Path, IO[bytes], bytes], output_path: Path, level: str = "basic"):
        """
        Compresses a PDF with advanced image optimization. 
        Levels: basic (good quality), strong (balanced), extreme (max compression).
        """
        from PIL import Image
        import io
        
        try:
            if isinstance(job_input, (bytes, bytearray)):
                 doc = fitz.open(stream=job_input, filetype="pdf")
            elif hasattr(job_input, "read"):
                if hasattr(job_input, "seek"):
                    job_input.seek(0)
                doc = fitz.open(stream=job_input.read(), filetype="pdf")
            else:
                doc = fitz.open(job_input)
            
            # Define compression settings by level
            compression_settings = {
                "basic": {"max_dpi": 150, "jpeg_quality": 85},
                "strong": {"max_dpi": 100, "jpeg_quality": 70},
                "extreme": {"max_dpi": 72, "jpeg_quality": 50}
            }
            
            settings = compression_settings.get(level, compression_settings["basic"])
            
            # Process each page
            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images(full=True)
                
                for img_index, img in enumerate(image_list):
                    xref = img[0]  # xref number
                    
                    try:
                        # Extract image
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        
                        # Open with PIL
                        pil_image = Image.open(io.BytesIO(image_bytes))
                        
                        # Calculate new dimensions based on DPI target
                        orig_width, orig_height = pil_image.size
                        
                        # Only downsample if image is large
                        if orig_width > settings["max_dpi"] or orig_height > settings["max_dpi"]:
                            # Calculate scaling factor
                            scale_factor = min(
                                settings["max_dpi"] / orig_width,
                                settings["max_dpi"] / orig_height
                            )
                            
                            new_width = int(orig_width * scale_factor)
                            new_height = int(orig_height * scale_factor)
                            
                            # Resize image
                            pil_image = pil_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                        
                        # Convert RGBA to RGB if necessary
                        if pil_image.mode == 'RGBA':
                            pil_image = pil_image.convert('RGB')
                        
                        # Save compressed image to bytes
                        img_buffer = io.BytesIO()
                        pil_image.save(
                            img_buffer, 
                            format="JPEG", 
                            quality=settings["jpeg_quality"],
                            optimize=True
                        )
                        img_buffer.seek(0)
                        
                        # Replace image in PDF
                        doc.replace_image(xref, stream=img_buffer.read())
                        
                    except Exception as e:
                        # If image processing fails, continue with next image
                        print(f"Warning: Could not compress image {img_index} on page {page_num}: {e}", flush=True)
                        continue
            
            # Save with appropriate options based on level
            if level == "basic":
                doc.save(output_path, garbage=4, deflate=True)
            elif level == "strong":
                doc.save(output_path, garbage=4, deflate=True, clean=True)
            else:  # extreme
                doc.save(output_path, garbage=4, deflate=True, clean=True)

            doc.close()
            return output_path
        except Exception as e:
            raise ValueError(f"Failed to compress PDF: {e}")

    @staticmethod
    def compress_pdf_manual(job_input: Union[Path, IO[bytes], bytes], output_path: Path, jpeg_quality:int = 85, max_dpi: int = 150):
        """
        Compresses a PDF with manual quality and DPI settings.
        """
        from PIL import Image
        import io
        
        try:
            if isinstance(job_input, (bytes, bytearray)):
                 doc = fitz.open(stream=job_input, filetype="pdf")
            elif hasattr(job_input, "read"):
                if hasattr(job_input, "seek"):
                    job_input.seek(0)
                doc = fitz.open(stream=job_input.read(), filetype="pdf")
            else:
                doc = fitz.open(job_input)
            
            # Process each page
            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images(full=True)
                
                for img_index, img in enumerate(image_list):
                    xref = img[0]
                    
                    try:
                        base_image = doc.extract_image(xref)
                        pil_image = Image.open(io.BytesIO(base_image["image"]))
                        
                        orig_width, orig_height = pil_image.size
                        if orig_width > max_dpi or orig_height > max_dpi:
                            scale_factor = min(max_dpi / orig_width, max_dpi / orig_height)
                            new_width = int(orig_width * scale_factor)
                            new_height = int(orig_height * scale_factor)
                            pil_image = pil_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                        
                        if pil_image.mode == 'RGBA':
                            pil_image = pil_image.convert('RGB')
                        
                        img_buffer = io.BytesIO()
                        pil_image.save(img_buffer, format="JPEG", quality=jpeg_quality, optimize=True)
                        img_buffer.seek(0)
                        doc.replace_image(xref, stream=img_buffer.read())
                    except Exception as e:
                        print(f"Warning: Could not compress image {img_index} on page {page_num}: {e}", flush=True)
                        continue
            
            doc.save(output_path, garbage=4, deflate=True, clean=True)
            doc.close()
            return output_path
        except Exception as e:
            raise ValueError(f"Failed to compress PDF: {e}")

    @staticmethod
    def pdf_to_word(job_input: Union[Path, IO[bytes], bytes], output_path: Path):
        """
        Converts PDF to Word (DOCX) using pdf2docx.
        """
        from pdf2docx import Converter
        import tempfile
        import os

        try:
            # pdf2docx requires a file path usually, or byte stream
            # We'll write to a temp file if it's bytes
            temp_pdf_path = None
            
            if isinstance(job_input, (bytes, bytearray)):
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(job_input)
                    temp_pdf_path = tmp.name
            elif hasattr(job_input, "read"):
                if hasattr(job_input, "seek"):
                    job_input.seek(0)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(job_input.read())
                    temp_pdf_path = tmp.name
            else:
                # It's a path
                temp_pdf_path = str(job_input)

            cv = Converter(temp_pdf_path)
            cv.convert(str(output_path), start=0, end=None)
            cv.close()

            # Cleanup temp file if we created one
            if temp_pdf_path and temp_pdf_path != str(job_input):
                 if os.path.exists(temp_pdf_path):
                    os.remove(temp_pdf_path)

            return output_path
        except Exception as e:
            raise ValueError(f"Failed to convert PDF to Word: {e}")

    @staticmethod
    def image_to_pdf(job_inputs: List[Union[Path, IO[bytes], bytes]], output_path: Path):
        """
        Converts one or more images to a single PDF.
        """
        from PIL import Image
        import io
        print(f"DEBUG: Starting image_to_pdf with {len(job_inputs)} inputs", flush=True)
        
        try:
            images = []
            for inp in job_inputs:
                print(f"DEBUG: Processing input: {inp}", flush=True)
                if isinstance(inp, (bytes, bytearray)):
                    img = Image.open(io.BytesIO(inp))
                elif hasattr(inp, "read"):
                    if hasattr(inp, "seek"):
                        inp.seek(0)
                    img = Image.open(inp)
                else:
                    img = Image.open(inp)
                
                if img.mode == 'RGBA':
                    img = img.convert('RGB')
                images.append(img)
            
            if not images:
                raise ValueError("No images provided for PDF conversion")
            
            print(f"DEBUG: Saving {len(images)} images to PDF at {output_path}", flush=True)
            images[0].save(
                output_path, "PDF", resolution=100.0, save_all=True, append_images=images[1:]
            )
            print("DEBUG: Save complete", flush=True)
            return output_path
        except Exception as e:
            print(f"DEBUG: Error in image_to_pdf: {e}", flush=True)
            raise ValueError(f"Failed to convert Image to PDF: {e}")

    @staticmethod
    def pdf_to_image(job_input: Union[Path, IO[bytes], bytes], output_dir: Path, format: str = "png"):
        """
        Converts PDF pages to images.
        """
        try:
            if isinstance(job_input, (bytes, bytearray)):
                 doc = fitz.open(stream=job_input, filetype="pdf")
            elif hasattr(job_input, "read"):
                if hasattr(job_input, "seek"):
                    job_input.seek(0)
                doc = fitz.open(stream=job_input.read(), filetype="pdf")
            else:
                doc = fitz.open(job_input)
                
            for i in range(len(doc)):
                page = doc.load_page(i)
                pix = page.get_pixmap(dpi=150) # Moderate DPI for web
                pix.save(output_dir / f"page_{i+1}.{format}")
            doc.close()
        except Exception as e:
            raise ValueError(f"Failed to convert PDF to image: {e}")

    @staticmethod
    def image_to_pdf(inputs: List[Union[Path, IO[bytes]]], output_path: Path):
        """
        Converts images to a single PDF.
        """
        try:
            doc = fitz.open()
            for item in inputs:
                # Handle stream vs path for image opening? 
                # PyMuPDF 'open' can handle image files too but usually it's for PDFs.
                # However, convert_to_pdf suggests we are opening an image first.
                # fitz.open(filename) works for images too.
                
                # Check if stream
                if hasattr(item, "read"):
                    if hasattr(item, "seek"):
                        item.seek(0)
                    file_bytes = item.read()
                    img_doc = fitz.open(stream=file_bytes) # Auto-detects image type
                else:
                    img_doc = fitz.open(item)

                pdf_bytes = img_doc.convert_to_pdf()
                img_pdf = fitz.open("pdf", pdf_bytes)
                doc.insert_pdf(img_pdf)
                img_doc.close()
                img_pdf.close()
            doc.save(output_path)
            doc.close()
            return output_path
        except Exception as e:
            raise ValueError(f"Failed to convert images to PDF: {e}")

    @staticmethod
    def extract_text(file_input: Union[Path, IO[bytes], bytes]) -> str:
        try:
            doc = None
            if isinstance(file_input, (bytes, bytearray)):
                doc = fitz.open(stream=file_input, filetype="pdf")
            elif hasattr(file_input, "read"):
                if hasattr(file_input, "seek"):
                    file_input.seek(0)
                file_bytes = file_input.read()
                doc = fitz.open(stream=file_bytes, filetype="pdf")
            else:
                doc = fitz.open(file_input)

            text = ""
            for page in doc:
                text += page.get_text()
            
            doc.close()
            return text
        except Exception as e:
            print(f"Error extracting text: {e}")
            raise ValueError("Failed to extract text from PDF")
