"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFileContent = exports.FileContentExtractor = void 0;
const file_content_extractor_1 = require("./file-content-extractor");
Object.defineProperty(exports, "FileContentExtractor", { enumerable: true, get: function () { return file_content_extractor_1.FileContentExtractor; } });
const fetchFileContent = async (fileUrl, options) => {
    return await new file_content_extractor_1.FileContentExtractor(options).extract(fileUrl);
};
exports.fetchFileContent = fetchFileContent;
