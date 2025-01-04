import { PdfExtractionOptions } from './processors/pdf-processor';
import { Logger } from './logger';
export interface FileContentExtractionOptions {
    pdfOptions?: PdfExtractionOptions;
    logger?: Logger;
}
export declare class FileContentExtractor {
    private fetcher;
    private pdfOptions?;
    private logger;
    constructor(options?: FileContentExtractionOptions);
    extract(fileUrl: string): Promise<string>;
    private processFileContent;
}
