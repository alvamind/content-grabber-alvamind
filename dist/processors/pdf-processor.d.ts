import { Logger } from '../logger';
export interface PdfExtractionOptions {
    ocrEnabled?: boolean;
    scale?: number;
    languages?: string[];
    minTextLength?: number;
}
export declare class PdfProcessor {
    private options;
    private logger;
    constructor(options: PdfExtractionOptions | undefined, logger: Logger);
    extract(buffer: Buffer): Promise<string>;
    private extractNormalText;
    private extractWithOCR;
}
