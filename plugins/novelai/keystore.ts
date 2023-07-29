import {decryptData} from "./novelai-crypt";

type EncodedKeystore = {
    version:string;
    nonce:number[];
    sdata:number[];
}

type KeyStoreMap = {
    [key:string]:Uint8Array;
}

type KeyStoreData = {
    keys:{
        [key:string]:number[]
    }
}

export class Keystore {

    /**
     * Maps object meta fields to decryption key for object.
     */
    private _keystore?:KeyStoreMap;

    _decrypted:boolean = false;

    /// Only relevant if keystore needs to be reencrypted.
    _compressed:boolean = false;

    constructor(){
    }

    async descryptStore( keystoreBase64:string, encryptionKey:Uint8Array ){

        try {

            const storeObject = JSON.parse( Buffer.from(keystoreBase64, 'base64url').toString('utf8' )) as EncodedKeystore;

            const decoded = await decryptData(
                Uint8Array.from(storeObject.sdata),
                encryptionKey,
                Uint8Array.from( storeObject.nonce ) );

            const keystoreKeys = decoded ? (JSON.parse(decoded) as KeyStoreData)?.keys : undefined;
            
            this._keystore = {};
            if ( keystoreKeys ) {

                for( const key in keystoreKeys) {
                    this._keystore[key] = new Uint8Array( keystoreKeys[key] );
                }

            }
            this._decrypted=true;

        } catch (e){
            console.log(`error: ${e}`);
        }

    }

    /**
     * Keystore maps object meta to key used to decrypt object data.
     * @param item 
     */
    async decrypt( {meta,data}:{meta:string, data:string}){
    
        if ( !this._decrypted) {
            console.log(`keystore not decrypted.`);
            return;
        }

        const useKey = this._keystore?.[meta];

        if ( !useKey) {
            console.log(`missing key: meta: ${meta}`);
            return;
        }

        console.log(`using key: ${useKey}`);
        const plaintext = await decryptData( new Uint8Array( Buffer.from(data, 'base64')), useKey );

        return plaintext;

    }

}