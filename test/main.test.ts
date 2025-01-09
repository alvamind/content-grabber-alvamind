// main.test.ts
import { describe, expect, test, beforeAll } from "bun:test";
import { FileContentExtractor } from "../src";
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

describe("FileContentExtractor", () => {
  let extractor: FileContentExtractor;
  const filesDir = path.join(__dirname, 'file');

  beforeAll(() => {
    extractor = new FileContentExtractor();
  });


  test("should extract text from a simple text file", async () => {
    const filePath = path.join(filesDir, 'sample.txt');
    const fileUrl = `file://${filePath}`;
    const expectedContent = await fs.readFile(filePath, 'utf-8');
    const result = await extractor.extract(fileUrl);
    expect(result).toBe(expectedContent);
    expect(typeof result).toBe("string");
  });


  test("should extract text from a PDF file with regular text", async () => {
    const filePath = path.join(filesDir, 'sample.pdf');
    const fileUrl = `file://${filePath}`;
    const result = await extractor.extract(fileUrl);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(100) // basic validation
  });

  test("should extract text from a DOCX file", async () => {
    const filePath = path.join(filesDir, 'demo.docx');
    const fileUrl = `file://${filePath}`;
    const result = await extractor.extract(fileUrl);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(100) // basic validation
  });

  test("should extract data from a CSV file and parse it to string", async () => {
    const filePath = path.join(filesDir, 'customers-100.csv');
    const fileUrl = `file://${filePath}`;
    const result = await extractor.extract(fileUrl);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    const lines = result.trim().split('\n');
    expect(lines.length).toBe(100);
    expect(lines[0]).toContain('"');

  });

  test("should extract data from an Excel file and parse it to string", async () => {
    const filePath = path.join(filesDir, 'example.xlsx');
    const fileUrl = `file://${filePath}`;
    const result = await extractor.extract(fileUrl);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
    const lines = result.trim().split('\n');
    expect(lines.length).toBeGreaterThan(2); // Basic validation

  });

  test("should throw error for invalid URL", async () => {
    await expect(extractor.extract("")).rejects.toThrow("File URL is required");
  });

  test("should throw error for unsupported file type", async () => {
    const filePath = path.join(filesDir, 'sample.txt'); //Using a txt file to make sure a file exists
    const fileUrl = `file://${filePath.replace(/.txt$/, '.xyz')}`;
    await expect(
      extractor.extract(fileUrl)
    ).rejects.toThrow();
  });

  test('should handle file not found error', async () => {
    const nonExistentFile = `file://${path.join(filesDir, 'not-exist.txt')}`;
    await expect(extractor.extract(nonExistentFile)).rejects.toThrow();
  });

  test('should handle a corrupt file', async () => {
    const filePath = path.join(filesDir, 'sample.txt');
    const fileUrl = `file://${filePath}`;
    const originalContent = await fs.readFile(filePath, 'utf-8');
    await fs.writeFile(filePath, 'corrupted content');
    await expect(extractor.extract(fileUrl)).rejects.toThrow();
    await fs.writeFile(filePath, originalContent);
  });
});
