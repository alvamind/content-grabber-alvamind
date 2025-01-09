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
      this.logger.error('Error during PDF processing:', error);
      throw new CustomError(
        new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`),
      );
    }
  }

  private async extractNormalText(buffer: Buffer): Promise<string> {
    try {
      if (!buffer || buffer.length === 0) {
        throw new Error('Invalid PDF buffer');
      }

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        disableFontFace: true
      });

      const pdf = await loadingTask.promise;

      const textPromises = Array.from({ length: pdf.numPages }, async (_, i) => {
        const page = await pdf.getPage(i + 1);
        const content = (await page.getTextContent()) as TextContent;
        return content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      });

      return (await Promise.all(textPromises)).join('\n').trim();
    } catch (error) {
      this.logger.error('Failed to extract normal PDF text:', error);
      throw new CustomError(error as Error);
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
