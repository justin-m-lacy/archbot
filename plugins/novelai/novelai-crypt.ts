import blake2b from 'blake2b';
import argon2 from 'argon2';
import { openSecretBox, secretBox, generateKey } from '@stablelib/nacl';
import { inflate, deflate } from 'fflate';
import { promisify } from 'util'
export { generateKey };


///import { getCiphers, getHashes } from 'crypto';


/// Base 2 logarithm
const MAX_WBITS = 15;

//console.dir(getCiphers(),'ciphers');
//console.dir(getHashes(),'hashes');

const argonHash = async (email: string, password: string, domain: string, size: number) => {

    const presalt = `${password.slice(0, 6)}${email}${domain}`;

    const salt = blake2b(16).update(Buffer.from(presalt)).digest();

    const raw = await argon2.hash(Buffer.from(password), {

        salt: Buffer.from(salt),
        timeCost: 2,
        memoryCost: Math.floor(2000000 / 1024),
        parallelism: 1,
        hashLength: size,
        raw: true

    });

    return raw.toString('base64url');

}

export async function getAccessKey(user: string, password: string) {
    return (await argonHash(user, password, 'novelai_data_access_key', 64)).slice(0, 64);
}

export async function getEncryptionKey(user: string, password: string) {

    const prekey = (await argonHash(user, password, 'novelai_data_encryption_key', 128)).replace('=', '');

    const blake = blake2b(32).update(Buffer.from(prekey)).digest();

    return blake;

}

const compressionPrefix = Buffer.from("\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01");

export const NONCE_SIZE = 24;

/// If no nonce is supplied, it is expected that the first NONCE_SIZE of data is the nonce.
export async function decryptData(data: Uint8Array, key: Uint8Array, nonce?: Uint8Array, compressed?: boolean): Promise<[string | undefined, boolean]> {

    compressed ??= startsWith(data, compressionPrefix);

    if (compressed) {
        data = data.slice(compressionPrefix.length);
    }

    try {

        if (nonce == null) {
            nonce = data.slice(0, NONCE_SIZE);
            data = data.slice(NONCE_SIZE);
        }

        let result = openSecretBox(key, nonce, data);

        if (result) {
            if (compressed) {
                result = await promisify(inflate)(result);
            }
            return [Buffer.from(result).toString('utf8'), compressed];
        }

    } catch (e) {
        console.log(`decrypt error: ${e}`);
    }

    return [undefined, false];

}

export async function encryptData(data: Uint8Array, key: Uint8Array, nonce: Uint8Array, compressed: boolean = false) {

    try {

        let result = data;
        if (compressed) {
            result = await promisify(deflate)(data);
        }

        result = secretBox(key, nonce, result);
        result = addDataPrefix(result, nonce);

        if (compressed) {
            return addDataPrefix(result, compressionPrefix);
        } else {
            return result;
        }

    } catch (e) {
        console.log(`encryptData(): ${e}`);
    }
}

/**
 * Prefix data by the list of prefixes.
 * prefixes[0] comes first in result array, data comes last.
 * @param data 
 * @param prefixes 
 */
const addPrefixes = (data: Uint8Array, prefixes: Uint8Array[]) => {

    const count = prefixes.length;
    let totLength = data.length;
    for (let i = 0; i < count; i++) totLength += prefixes[i].length;

    const out = Buffer.alloc(totLength);
    let pos = 0;
    for (let i = 0; i < count; i++) {
        out.fill(prefixes[i], pos);
        pos += prefixes[i].length;
    }

    return Uint8Array.from(out.fill(data, pos));

}

const addDataPrefix = (data: Uint8Array, prefix: Uint8Array) => {

    const out = Buffer.alloc(prefix.length + data.length, prefix);
    return Uint8Array.from(out.fill(data, prefix.length));
}

const startsWith = (data: Uint8Array, prefix: Uint8Array) => {

    const len = prefix.length;
    if (data.length < len) return false;

    for (let i = 0; i < len; i++) {
        if (data[i] !== prefix[i]) return false;
    }
    return true;

}