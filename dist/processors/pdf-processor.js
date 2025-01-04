"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfProcessor = void 0;
const pdfjsLib = __importStar(require("pdfjs-dist"));
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const canvas_1 = require("canvas");
const custom_error_exception_1 = require("../exceptions/custom-error.exception");
const pdfjs_dist_1 = require("pdfjs-dist");
const DEFAULT_PDF_OPTIONS = {
    ocrEnabled: true,
    scale: 2.0,
    languages: ['eng'],
    minTextLength: 50,
};
// Initialize PDF.js worker
pdfjs_dist_1.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
class PdfProcessor {
    options;
    logger;
    constructor(options = {}, logger) {
        this.options = { ...DEFAULT_PDF_OPTIONS, ...options };
        this.logger = logger;
    }
    async extract(buffer) {
        try {
            const normalText = await this.extractNormalText(buffer);
            if (normalText.trim().length > this.options.minTextLength) {
                return normalText;
            }
            if (this.options.ocrEnabled) {
                this.logger.info('No regular text found in PDF, attempting OCR...');
                return this.extractWithOCR(buffer, this.options.scale, this.options.languages);
            }
            return normalText;
        }
        catch (error) {
            throw new custom_error_exception_1.CustomError(new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
    async extractNormalText(buffer) {
        try {
            const pdf = await pdfjsLib.getDocument(new Uint8Array(buffer)).promise;
            const textPromises = Array.from({ length: pdf.numPages }, async (_, i) => {
                const page = await pdf.getPage(i + 1);
                const content = (await page.getTextContent());
                return content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
            });
            return (await Promise.all(textPromises)).join('\n').trim();
        }
        catch (error) {
            this.logger.error('Failed to extract normal PDF text:', error);
            return '';
        }
    }
    async extractWithOCR(buffer, scale, languages) {
        try {
            const pdf = await pdfjsLib.getDocument(new Uint8Array(buffer)).promise;
            const textPromises = Array.from({ length: pdf.numPages }, async (_, i) => {
                const page = await pdf.getPage(i + 1);
                const viewport = page.getViewport({ scale });
                const canvas = (0, canvas_1.createCanvas)(viewport.width, viewport.height);
                const context = canvas.getContext('2d');
                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;
                const imageData = canvas.toDataURL('image/png');
                this.logger.info(`Processing page ${i + 1} with OCR...`);
                const result = await tesseract_js_1.default.recognize(imageData, languages.join('+'), {
                    logger: (message) => {
                        if (message.status === 'recognizing text') {
                            this.logger.debug(`OCR Progress: ${message.progress * 100}%`);
                        }
                    },
                });
                return result.data.text;
            });
            return (await Promise.all(textPromises)).join('\n').trim();
        }
        catch (error) {
            this.logger.error('Failed to perform OCR on PDF:', error);
            throw new custom_error_exception_1.CustomError(new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    }
}
exports.PdfProcessor = PdfProcessor;
