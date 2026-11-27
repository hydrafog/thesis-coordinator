import { PDFParse } from "pdf-parse";

const MAX_TEXT_LENGTH = 2_000_000;

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(bytes) });
  try {
    const result = await parser.getText();
    return result.text.slice(0, MAX_TEXT_LENGTH);
  } finally {
    await parser.destroy();
  }
}
