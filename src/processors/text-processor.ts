import mammoth from 'mammoth';

export class TextProcessor {
  async extract(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
  }

  async extractFromDocx(buffer: Buffer): Promise<string> {
    return (await mammoth.extractRawText({ buffer })).value || '';
  }
}