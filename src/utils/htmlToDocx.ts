import { Document, Paragraph, TextRun, Packer } from "docx";

export async function htmlToDocx(html: string): Promise<Blob> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const children = Array.from(doc.body.childNodes);
  const docxChildren = await processNodes(children);
  
  const docx = new Document({
    sections: [{
      properties: {},
      children: docxChildren
    }]
  });
  
  return Packer.toBlob(docx);
}

async function processNodes(nodes: Node[]): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = [];
  let currentParagraphChildren: TextRun[] = [];
  let currentText = '';
  let currentBold = false;
  let currentItalic = false;
  let currentUnderline = false;

  const pushCurrentParagraph = () => {
    if (currentText.trim() !== '') {
      currentParagraphChildren.push(
        new TextRun({
          text: currentText,
          bold: currentBold,
          italics: currentItalic,
          underline: currentUnderline ? {} : undefined
        })
      );
    }
    
    if (currentParagraphChildren.length > 0) {
      paragraphs.push(new Paragraph({
        children: [...currentParagraphChildren]
      }));
    }
    
    currentParagraphChildren = [];
    currentText = '';
  };

  const processNode = async (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      currentText += node.textContent || '';
    } 
    else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      
      switch (element.tagName.toLowerCase()) {
        case 'p':
          if (currentText || currentParagraphChildren.length > 0) {
            pushCurrentParagraph();
          }
          const childNodes = Array.from(element.childNodes);
          for (const child of childNodes) {
            await processNode(child);
          }
          pushCurrentParagraph();
          break;
          
        case 'br':
          pushCurrentParagraph();
          break;
          
        case 'strong':
        case 'b':
          if (currentText) {
            currentParagraphChildren.push(
              new TextRun({
                text: currentText,
                bold: currentBold,
                italics: currentItalic,
                underline: currentUnderline ? {} : undefined
              })
            );
            currentText = '';
          }
          currentBold = true;
          const strongChildren = Array.from(element.childNodes);
          for (const child of strongChildren) {
            await processNode(child);
          }
          currentBold = false;
          break;
          
        case 'em':
        case 'i':
          if (currentText) {
            currentParagraphChildren.push(
              new TextRun({
                text: currentText,
                bold: currentBold,
                italics: currentItalic,
                underline: currentUnderline ? {} : undefined
              })
            );
            currentText = '';
          }
          currentItalic = true;
          const emChildren = Array.from(element.childNodes);
          for (const child of emChildren) {
            await processNode(child);
          }
          currentItalic = false;
          break;
          
        case 'u':
          if (currentText) {
            currentParagraphChildren.push(
              new TextRun({
                text: currentText,
                bold: currentBold,
                italics: currentItalic,
                underline: currentUnderline ? {} : undefined
              })
            );
            currentText = '';
          }
          currentUnderline = true;
          const uChildren = Array.from(element.childNodes);
          for (const child of uChildren) {
            await processNode(child);
          }
          currentUnderline = false;
          break;
          
        default:
          const defaultChildren = Array.from(element.childNodes);
          for (const child of defaultChildren) {
            await processNode(child);
          }
          break;
      }
    }
  };

  for (const node of nodes) {
    await processNode(node);
  }
  
  // Push any remaining content
  pushCurrentParagraph();
  
  return paragraphs;
}