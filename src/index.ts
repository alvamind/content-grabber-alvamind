import { FileContentExtractor } from './file-content-extractor';

export { FileContentExtractor };

export const fetchFileContent = async (fileUrl: string, options?: import('./file-content-extractor').FileContentExtractionOptions): Promise<string> => {
  return await new FileContentExtractor(options).extract(fileUrl);
};

export interface FileContentExtractionOptions {
  // ... any options you want to define ...
  headers?: Record<string, string>;
}
