// src/index.ts
import { FileContentExtractor } from './file-content-extractor';

export { FileContentExtractor };

export const fetchFileContent = async (fileUrl: string, options?: FileContentExtractionOptions): Promise<string> => {
  return await new FileContentExtractor(options).extract(fileUrl);
};


// src/file-content-extractor.ts
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


// src/fetcher.ts
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

// src/processors/text-processor.ts
import mammoth from 'mammoth';

export class TextProcessor {
  async extract(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
  }

  async extractFromDocx(buffer: Buffer): Promise<string> {
    return (await mammoth.extractRawText({ buffer })).value || '';
  }
}

// src/processors/pdf-processor.ts
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';
import { CustomError } from '../exceptions/custom-error.exception';
import { Logger } from '../logger';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Types
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

// Initialize PDF.js worker
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

// src/processors/csv-processor.ts
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

// src/processors/excel-processor.ts
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
// src/exceptions/custom-error.exception.ts
export class CustomError extends Error {
  constructor(error: Error) {
    super(error.message);
    this.name = 'CustomError';
    this.stack = error.stack;
  }
}
// src/logger.ts
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
