import csv from 'csv-parser';
import { Readable } from 'stream';
import { CustomError } from '../exceptions/custom-error.exception';

export class CsvProcessor {
  async parse(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const results: string[] = [];
      Readable.from(buffer)
        .pipe(csv())
        .on('data', (data: Record<string, string | number>) => {
          try {
            results.push(JSON.stringify(data));
          } catch (error) {
            reject(new CustomError(error as Error));
          }
        })
        .on('end', () => resolve(results.join('\n')))
        .on('error', (error) => reject(new CustomError(error)));
    });
  }
}
