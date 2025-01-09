import fetch, { Response as FetchResponse } from 'node-fetch';
import { CustomError } from './exceptions/custom-error.exception';
import { Logger } from './logger';
import * as path from 'path';

export class Fetcher {
  private logger: Logger;
  private mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.csv': 'text/csv',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }

  async fetch(fileUrl: string): Promise<FetchResponse> {
    try {
      const response = (await fetch(fileUrl)) as FetchResponse;
      if (!response.ok) {
        this.logger.error(`HTTP error! Status: ${response.status}`);
        throw new CustomError(new Error(`HTTP error! Status: ${response.status}`));
      }

      // If content-type is not set (which is common with file:// protocol),
      // determine it from the file extension
      if (!response.headers.get('content-type')) {
        const ext = path.extname(fileUrl).toLowerCase();
        const contentType = this.mimeTypes[ext];
        if (contentType) {
          // Create a new response with the content type
          const buffer = await response.buffer();
          return new FetchResponse(buffer, {
            status: response.status,
            statusText: response.statusText,
            headers: {
              'content-type': contentType,
              ...Object.fromEntries(response.headers.entries())
            },
          });
        }
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new CustomError(error);
      }
      throw new CustomError(new Error('Unknown error occurred during fetch'));
    }
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
