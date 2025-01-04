# Project: content-grabber-alvamind

src
src/interfaces
test
====================
// LICENSE
MIT License
Copyright (c) 2025 alvamind
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

// all-in-one.ts
import { FileContentExtractor } from './file-content-extractor';
export { FileContentExtractor };
export const fetchFileContent = async (fileUrl: string, options?: FileContentExtractionOptions): Promise<string> => {
  return await new FileContentExtractor(options).extract(fileUrl);
};
import { Fetcher } from './fetcher';
import { TextProcessor } from './processors/text-processor';
import { PdfProcessor, PdfExtractionOptions } from './processors/pdf-processor';
import { CsvProcessor } from './processors/csv-processor';
import { ExcelProcessor } from './processors/excel-processor';
import { CustomError } from './exceptions/custom-error.exception';
import { Logger } from './logger';
export interface FileContentExtractionOptions {
  pdfOptions?: PdfExtractionOptions;
  logger?: Logger;
}
export class FileContentExtractor {
  private fetcher: Fetcher;
  private pdfOptions?: PdfExtractionOptions;
  private logger: Logger;
  constructor(options: FileContentExtractionOptions = {}) {
    this.fetcher = new Fetcher();
    this.pdfOptions = options.pdfOptions;
    this.logger = options.logger || new Logger();
  }
  async extract(fileUrl: string): Promise<string> {
    if (!fileUrl) {
      throw new CustomError(new Error('File URL is required'));
    }
    try {
      const response = await this.fetcher.fetch(fileUrl);
      const buffer = await this.fetcher.getBufferFromResponse(response);
      const contentType = response.headers.get('content-type')?.toLowerCase() || '';
      return await this.processFileContent(buffer, contentType);
    } catch (error) {
      this.logger.error(`Failed to fetch file from ${fileUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new CustomError(new Error(`Failed to fetch file from ${fileUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
  private async processFileContent(buffer: Buffer, contentType: string): Promise<string> {
    const contentProcessors: Record<string, () => Promise<string>> = {
      'text/plain': () => new TextProcessor().extract(buffer),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': async () =>
        new TextProcessor().extractFromDocx(buffer),
      'application/pdf': () => new PdfProcessor(this.pdfOptions, this.logger).extract(buffer),
      'text/csv': () => new CsvProcessor().parse(buffer),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': () => new ExcelProcessor().parse(buffer),
    };
    const processor = Object.entries(contentProcessors).find(([type]) => contentType.includes(type))?.[1];
    if (!processor) {
      throw new CustomError(new Error(`Unsupported content type: ${contentType}`));
    }
    return processor();
  }
}
import fetch, { Response as FetchResponse } from 'node-fetch';
import { CustomError } from './exceptions/custom-error.exception';
import { Logger } from './logger';
export class Fetcher {
  private logger: Logger;
  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }
  async fetch(fileUrl: string): Promise<FetchResponse> {
    const response = (await fetch(fileUrl)) as FetchResponse;
    if (!response.ok) {
      this.logger.error(`HTTP error! Status: ${response.status}`);
      throw new CustomError(new Error(`HTTP error! Status: ${response.status}`));
    }
    return response;
  }
  async getBufferFromResponse(response: FetchResponse): Promise<Buffer> {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!buffer || buffer.length === 0) {
      throw new CustomError(new Error('Empty file content'));
    }
    return buffer;
  }
}
import mammoth from 'mammoth';
export class TextProcessor {
  async extract(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
  }
  async extractFromDocx(buffer: Buffer): Promise<string> {
    return (await mammoth.extractRawText({ buffer })).value || '';
  }
}
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';
import { CustomError } from '../exceptions/custom-error.exception';
import { Logger } from '../logger';
import { GlobalWorkerOptions } from 'pdfjs-dist';
interface TextContent {
  items: Array<TextItem | TextMarkedContent>;
  styles?: Record<string, unknown>;
}
interface TextItem {
  str: string;
  dir?: string;
  transform?: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
}
interface TextMarkedContent {
  type: string;
  items?: TextItem[];
}
export interface PdfExtractionOptions {
  ocrEnabled?: boolean;
  scale?: number;
  languages?: string[];
  minTextLength?: number;
}
const DEFAULT_PDF_OPTIONS: PdfExtractionOptions = {
  ocrEnabled: true,
  scale: 2.0,
  languages: ['eng'],
  minTextLength: 50,
};
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
export class PdfProcessor {
  private options: PdfExtractionOptions;
  private logger: Logger;
  constructor(options: PdfExtractionOptions = {}, logger: Logger) {
    this.options = { ...DEFAULT_PDF_OPTIONS, ...options };
    this.logger = logger;
  }
  async extract(buffer: Buffer): Promise<string> {
    try {
      const normalText = await this.extractNormalText(buffer);
      if (normalText.trim().length > this.options.minTextLength!) {
        return normalText;
      }
      if (this.options.ocrEnabled) {
        this.logger.info('No regular text found in PDF, attempting OCR...');
        return this.extractWithOCR(buffer, this.options.scale!, this.options.languages!);
      }
      return normalText;
    } catch (error) {
      throw new CustomError(
        new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`),
      );
    }
  }
  private async extractNormalText(buffer: Buffer): Promise<string> {
    try {
      const pdf = await pdfjsLib.getDocument(new Uint8Array(buffer)).promise;
      const textPromises = Array.from({ length: pdf.numPages }, async (_, i) => {
        const page = await pdf.getPage(i + 1);
        const content = (await page.getTextContent()) as TextContent;
        return content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      });
      return (await Promise.all(textPromises)).join('\n').trim();
    } catch (error) {
      this.logger.error('Failed to extract normal PDF text:', error);
      return '';
    }
  }
  private async extractWithOCR(buffer: Buffer, scale: number, languages: string[]): Promise<string> {
    try {
      const pdf = await pdfjsLib.getDocument(new Uint8Array(buffer)).promise;
      const textPromises = Array.from({ length: pdf.numPages }, async (_, i) => {
        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale });
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        const imageData = canvas.toDataURL('image/png');
        this.logger.info(`Processing page ${i + 1} with OCR...`);
        const result = await Tesseract.recognize(imageData, languages.join('+'), {
          logger: (message) => {
            if (message.status === 'recognizing text') {
              this.logger.debug(`OCR Progress: ${message.progress * 100}%`);
            }
          },
        });
        return result.data.text;
      });
      return (await Promise.all(textPromises)).join('\n').trim();
    } catch (error) {
      this.logger.error('Failed to perform OCR on PDF:', error);
      throw new CustomError(new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
}
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { CustomError } from '../exceptions/custom-error.exception';
export class CsvProcessor {
  async parse(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const results: string[] = [];
      Readable.from(buffer)
        .pipe(csv())
        .on('data', (data: Record<string, string | number>) => {
          try {
            results.push(JSON.stringify(data));
          } catch (error) {
            reject(new CustomError(error));
          }
        })
        .on('end', () => resolve(results.join('\n')))
        .on('error', (error) => reject(new CustomError(error)));
    });
  }
}
import * as xlsx from 'xlsx';
import { CustomError } from '../exceptions/custom-error.exception';
export class ExcelProcessor {
  parse(buffer: Buffer): string {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      if (!workbook.SheetNames.length) {
        throw new CustomError(new Error('No sheets found in the Excel file'));
      }
      return xlsx.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    } catch (error) {
      throw new CustomError(
        new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`),
      );
    }
  }
}
export class CustomError extends Error {
  constructor(error: Error) {
    super(error.message);
    this.name = 'CustomError';
    this.stack = error.stack;
  }
}
export class Logger {
  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
  debug(message: string, ...args: any[]): void {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

// package.json
{
  "name": "retry-util-alvamind",
  "version": "1.0.0",
  "author": "Alvamind",
  "repository": {
    "type": "git",
    "url": "https://github.com/alvamind/retry-util-alvamind.git"
  },
  "main": "dist/index.js",
  "module": "dist/index.js",
  "devDependencies": {
    "@types/node": "^20.17.11",
    "bun-types": "^1.1.42",
    "rimraf": "^5.0.10",
    "typescript": "^5.7.2"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "description": "A utility for retrying async operations",
  "files": [
    "dist",
    "src",
    "README.md",
    "index.d.ts"
  ],
  "keywords": [
    "retry",
    "async",
    "utility",
    "exponential backoff",
    "alvamind"
  ],
  "license": "MIT",
  "scripts": {
    "source": "generate-source output=source.md exclude=dist/,README.md,nats-rpc.test.ts,rpc-nats-alvamind-1.0.0.tgz,.gitignore",
    "split": "split all-in-one.ts \"src/,custom/\" ./output ",
    "dev": "bun run src/index.ts --watch",
    "build": "tsc && tsc -p tsconfig.build.json",
    "clean-dist": "rimraf dist",
    "prebuild": "npm run clean"
  },
  "type": "module",
  "types": "dist/index.d.ts",
  "dependencies": {
    "alvamind-tools": "^1.0.10"
  }
}

// src/index.ts
import { RetryConfigInterface } from "./interfaces/general.interface";
export class RetryUtil {
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfigInterface,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error;
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (onRetry) onRetry(attempt, lastError);
        if (attempt === config.maxRetries) break;
        const delay = Math.min(
          config.initialDelay * Math.pow(config.factor, attempt - 1),
          config.maxDelay
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError!;
  }
}

// src/interfaces/general.interface.ts
export interface RetryConfigInterface {
    maxRetries: number;
    initialDelay: number;
    factor: number;
    maxDelay: number;
}

// test/retry.test.ts
import { expect, test, mock } from "bun:test";
import { RetryUtil } from "../src/index";
import { RetryConfigInterface } from "../src/interfaces/general.interface";
const defaultConfig: RetryConfigInterface = {
  maxRetries: 3,
  initialDelay: 100,
  factor: 2,
  maxDelay: 1000,
};
test("should succeed on first attempt", async () => {
  const operation = () => Promise.resolve("success");
  const result = await RetryUtil.withRetry(operation, defaultConfig);
  expect(result).toBe("success");
});
test("should succeed after one retry", async () => {
  let attempts = 0;
  const operation = () => {
    if (attempts++ === 0) {
      throw new Error("First attempt failed");
    }
    return Promise.resolve("success");
  };
  const result = await RetryUtil.withRetry(operation, defaultConfig);
  expect(result).toBe("success");
});
test("should fail after max retries", async () => {
  const operation = () => Promise.reject(new Error("Operation failed"));
  await expect(RetryUtil.withRetry(operation, defaultConfig)).rejects.toThrow(
    "Operation failed"
  );
});
test("should respect maxDelay configuration", async () => {
  const config: RetryConfigInterface = {
    ...defaultConfig,
    maxDelay: 200,
  };
  let attempts = 0;
  const operation = () => {
    attempts++;
    return Promise.reject(new Error("Operation failed"));
  };
  const start = Date.now();
  await expect(RetryUtil.withRetry(operation, config)).rejects.toThrow();
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000); // Should be less than sum of max delays
});
test("should call onRetry callback for each retry", async () => {
  const onRetry = mock((attempt: number, error: Error) => { });
  const operation = () => Promise.reject(new Error("Operation failed"));
  await expect(RetryUtil.withRetry(operation, defaultConfig, onRetry)).rejects.toThrow();
  expect(onRetry).toHaveBeenCalledTimes(defaultConfig.maxRetries);
});
test("should handle zero retries configuration", async () => {
  const config: RetryConfigInterface = {
    ...defaultConfig,
    maxRetries: 0,
  };
  const operation = () => Promise.reject(new Error("Operation failed"));
  await expect(RetryUtil.withRetry(operation, config)).rejects.toThrow();
});
test("should handle async operations with varying delays", async () => {
  let attempts = 0;
  const operation = async () => {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 50));
    if (attempts < 2) throw new Error("Not ready");
    return "success";
  };
  const result = await RetryUtil.withRetry(operation, defaultConfig);
  expect(result).toBe("success");
  expect(attempts).toBe(2);
});
test("should apply exponential backoff", async () => {
  const timestamps: number[] = [];
  const operation = () => {
    timestamps.push(Date.now());
    return Promise.reject(new Error("Operation failed"));
  };
  await expect(RetryUtil.withRetry(operation, defaultConfig)).rejects.toThrow();
  for (let i = 1; i < timestamps.length; i++) {
    const diff = timestamps[i] - timestamps[i - 1];
    expect(diff).toBeGreaterThan(defaultConfig.initialDelay * Math.pow(defaultConfig.factor, i - 1) - 50);
  }
});
test("should handle non-Error throws", async () => {
  const operation = () => Promise.reject("string error");
  await expect(RetryUtil.withRetry(operation, defaultConfig)).rejects.toThrow();
});
test("should preserve error instance type", async () => {
  class CustomError extends Error {
    constructor() {
      super("Custom error");
      this.name = "CustomError";
    }
  }
  const operation = () => Promise.reject(new CustomError());
  try {
    await RetryUtil.withRetry(operation, defaultConfig);
  } catch (error) {
    expect(error).toBeInstanceOf(CustomError);
  }
});

// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": ["test", "dist", "scripts"],
  "compilerOptions": {
    "declaration": true,
    "outDir": "./dist"
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "lib": ["ESNext"],
    "types": ["bun-types"]
  },
  "include": ["src*.ts", "test*.ts"],
  "exclude": ["node_modules"]
}

