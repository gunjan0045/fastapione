import fitz  # PyMuPDF
import os

def create_pdf(markdown_file, output_pdf):
    with open(markdown_file, 'r', encoding='utf-8') as f:
        text = f.read()

    # Create a new Document
    doc = fitz.open()
    page = doc.new_page()

    # Simple bounding box
    rect = fitz.Rect(50, 50, page.rect.width - 50, page.rect.height - 50)
    
    # insert_textbox natively supports basic text insertion and wraps text
    # It also returns remainders. We can handle pagination if needed.
    # PyMuPDF doesn't format Markdown natively, but we can do a raw text dump
    
    # Since we can't style md easily in raw fitz, we just inject the raw text.
    # A generic text block is easier context.
    
    # Actually, fitz has an HTML to PDF converter via Story!
    # story = fitz.Story(html=html_string) is supported in newer PyMuPDF versions.
    # But since text is simple:
    
    # Let's cleanly inject multi-page
    y = 50
    font_size = 11
    
    for line in text.split('\n'):
        # Very simplistic printing
        if y > page.rect.height - 50:
            page = doc.new_page()
            y = 50
        
        # basic md cleanup
        clean_text = line.replace('**', '').replace('## ', '').replace('# ', '').replace('* ', '- ')
        
        if line.startswith('#'):
            font_size = 16
        elif line.startswith('##'):
            font_size = 14
        else:
            font_size = 11
            
        page.insert_text((50, y), clean_text, fontsize=font_size, fontname="helv", color=(0,0,0))
        y += font_size + 6

    doc.save(output_pdf)
    doc.close()

if __name__ == "__main__":
    create_pdf("../project_knowledge.md", "../project_knowledge.pdf")
    print("PyMuPDF Generation Complete.")
