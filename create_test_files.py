import fitz
from PIL import Image

def create_test_pdf(filename, text):
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), text, fontsize=20)
    doc.save(filename)
    print(f"Created {filename}")

def create_test_image(filename):
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save(filename)
    print(f"Created {filename}")

if __name__ == "__main__":
    create_test_pdf("test1.pdf", "Hello World 1")
    create_test_pdf("test2.pdf", "Hello World 2")
    create_test_image("test_image.png")
