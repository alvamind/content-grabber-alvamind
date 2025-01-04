"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextProcessor = void 0;
const mammoth_1 = __importDefault(require("mammoth"));
class TextProcessor {
    async extract(buffer) {
        return buffer.toString('utf-8');
    }
    async extractFromDocx(buffer) {
        return (await mammoth_1.default.extractRawText({ buffer })).value || '';
    }
}
exports.TextProcessor = TextProcessor;
