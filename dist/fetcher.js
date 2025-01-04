"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetcher = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const custom_error_exception_1 = require("./exceptions/custom-error.exception");
const logger_1 = require("./logger");
class Fetcher {
    logger;
    constructor(logger) {
        this.logger = logger || new logger_1.Logger();
    }
    async fetch(fileUrl) {
        const response = (await (0, node_fetch_1.default)(fileUrl));
        if (!response.ok) {
            this.logger.error(`HTTP error! Status: ${response.status}`);
            throw new custom_error_exception_1.CustomError(new Error(`HTTP error! Status: ${response.status}`));
        }
        return response;
    }
    async getBufferFromResponse(response) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (!buffer || buffer.length === 0) {
            throw new custom_error_exception_1.CustomError(new Error('Empty file content'));
        }
        return buffer;
    }
}
exports.Fetcher = Fetcher;
