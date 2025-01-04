export declare class TextProcessor {
    extract(buffer: Buffer): Promise<string>;
    extractFromDocx(buffer: Buffer): Promise<string>;
}
