import * as xlsx from 'xlsx';
import { CustomError } from '../exceptions/custom-error.exception';


export class ExcelProcessor {
  parse(buffer: Buffer): string {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      if (!workbook.SheetNames.length) {
        throw new CustomError(new Error('No sheets found in the Excel file'));
      }
      return xlsx.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
    } catch (error) {
      throw new CustomError(
        new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`),
      );
    }
  }
}