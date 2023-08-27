import { MaybeEncrypted } from './maybe-encrypted';
import { Keystore } from './../keystore';

/**
 * NovelAI with encrypted data field.
 * @param D - type of Decrypted data.
 */
export class EncryptedObject<
    T extends { id: string, meta: string, data?: string, changeIndex: number },
    D extends object> {

    public readonly id: string;
    public readonly meta: string;

    /**
     * Container for the encrypted data.
     */
    protected container: T;

    protected data: MaybeEncrypted<D>;

    public get isDecrypted() { return this.data.isDecrypted() }

    /**
     * Whether the data should be compressed before encryption.
     */
    private compressed: boolean = false;

    constructor(container: T, keystore: Keystore, data?: D) {

        this.id = container.id;
        this.meta = container.meta;

        this.container = container;

        this.data = new MaybeEncrypted(data ?? container.data, {

            decrypt: async (encrypted: string) => {
                const [decoded, compressed] = await keystore.decrypt<D>(this.meta, encrypted);
                this.compressed = compressed;
                return decoded;
            },
            encrypt: (data) => {
                return keystore.encrypt(this.meta, data, this.compressed);
            }

        });

    }

    setChangeIndex(index: number) {
        this.container.changeIndex = index;
    }

    /**
     * Decrypts story content data if it is encrypted.
     * @param keystore 
     */
    async decrypt() {
        return await this.data.decrypt();
    }

    async encrypt() {

        this.container.data = await this.data.encrypt();
        return this.container;

    }

    async getData() {
        return this.data.decrypt();
    }

    setData(data: D | string) {
        this.data.setData(data);
        if (typeof data === 'string') {
            this.container.data = data;
        }
    }

    setObject(data: T) {

        Object.assign(this.container, data);
        this.data.setData(data.data);

    }

    /**
     * @returns NovelAI data container object.
     */
    getObject() { return this.container }

}