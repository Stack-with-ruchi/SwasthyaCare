import fs from "fs";
import path from "path";
import { extractDocumentText } from "./services/ocrService.js";

const filePath = path.join(process.cwd(), "tmp-ocr-test.pdf");
const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 49 >>
stream
BT
/F1 18 Tf
72 72 Td
(Test OCR text) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000128 00000 n 
0000000249 00000 n 
0000000620 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
716
%%EOF`;

fs.writeFileSync(filePath, pdf);

try {
  const text = await extractDocumentText(filePath, "application/pdf");
  console.log("OCR_RESULT_START");
  console.log(text);
  console.log("OCR_RESULT_END");
} finally {
  fs.unlinkSync(filePath);
}
