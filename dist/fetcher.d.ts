import { Response as FetchResponse } from 'node-fetch';
import { Logger } from './logger';
export declare class Fetcher {
    private logger;
    constructor(logger?: Logger);
    fetch(fileUrl: string): Promise<FetchResponse>;
    getBufferFromResponse(response: FetchResponse): Promise<Buffer>;
}
