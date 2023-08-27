import { decryptData, encryptData, NONCE_SIZE, generateKey } from "./novelai-crypt";
import { randomBytes } from 'crypto';

const KEYSTORE_VERSION = 2;

export class KeyNotFoundError extends Error {

    /**
     * meta used to index the key.
     */
    public readonly meta: string | undefined;

    constructor(meta?: string) {
        super();
        this.name = 'KeyNotFoundError';
        this.meta = meta;
    }
}
type EncodedKeystore = {
    version: number;
    nonce: number[];
    /**
     * Encoded KeyStoreData
     */
    sdata: number[];
}

type KeyStoreMap = {
    [key: string]: Uint8Array;
}

type KeyStoreKeys = {
    keys: {
        [key: string]: number[]
    }
}

export class Keystore {

    /**
     * Maps object meta fields to decryption key for object.
     */
    private _keyMap?: KeyStoreMap;

    private _decrypted: boolean = false;

    private _nonce: number[] | null = null;
    private _version: number = KEYSTORE_VERSION;

    /// Only relevant if keystore needs to be reencrypted.
    private _compressed: boolean = false;

    private readonly encryptionKey: Uint8Array;

    private changeIndex: number = 0;

    constructor(encryptionKey: Uint8Array) {
        this.encryptionKey = encryptionKey;
    }

    /**
     * Restore keystore from raw map of keys, nonce, and version.
     * @param keyMap 
     * @param nonce - If nonce is not supplied, a new nonce will be generated
     * @param version 
     */
    restore(keyMap: KeyStoreKeys, nonce: number[] | null, changeIndex: number = 0, version: number = KEYSTORE_VERSION) {

        this._nonce = nonce ?? Array.from(randomBytes(NONCE_SIZE));
        this._version = version;
        this.changeIndex = changeIndex;

        this.buildKeymap(keyMap);

    }

    async decryptStore({ keystore: keystoreBase64, changeIndex }: { keystore: string, changeIndex: number }) {

        this.changeIndex = changeIndex;
        try {

            const encodedStore = JSON.parse(Buffer.from(keystoreBase64, 'base64url').toString('utf8')) as EncodedKeystore;

            this._nonce = encodedStore.nonce;
            this._version = encodedStore.version;

            const [decoded, compressed] = await decryptData(
                Uint8Array.from(encodedStore.sdata),
                this.encryptionKey,
                Uint8Array.from(encodedStore.nonce));

            this._compressed = compressed;

            const keystoreKeys = decoded ? (JSON.parse(decoded) as KeyStoreKeys) : undefined;
            this.buildKeymap(keystoreKeys);


            this._decrypted = true;

        } catch (e) {
            console.log(`error: ${e}`);
        }

    }

    /**
     * Build [meta]->UInt8Array keymap using keyStoreKeys object.
     * @param keysData 
     */
    private buildKeymap(keysData?: KeyStoreKeys) {

        this._keyMap = {};

        const allKeys = keysData?.keys;
        if (allKeys) {

            for (const key in allKeys) {
                this._keyMap[key] = new Uint8Array(allKeys[key]);
            }

        }
    }

    updateKeystore(changeIndex: number) {
        this.changeIndex = changeIndex;
    }

    /**
     * Store must be reencrypted so created meta/key pairs can be pushed to server.
     */
    async encryptStore() {

        try {

            const keymapData = this.keymapToJSON()

            const sdata = await encryptData(
                new Uint8Array(Buffer.from(keymapData)),
                this.encryptionKey,
                Uint8Array.from(this._nonce!));

            //console.log(`encryped sdata: ${sdata?.toString()}`)
            const encoded: EncodedKeystore = {
                version: this._version,
                nonce: this._nonce!,
                sdata: [...sdata!.slice(NONCE_SIZE).values()]
            }

            return {
                keystore: Buffer.from(JSON.stringify(encoded)).toString('base64url'),
                changeIndex: this.changeIndex
            }


        } catch (e) {
            console.log(`encryptStore error: ${e}`);
        }
    }

    /**
     * Convert the current keymap to json string before encoding.
     */
    private keymapToJSON() {

        const newMap: KeyStoreKeys = { keys: {} };

        if (this._keyMap) {
            const keys = newMap.keys;

            for (const entry of Object.entries(this._keyMap)) {
                keys[entry[0]] = [...entry[1].values()];
            }
        }

        return JSON.stringify(newMap);

    }

    /**
     * Initialize empty keystore.
     */
    initEmpty() {

        this._nonce = Array.from(randomBytes(NONCE_SIZE));
        this._version = KEYSTORE_VERSION;

        this.changeIndex = 0;
        this._keyMap = {
        };

    }

    /**
     * Create a new key for a meta object.
     * @param meta 
     */
    addKey(meta: string, key?: Uint8Array) {

        const newKey = key ?? generateKey();
        if (this._keyMap) {
            this._keyMap[meta] = newKey;
        }

    }

    /**
     * @param meta 
     * @param dataObject 
     * @returns encrypted plaintext as base64 encoded string.
     * nonce will be prefixed to encrypted data, along with a compression sequence
     * if data is compressed.
     */
    async encrypt(meta: string, dataObject: any, compressed?: boolean) {

        if (!this._decrypted) throw new Error('Keystore not decrypted.');

        const useKey = this._keyMap?.[meta];
        if (!useKey) throw new KeyNotFoundError(meta);

        /// 16 byte nonce needs to be prepended to data.

        const plaintext = JSON.stringify(dataObject);
        const nonce = randomBytes(NONCE_SIZE);
        const data = await encryptData(
            new Uint8Array(Buffer.from(plaintext)), useKey, nonce, compressed);

        return data ? Buffer.from(data).toString('base64') : '';

    }

    /**
     * Keystore maps object meta to key used to decrypt object data.
     * @param item 
     */
    async decrypt<T = any>(meta: string, data: string, compressed?: boolean): Promise<[T | undefined, boolean]> {

        if (!this._decrypted) {
            console.log(`keystore not decrypted.`);
            return [undefined, compressed ?? false];
        }

        const useKey = this._keyMap?.[meta];

        if (!useKey) throw new KeyNotFoundError(meta);

        const [decoded, compress] = await decryptData(new Uint8Array(Buffer.from(data, 'base64')), useKey, undefined, compressed);
        return [decoded ? JSON.parse(decoded) as T : undefined, compress];

    }

}