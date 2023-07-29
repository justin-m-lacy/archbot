import {decryptData, encryptData, NONCE_SIZE, generateKey } from "./novelai-crypt";
import { randomBytes} from 'crypto';

const KEYSTORE_VERSION = 2;

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

    private _keystore?:EncodedKeystore;

    /**
     * Maps object meta fields to decryption key for object.
     */
    private _keyMap?:KeyStoreMap;

    private _decrypted:boolean = false;

    /// Only relevant if keystore needs to be reencrypted.
    private _compressed:boolean = false;

    constructor(){}

    async descryptStore( keystoreBase64:string, encryptionKey:Uint8Array ){

        try {

            this._keystore = JSON.parse( Buffer.from(keystoreBase64, 'base64url').toString('utf8' )) as EncodedKeystore;
    
            const decoded = await decryptData(
                Uint8Array.from(this._keystore.sdata),
                encryptionKey,
                Uint8Array.from( this._keystore.nonce ) );

            const keystoreKeys = decoded ? (JSON.parse(decoded) as KeyStoreData)?.keys : undefined;
            
            this._keyMap = {};
            if ( keystoreKeys ) {

                for( const key in keystoreKeys) {
                    this._keyMap[key] = new Uint8Array( keystoreKeys[key] );
                }

            }
            this._decrypted=true;

        } catch (e){
            console.log(`error: ${e}`);
        }

    }

    /**
     * Store must be reencrypted so created meta/key pairs can be pushed to server.
     */
    async encryptStore(){
    
        try {

            // Existing keystore should be required for nonce?
            if ( !this._keystore) return;

            return this._keystore;


        } catch(e){
            console.log(`encryptStore error: ${e}`);
        }
    }

    /**
     * Initialize empty keystore.
     */
    initEmpty(){

        this._keystore = {
            nonce: Array.from( randomBytes( NONCE_SIZE) ),
            version:`${KEYSTORE_VERSION}`,
            sdata:[]
        }
        this._keyMap = {
        };

    }

    /**
     * Create a new key for a meta object.
     * @param meta 
     */
    addKey(meta:string, key?:Uint8Array) {

        const newKey = key ?? generateKey();
        if ( this._keyMap){
            this._keyMap[meta] = newKey;
        }

    }

    async encrypt( meta:string, plaintext:string ) {

        if ( !this._decrypted) throw new Error('Keystore not decrypted.');

        const useKey = this._keyMap?.[meta];
        if ( !useKey) throw new Error('Key not found.');

        /// 16 byte nonce needs to be prepended to data?
        /// automatic or not?

        const nonce = randomBytes(NONCE_SIZE);
        const data = await encryptData( new Uint8Array( Buffer.from(plaintext)), useKey, nonce);

        return data ? Buffer.from(data).toString('base64') : '';


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

        const useKey = this._keyMap?.[meta];

        if ( !useKey) {
            console.log(`key not found: meta: ${meta}`);
            return;
        }

        return await decryptData( new Uint8Array( Buffer.from(data, 'base64')), useKey );

    }

}