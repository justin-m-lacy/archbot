import blake2b from 'blake2b';
import argon2 from 'argon2';

const domain = 'novelai_data_access_key';

export async function calcAccessKey(user: string, password: string, hash_length:number=64) {


    const presalt = `${password.slice(0,6)}${user}${domain}`;

    const salt = blake2b(16).update(new Uint8Array(Buffer.from(presalt))).digest();

    const raw = await argon2.hash(Buffer.from(password), {
       
        salt:Buffer.from(salt),
        timeCost:2,
        memoryCost:Math.floor(2000000 /1024),
        parallelism:1,
        hashLength:hash_length,
        raw:true

    });

    console.log(`buf len: ${raw.length}`)

    console.log(`RPESLICE: ${raw.toString('base64url')}`);

    const slice = raw.toString('base64url').slice(0,hash_length);
    console.log(`sliced: ${slice}`);

    return  slice;
}
///cU2ulguUZVkq9cu-zDSQqNVe17qaCa3hBxXxxWdzmd47-PvGJYOmXBMEnN4v-1ex
///cU2ulguUZVkq9cu-zDSQqNVe17qaCa3hBxXxxWdzmd47-PvGJYOmXBMEnN4v-1ex