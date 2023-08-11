import { request } from "https";

export const makeRequest = <T>(url: string | URL, method: string, data?: { [key: string]: unknown }, headers?: { [key: string]: string | number }) => {

    return new Promise<T>((resolve, reject) => {

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
                    resolve(JSON.parse(data) as T);
                });

            } else {

                reject(res.statusMessage);

            }

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
export const archGet = <T = unknown>(url: string | URL, headers?: { [key: string]: any }): Promise<T> => {
    return makeRequest(url, 'GET', undefined, headers);
}

export const archPatch = <T = unknown>(url: string, data?: { [key: string]: unknown }, headers?: { [key: string]: string | number }) => {
    return makeRequest<T>(url, 'PATCH', data, headers);
}

export const archPost = <T>(url: string, data?: { [key: string]: unknown }, headers?: { [key: string]: string | number }) => {
    return makeRequest<T>(url, 'POST', data, headers);
}