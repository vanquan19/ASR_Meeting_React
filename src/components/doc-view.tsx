import React, { useEffect, useState } from "react";
import mammoth from "mammoth";

interface Props {
  base64Docx: string; // chỉ phần base64, không kèm "data:..."
}

const DocxViewer: React.FC<Props> = ({ base64Docx }) => {
  const [htmlContent, setHtmlContent] = useState<string>("");

  useEffect(() => {
    const base64ToArrayBuffer = (base64: string) => {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    };

    const arrayBuffer = base64ToArrayBuffer(base64Docx);

    mammoth
      .convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            'p[style-name="Heading 1"] => h1:fresh',
            'p[style-name="Heading 2"] => h2:fresh',
            'p[style-name="Heading 3"] => h3:fresh',
            'p[style-name="Normal"] => p',
          ],
          includeEmbeddedStyleMap: true,
          includeDefaultStyleMap: true,
        }
      )
      .then((result) => {
        // Xử lý HTML để chỉ giữ 1 thẻ <br> liên tiếp
        const cleanedHtml = result.value.replace(
          /(<br\s*\/?>\s*){2,}/gi,
          "<br />"
        );
        setHtmlContent(cleanedHtml);
      })
      .catch((err) => {
        console.error("Error converting DOCX:", err);
      });
  }, [base64Docx]);

  return (
    <div
      className="docx-viewer"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default DocxViewer;
