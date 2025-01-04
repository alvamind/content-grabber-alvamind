"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileContentExtractor = void 0;
const fetcher_1 = require("./fetcher");
const text_processor_1 = require("./processors/text-processor");
const pdf_processor_1 = require("./processors/pdf-processor");
const csv_processor_1 = require("./processors/csv-processor");
const excel_processor_1 = require("./processors/excel-processor");
const custom_error_exception_1 = require("./exceptions/custom-error.exception");
const logger_1 = require("./logger");
class FileContentExtractor {
    fetcher;
    pdfOptions;
    logger;
    constructor(options = {}) {
        this.fetcher = new fetcher_1.Fetcher();
        this.pdfOptions = options.pdfOptions;
        this.logger = options.logger || new logger_1.Logger();
    }
    async extract(fileUrl) {
        if (!fileUrl) {
            throw new custom_error_exception_1.CustomError(new Error('File URL is required'));
        }
        try {
            const response = await this.fetcher.fetch(fileUrl);
            const buffer = await this.fetcher.getBufferFromResponse(response);
            const contentType = response.headers.get('content-type')?.toLowerCase() || '';
            return await this.processFileContent(buffer, contentType);
        }
        catch (error) {
            this.logger.error(`Failed to fetch file from ${fileUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw new custom_error_exception_1.CustomError(new Error(`Failed to fetch file from ${fileUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
    async processFileContent(buffer, contentType) {
        const contentProcessors = {
            'text/plain': () => new text_processor_1.TextProcessor().extract(buffer),
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': async () => new text_processor_1.TextProcessor().extractFromDocx(buffer),
            'application/pdf': () => new pdf_processor_1.PdfProcessor(this.pdfOptions, this.logger).extract(buffer),
            'text/csv': () => new csv_processor_1.CsvProcessor().parse(buffer),
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': async () => {
                return new excel_processor_1.ExcelProcessor().parse(buffer);
            },
        };
        const processor = Object.entries(contentProcessors).find(([type]) => contentType.includes(type))?.[1];
        if (!processor) {
            throw new custom_error_exception_1.CustomError(new Error(`Unsupported content type: ${contentType}`));
        }
        return processor();
    }
}
exports.FileContentExtractor = FileContentExtractor;
