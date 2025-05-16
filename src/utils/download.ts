import { Document, Paragraph, Packer, TextRun, AlignmentType } from "docx";

export const handleDownload = (html: string, filename: string) => {
  // Create a temporary div to parse the HTML content properly
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const paragraphs: Paragraph[] = [];

  // Process heading (title)
  const heading = tempDiv.querySelector("h2");
  if (heading) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: (heading.textContent || "").toUpperCase(),
            bold: true,
            size: 32,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Process content paragraphs
  const contentDiv = tempDiv.querySelector(".docx-viewer");
  if (contentDiv) {
    const content = contentDiv.innerHTML;

    // Split by <br> tags to create separate paragraphs
    const lines = content.split(/<br\s*\/?>/i);

    lines.forEach((line) => {
      // Clean up the line
      const cleanLine = line.replace(/<\/?p>/g, "").trim();

      if (cleanLine) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanLine,
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    });
  }

  // Create the document with the paragraphs
  const docx = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  // Generate and download the file
  Packer.toBlob(docx).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Biên bản cuộc họp " + (filename || "meeting-minutes.docx");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};
