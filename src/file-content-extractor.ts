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
    if (!buffer || buffer.length === 0) {
      throw new CustomError(new Error('Empty or invalid file content'));
    }

    const contentProcessors: Record<string, () => Promise<string>> = {
      'text/plain': () => new TextProcessor().extract(buffer),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': async () =>
        new TextProcessor().extractFromDocx(buffer),
      'application/pdf': () => new PdfProcessor(this.pdfOptions, this.logger).extract(buffer),
      'text/csv': () => new CsvProcessor().parse(buffer),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': async () => {
        return new ExcelProcessor().parse(buffer)
      },
    };

    const processor = Object.entries(contentProcessors).find(([type]) => contentType.includes(type))?.[1];

    if (!processor) {
      throw new CustomError(new Error(`Unsupported content type: ${contentType}`));
    }

    return processor();
  }
}
