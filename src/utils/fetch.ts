import { get, RequestOptions, request} from "https";

/**
 * Simplified implementation of fetch()
 * @param url 
 */
export const archGet = (options: string | RequestOptions | URL): Promise<string> => {

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

    });

}


export const archPost = <T>(url:string, data?:{[key:string]:unknown}, headers?:{[key:string]:string|number})=>{

    return new Promise<T>((resolve,reject)=>{

        const req = request( url, {
            method:'POST',
            headers:headers
        }, (res)=>{

            if (res.statusCode === 200) {

                let data = '';
                res.on('data', (chunk: any) => {
                    data += chunk;
                });
                res.on('end', () => {

                    res.removeAllListeners();
                    resolve( JSON.parse( data ) as T);
                });

            } else {

                reject(res.statusMessage);

            }

        });


        req.on('error',(e)=>{
            req.removeAllListeners();
            reject(e);
        });
    
        req.write(JSON.stringify(data));
        req.end();


    });

}