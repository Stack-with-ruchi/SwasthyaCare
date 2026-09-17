import fs from "fs";
import path from "path";
import os from "os";

import Tesseract from "tesseract.js";
import { PDFParse } from "pdf-parse";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import { createCanvas } from "@napi-rs/canvas";

// =====================================================
// IMAGE OCR
// =====================================================

const extractTextFromImage = async (filePath) => {
  console.log("Starting OCR for image...");

  const result = await Tesseract.recognize(filePath, "eng", {
    logger: (info) => {
      if (info.status === "recognizing text") {
        console.log(`OCR progress: ${Math.round(info.progress * 100)}%`);
      }
    },
  });

  return result.data.text || "";
};

// =====================================================
// PDF TEXT EXTRACTION
// =====================================================

const extractPdfText = async (filePath) => {
  console.log("Checking PDF for selectable text...");

  const fileBuffer = fs.readFileSync(filePath);

  const parser = new PDFParse({
    data: fileBuffer,
  });

  try {
    const result = await parser.getText();

    return result.text?.trim() || "";
  } finally {
    await parser.destroy();
  }
};

// =====================================================
// SCANNED PDF OCR
// =====================================================

const extractScannedPdfText = async (filePath) => {
  console.log("Scanned PDF detected.");
  console.log("Starting page-by-page OCR...");

  const pdfBuffer = new Uint8Array(fs.readFileSync(filePath));

  const pdf = await pdfjsLib.getDocument({
    data: pdfBuffer,
  }).promise;

  let completeText = "";

  console.log(`PDF contains ${pdf.numPages} page(s).`);

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    console.log(`Processing PDF page ${pageNumber}/${pdf.numPages}...`);

    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({
      scale: 2,
    });

    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );

    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    const tempImagePath = path.join(
      os.tmpdir(),
      `swasthcare-pdf-page-${Date.now()}-${pageNumber}.png`,
    );

    const imageBuffer = canvas.toBuffer("image/png");

    fs.writeFileSync(tempImagePath, imageBuffer);

    try {
      const result = await Tesseract.recognize(tempImagePath, "eng", {
        logger: (info) => {
          if (info.status === "recognizing text") {
            console.log(
              `Page ${pageNumber} OCR: ${Math.round(info.progress * 100)}%`,
            );
          }
        },
      });

      const pageText = result.data.text || "";

      completeText += `\n\n--- Page ${pageNumber} ---\n\n` + pageText;
    } finally {
      try {
        fs.unlinkSync(tempImagePath);
      } catch (error) {
        console.error("Failed to remove temporary OCR image:", error.message);
      }
    }
  }

  return completeText.trim();
};

// =====================================================
// MAIN DOCUMENT PROCESSOR
// =====================================================

export const extractDocumentText = async (filePath, mimeType) => {
  if (!filePath) {
    throw new Error("File path is required.");
  }

  if (!mimeType) {
    throw new Error("File type is required.");
  }

  // -------------------------------------------------
  // IMAGE
  // -------------------------------------------------

  if (
    mimeType === "image/jpeg" ||
    mimeType === "image/jpg" ||
    mimeType === "image/png"
  ) {
    return await extractTextFromImage(filePath);
  }

  // -------------------------------------------------
  // PDF
  // -------------------------------------------------

  if (mimeType === "application/pdf") {
    const pdfText = await extractPdfText(filePath);

    if (pdfText.length > 20) {
      console.log("Selectable PDF text found.");

      return pdfText;
    }

    console.log("No useful selectable text found.");

    return await extractScannedPdfText(filePath);
  }

  throw new Error(
    "Unsupported document type. Only PDF, JPG, JPEG and PNG are allowed.",
  );
};
