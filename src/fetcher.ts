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