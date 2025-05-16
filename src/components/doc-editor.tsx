import type React from "react";
import { useState, useEffect, useRef } from "react";
import mammoth from "mammoth";
import { Button } from "../components/ui/button";
import { Loader2, Save, X } from "lucide-react";
import { saveFileWords } from "../services/textService";

interface DocxEditorProps {
  base64Docx: string;
  meetingCode: string;
  onClose: () => void;
  onSave: () => void;
}

const DocxEditor: React.FC<DocxEditorProps> = ({
  base64Docx,
  meetingCode,
  onClose,
  onSave,
}) => {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const convertDocxToHtml = async () => {
      try {
        setLoading(true);
        // Convert base64 to ArrayBuffer
        const binaryString = window.atob(base64Docx);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        // Convert docx to HTML with better formatting preservation
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Normal'] => p",
            ],
            includeEmbeddedStyleMap: true,
            includeDefaultStyleMap: true,
          }
        );

        // Add basic styling to preserve some formatting in the editor
        const styledHtml = `
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.5; }
            h1 { font-size: 24px; font-weight: bold; }
            h2 { font-size: 20px; font-weight: bold; }
            h3 { font-size: 16px; font-weight: bold; }
            p { margin: 2px 0; font-size: 14px; }
            ul, ol { margin-left: 24px; }
            strong { font-weight: bold; }
            em { font-style: italic; }
            u { text-decoration: underline; }
          </style>
          ${result.value}
        `;
        setHtml(styledHtml);
      } catch (error) {
        console.error("Error converting docx to HTML:", error);
        setHtml("<p>Error loading document. Please try again.</p>");
      } finally {
        setLoading(false);
      }
    };

    convertDocxToHtml();
  }, [base64Docx]);

  const handleSave = async () => {
    if (!editorRef.current) return;

    try {
      setSaving(true);

      // Get the edited HTML content
      const editedHtml = editorRef.current.innerText;
      const stringBase64 = btoa(unescape(encodeURIComponent(editedHtml)));
      console.log("Edited HTML:", stringBase64);

      // Save the converted base64 DOCX
      const response = await saveFileWords(meetingCode, stringBase64);

      if (response.code === 200) {
        onSave();
        onClose();
      } else {
        console.error("Error saving document:", response);
      }
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-bold">Chỉnh sửa tài liệu</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Đóng
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lưu
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div
            ref={editorRef}
            className="min-h-full border p-4 rounded-md bg-white prose max-w-none"
            contentEditable
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
};

export default DocxEditor;
