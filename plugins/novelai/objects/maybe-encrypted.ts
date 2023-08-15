import { NotDecryptedError } from '../novelai-types';
import { EncryptedData } from '../novelai-types';


export interface ICrypt<T> {
    decrypt: (encrypted: EncryptedData) => Promise<T | undefined>,
    encrypt: (data: T) => Promise<EncryptedData>
}

export class MaybeEncrypted<T extends object> {

    private encrypted: string | undefined = undefined;

    private data: T | undefined = undefined;

    /// encrypter/decrypter.
    private crypt: ICrypt<T>;

    constructor(data: T | string | undefined | null,
        crypt: ICrypt<T>) {

        this.crypt = crypt;

        if (data && typeof data !== 'string') {

            this.data = data;

        } else {

            this.encrypted = data ?? undefined;
        }

    }

    public async decrypt() {

        if (this.data) return this.data;
        if (this.encrypted == null) return undefined;

        this.data = await this.crypt.decrypt(this.encrypted);

        return this.data;

    }

    public async encrypt() {

        if (this.encrypted) return this.encrypted;
        if (this.data === undefined) return '';

        this.encrypted = await this.crypt.encrypt(this.data);
        return this.encrypted;

    }

    /**
     * Get the currently encrypted data if available.
     */
    public getEncrypted() {
        return this.encrypted;
    }

    /**
     * Set new data.
     * If data is unencrypted, encrypted data is erased.
     * If data is encrypted, unencrypted data is erased.
     * @param data 
     */
    public setData(data: T | string | undefined) {

        if (typeof data === 'string') {
            this.encrypted = data;
            this.data = undefined;
        } else if (data !== undefined && data !== null) {
            this.data = data;
            this.encrypted = undefined;
        } else {
            this.data = undefined;
            this.encrypted = undefined;
        }

    }

    public getData() {
        if (this.data !== undefined) return this.data;
        throw new NotDecryptedError();
    }

    public isDecrypted() {
        return this.data !== undefined;
    }
}