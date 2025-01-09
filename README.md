# 🗂️ content-grabber-alvamind

[![NPM Version](https://img.shields.io/npm/v/content-grabber-alvamind)](https://www.npmjs.com/package/content-grabber-alvamind)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

A Node.js library to extract text content from various file types. 💪

## ✨ Features

*   **Versatile File Support**: Extracts text from `.txt`, `.pdf`, `.docx`, `.csv`, and `.xlsx` files. 📄
*   **Local & Remote Files**: Works with both local file paths and URLs. 🌐
*   **Intelligent Content Type Handling**: Automatically detects content types from headers and file extensions. 🤔
*   **PDF Text Extraction**: Extracts text from PDF files, with optional OCR support. 🧐
*   **Configurable OCR**: Control OCR behavior (scale, languages). ⚙️
*  **Customizable Logging**: Supports custom logger for info, error and debug messages. 🪵
*   **Error Handling**: Provides descriptive error messages. ⚠️
*   **Easy to Use**: Simple API for quick integration into your projects. 🚀

## 🎯 Benefits

*   **Simplify Data Extraction**: Quickly grab text from different file types. ⏱️
*   **Save Time**: No need to handle file formats manually. ⏳
*   **Improve Productivity**: Focus on processing text rather than parsing files. 📈
*   **Reliable**: Robust and well-tested. ✅

## 📦 Installation

```bash
npm install content-grabber-alvamind
```

## 🛠️ Usage

### Basic Example

```typescript
import { fetchFileContent } from 'content-grabber-alvamind';

async function main() {
  try {
    const fileUrl = 'path/to/your/document.pdf'; // Replace with your file URL/path
    const extractedContent = await fetchFileContent(fileUrl);
    console.log(extractedContent);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### PDF with OCR

```typescript
import { fetchFileContent } from 'content-grabber-alvamind';

async function main() {
    try {
      const fileUrl = 'path/to/your/scanned_document.pdf';
      const extractedContent = await fetchFileContent(fileUrl, {
          pdfOptions: {
              ocrEnabled: true, // Enable OCR for scanned PDFs
              languages: ['eng', 'spa'], // Specify OCR languages
              scale: 2.5 // increase scale for better OCR quality
          }
      });
      console.log(extractedContent);
  } catch (error) {
      console.error("Error:", error);
  }
}

main();
```

### Custom Logger Example

```typescript
import { fetchFileContent, FileContentExtractionOptions } from 'content-grabber-alvamind';

class CustomLogger {
  info(message: string, ...args: any[]): void {
    console.log(`[CUSTOM INFO] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[CUSTOM ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
     console.debug(`[CUSTOM DEBUG] ${message}`, ...args);
  }
}


async function main() {
  try {
    const fileUrl = 'path/to/your/document.txt';
      const options: FileContentExtractionOptions = {
          logger: new CustomLogger()
      }
    const extractedContent = await fetchFileContent(fileUrl, options);
    console.log(extractedContent);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### DOCX Extraction
```typescript
import { fetchFileContent } from 'content-grabber-alvamind';

async function main() {
  try {
    const fileUrl = 'path/to/your/document.docx'; // Replace with your file URL/path
    const extractedContent = await fetchFileContent(fileUrl);
    console.log(extractedContent);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### CSV Extraction
```typescript
import { fetchFileContent } from 'content-grabber-alvamind';

async function main() {
  try {
    const fileUrl = 'path/to/your/data.csv'; // Replace with your file URL/path
    const extractedContent = await fetchFileContent(fileUrl);
    console.log(extractedContent);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### Excel Extraction
```typescript
import { fetchFileContent } from 'content-grabber-alvamind';

async function main() {
  try {
    const fileUrl = 'path/to/your/data.xlsx'; // Replace with your file URL/path
    const extractedContent = await fetchFileContent(fileUrl);
    console.log(extractedContent);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### API

#### `fetchFileContent(fileUrl: string, options?: FileContentExtractionOptions): Promise<string>`

*   **`fileUrl` (string)**: The URL or local file path of the document to extract text from.
*   **`options` (object, optional)**: An object containing optional configurations:
    *   **`pdfOptions` (object, optional)**: Configuration for PDF extraction:
        *   **`ocrEnabled` (boolean, optional)**: Enable OCR extraction. Default `true`.
        *   **`scale` (number, optional)**: Scale factor for OCR image. Default `2.0`.
        *   **`languages` (string[], optional)**: Array of OCR languages (e.g., `['eng', 'spa']`). Default `['eng']`.
        *    **`minTextLength` (number, optional)**: Minimum length of normal text to consider using OCR. Default `50`.
    *  **`logger`**: Custom logger object that implements `info`, `error` and `debug` methods
*   **Returns**: A `Promise` that resolves with the extracted text content or throws an error.

## 🛣️ Roadmap

*   [ ] Support for more file types (e.g., `.odt`, `.rtf`).
*   [ ] Improved OCR accuracy and performance.
*   [ ] Configurable text extraction strategies.
*   [ ] Add unit tests.
*   [ ] More advanced logging options.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues, feature requests, and pull requests on [GitHub](https://github.com/alvamind/content-grabber-alvamind). 🙏

Here’s how you can help:
*   Report bugs. 🐛
*   Suggest new features. 💡
*   Improve documentation. ✍️
*   Submit code changes. 💻

## 💖 Support the Project

If you find this project useful, consider supporting its development!  You can contribute through:

*   **GitHub Sponsors**: ⭐️ [Link to GitHub Sponsors]
*   **Donations**: 💰 [Link to Donation Platform]

Your support keeps this project going! 🙌

## 📄 License

[MIT](https://opensource.org/licenses/MIT)
