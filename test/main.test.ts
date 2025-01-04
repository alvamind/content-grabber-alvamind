// main.test.ts
import { describe, expect, test } from "bun:test";
import { FileContentExtractor } from "../src";

describe("FileContentExtractor", () => {
  const extractor = new FileContentExtractor();

  test("should extract text from txt file", async () => {
    const result = await extractor.extract(
      "https://raw.githubusercontent.com/alvamind/content-grabber-alvamind/main/files/sample.txt"
    );
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  test("should extract text from PDF file", async () => {
    const result = await extractor.extract(
      "https://raw.githubusercontent.com/alvamind/content-grabber-alvamind/main/files/sample.pdf"
    );
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  test("should extract text from DOCX file", async () => {
    const result = await extractor.extract(
      "https://raw.githubusercontent.com/alvamind/content-grabber-alvamind/main/files/sample.docx"
    );
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  test("should extract text from CSV file", async () => {
    const result = await extractor.extract(
      "https://raw.githubusercontent.com/alvamind/content-grabber-alvamind/main/files/sample.csv"
    );
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  test("should extract text from Excel file", async () => {
    const result = await extractor.extract(
      "https://raw.githubusercontent.com/alvamind/content-grabber-alvamind/main/files/sample.xlsx"
    );
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  test("should throw error for invalid URL", async () => {
    await expect(extractor.extract("")).rejects.toThrow("File URL is required");
  });

  test("should throw error for unsupported file type", async () => {
    await expect(
      extractor.extract(
        "https://raw.githubusercontent.com/alvamind/content-grabber-alvamind/main/files/sample.xyz"
      )
    ).rejects.toThrow();
  });
});
