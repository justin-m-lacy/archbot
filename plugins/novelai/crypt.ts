import blake2b from 'blake2b';
import argon2 from 'argon2';
import { openSecretBox, secretBox } from '@stablelib/nacl';
import { getCiphers, getHashes } from 'crypto';
import {inflate, deflate} from 'zlib';
import { promisify } from 'util'

/// Base 2 logarithm
const MAX_WBITS = 15;

console.dir(getCiphers(),'ciphers');
console.dir(getHashes(),'hashes');

const argonHash = async (email:string, password:string, domain:string, size:number )=>{

    const presalt = `${password.slice(0,6)}${email}${domain}`;

    const salt = blake2b(16).update(Buffer.from(presalt)).digest();

    const raw = await argon2.hash(Buffer.from(password), {
       
        salt:Buffer.from(salt),
        timeCost:2,
        memoryCost:Math.floor(2000000 /1024),
        parallelism:1,
        hashLength:size,
        raw:true

    });

    return  raw.toString('base64url').slice(0,size);

}

export async function getAccessKey(user: string, password: string) {
    return argonHash(user, password, 'novelai_data_access_key', 64);
}

export async function getEncryptionKey(user: string, password: string) {

    const prekey = (await argonHash(user, password, 'novelai_data_encryption_key', 128)).replace('=', '');

    const blake = blake2b(32).update( Buffer.from(prekey) ).digest();

    return blake;

}

const compressionPrefix = Buffer.from( "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01" );

const NONCE_SIZE = 24;

export async function decryptData( data:Uint8Array, key:Uint8Array, nonce?:Uint8Array ) {

    const compressed = startsWith(data, compressionPrefix);

    if ( compressed) {
        data = data.slice(compressionPrefix.length);
    }

    if ( nonce == null ) {
        nonce = data.slice(0,NONCE_SIZE);
        data = data.slice(NONCE_SIZE);
    }

    try {

        let result = openSecretBox( key, nonce, data );

        if ( compressed && result ){
            result = await promisify( inflate )(result);
        }
        return result?.toString() ?? '';

    } catch (e){
        console.log(`decrypt error: ${e}`);
    }

}

export async function encryptData( data:Uint8Array, key:Uint8Array, nonce:Uint8Array, compressed:boolean ) {

    try {

        let result = data;
        if (compressed){
            result = await promisify(deflate)(data);
        }

        result = secretBox(key, nonce, result );

        if ( compressed){
            const out = Buffer.alloc( compressionPrefix.length + result.length, compressionPrefix );
            out.fill(result, compressionPrefix.length);

            return Uint8Array.from(out);
        } else {
            return result;
        }

    } catch (e){
        console.log(`encrypt error: ${e}`);
    }
}

function startsWith( data:Uint8Array, values:Uint8Array){

    const len = values.length;
    if ( data.length < len ) return false;

    for( let i =0; i < len; i++){
        if ( data[i]!== values[i])return false;
    }
    return true;

}