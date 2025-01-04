"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    constructor(error) {
        super(error.message);
        this.name = 'CustomError';
        this.stack = error.stack;
    }
}
exports.CustomError = CustomError;
