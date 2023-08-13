import { request } from "https";

class HttpError extends Error {

    public readonly statusCode: number | undefined;

    constructor(message?: string, statusCode?: number) {

        super(message);
        this.statusCode = statusCode;

    }
}

export function makeRequest<T extends object>(url: string | URL, method: string, data?: { [key: string]: unknown }, headers?: { [key: string]: string | number }): Promise<T>;
export function makeRequest<undefined>(url: string | URL, method: string, data?: { [key: string]: unknown }, headers?: { [key: string]: string | number }): Promise<unknown>;
export function makeRequest<T extends object | undefined>(url: string | URL, method: string, data?: { [key: string]: unknown }, headers?: { [key: string]: string | number }): Promise<T | undefined> {

    return new Promise<T | undefined>((resolve, reject) => {

        const req = request(url, {
            method: method,
            headers: headers
        }, (res) => {

            if (res.statusCode === 200 || res.statusCode === 201) {

                let data = '';
                res.on('data', (chunk: any) => {
                    if (chunk) data += chunk;
                });
                res.on('end', () => {

                    res.removeAllListeners();
                    resolve(data.length > 0 ? JSON.parse(data) as T : undefined);
                });
            } else {

                reject(new HttpError(res.statusMessage, res.statusCode));

            }

        });

        req.on("end", () => {
            console.log(`request ended...`);
        });
        req.on('error', (e) => {
            req.removeAllListeners();
            reject(e);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();


    });
}

/**
 * Simplified implementation of fetch()
 * @param url 
 */
export const archGet = <T extends object>(url: string | URL, headers?: { [key: string]: any }) => {
    return makeRequest<T>(url, 'GET', undefined, headers);
}

export const archPatch = <T extends object>(url: string, data?: { [key: string]: unknown }, headers?: { [key: string]: string | number }) => {
    return makeRequest<T>(url, 'PATCH', data, headers);
}

export const archPost = <T extends object>(url: string, data?: { [key: string]: unknown }, headers?: { [key: string]: string | number }) => {
    return makeRequest<T>(url, 'POST', data, headers);
}