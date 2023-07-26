import {decryptData} from "./novelai-crypt";

type EncodedKeystore = {
    version:string;
    nonce:string;
    sdata:string;
}

export class Keystore {

    /**
     * Maps object meta fields to decryption key for object.
     */
    private _keystore?:Map<string,Uint8Array>;

    _decrypted:boolean = false;
    _compressed:boolean = false;


    constructor(){
    }

    async descryptStore( keystoreBase64:string, encryptionKey:Uint8Array ){

        try {

            const storeObject = JSON.parse( Buffer.from( keystoreBase64, 'base64' ).toString('ascii') ) as EncodedKeystore;

            console.log(`decrypting store nonce: ${storeObject.nonce}  version: ${storeObject.version}`);

            
            const decoded = await decryptData( ( Buffer.from(storeObject.sdata )), encryptionKey, Buffer.from(storeObject.nonce) );

            this._keystore = decoded ? JSON.parse(decoded) : undefined;

            console.dir(this._keystore, 'KEYSTORE');
            this._decrypted=true;

        } catch (e){
            console.log(`error: ${e}`);
        }

    }

    /**
     * Keystore maps object meta to key used to decrypt object data.
     * @param item 
     */
    async decrypt( item:{meta:string, data:Uint8Array}){

        if ( !this._decrypted) return undefined;

        const useKey = this._keystore?.get(item.meta);

        if ( !useKey) return undefined;

        const data = await decryptData(item.data, useKey );

        return data;

    }

}