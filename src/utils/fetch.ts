import { get, RequestOptions } from "https";

/**
 * Simplified implementation of fetch()
 * @param url 
 */
export const fetch = (options: string | RequestOptions | URL): Promise<string> => {

    return new Promise((resolve, reject) => {

        get(options, (res) => {

            if (res.statusCode === 200) {

                let data = '';
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                res.on('error', (err) => {

                    res.removeAllListeners();
                    reject(err);
                });
                res.on('end', () => {

                    res.removeAllListeners();
                    resolve(data);
                });

            } else {

                reject(res.statusMessage);

            }

        });

    })

}