"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvProcessor = void 0;
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
const custom_error_exception_1 = require("../exceptions/custom-error.exception");
class CsvProcessor {
    async parse(buffer) {
        return new Promise((resolve, reject) => {
            const results = [];
            stream_1.Readable.from(buffer)
                .pipe((0, csv_parser_1.default)())
                .on('data', (data) => {
                try {
                    results.push(JSON.stringify(data));
                }
                catch (error) {
                    reject(new custom_error_exception_1.CustomError(error));
                }
            })
                .on('end', () => resolve(results.join('\n')))
                .on('error', (error) => reject(new custom_error_exception_1.CustomError(error)));
        });
    }
}
exports.CsvProcessor = CsvProcessor;
