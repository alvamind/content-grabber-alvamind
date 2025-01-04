import { FileContentExtractor } from './file-content-extractor';
export { FileContentExtractor };
export declare const fetchFileContent: (fileUrl: string, options?: import("./file-content-extractor").FileContentExtractionOptions) => Promise<string>;
export interface FileContentExtractionOptions {
    headers?: Record<string, string>;
}
