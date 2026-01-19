
import os
import fitz
from pathlib import Path
from services.pdf_service import PDFService

def create_dummy_pdf(filename):
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "This is a test PDF for verification.", fontsize=20)
    # Insert a dummy image if possible, or just huge text to create size
    for i in range(100):
        page.insert_text((50, 100 + i*5), f"Line {i} - adding content to make file larger " * 5)
    doc.save(filename)
    doc.close()
    return filename

def test_compression():
    print("Testing PDF Compression...")
    input_pdf = Path("test_compress_input.pdf")
    create_dummy_pdf(input_pdf)
    
    original_size = input_pdf.stat().st_size
    print(f"Original size: {original_size} bytes")
    
    levels = ["basic", "strong"]
    for level in levels:
        output_pdf = Path(f"test_compress_{level}.pdf")
        try:
            PDFService.compress_pdf(input_pdf, output_pdf, level=level)
            new_size = output_pdf.stat().st_size
            print(f"Level '{level}' size: {new_size} bytes ({(new_size/original_size)*100:.1f}%)")
            
            # Clean up output
            if output_pdf.exists():
                output_pdf.unlink()
        except Exception as e:
            print(f"Error testing level {level}: {e}")

    # Clean up input
    if input_pdf.exists():
        input_pdf.unlink()

def test_pdf_to_word():
    print("\nTesting PDF to Word...")
    input_pdf = Path("test_word_input.pdf")
    create_dummy_pdf(input_pdf)
    output_docx = Path("test_word_output.docx")
    
    try:
        PDFService.pdf_to_word(input_pdf, output_docx)
        if output_docx.exists() and output_docx.stat().st_size > 0:
            print("PDF to Word conversion successful!")
        else:
            print("PDF to Word conversion failed (output missing or empty).")
        
        if output_docx.exists():
            output_docx.unlink()
    except Exception as e:
        print(f"Error testing PDF to Word: {e}")
        
    if input_pdf.exists():
        input_pdf.unlink()

if __name__ == "__main__":
    test_compression()
    test_pdf_to_word()
