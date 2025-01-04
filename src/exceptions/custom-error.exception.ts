export class CustomError extends Error {
  constructor(error: Error) {
    super(error.message);
    this.name = 'CustomError';
    this.stack = error.stack;
  }
}