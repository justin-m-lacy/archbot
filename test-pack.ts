import { Packr, addExtension } from "msgpackr";

/// insert packed test text.
const testText = ``;

const extensionIds = [20, 30, 31, 40, 41, 42];

let initialized = false;
let packer: Packr | null = null;

export const testUnpackPack = <T extends object>(input: string) => {

    if (!initialized) initialize();
    const obj = unpackDocument(input);

    const repack = packDocument(obj as T);

    const reunpack = unpackDocument(repack);

    console.dir(reunpack);

    console.log(`same? ${input === repack}`);

}

export const unpackDocument = <T extends object = object>(document: string) => {

    if (!initialized) initialize();

    return packer!.unpack(Buffer.from(document, "base64")) as T;

}

export const packDocument = <T extends object = object>(document: T) => {

    if (!initialized) initialize();

    return packer!.pack(document).toString("base64");

}

testUnpackPack(testText);


function initialize() {

    const extList = extensionIds;

    for (let i = extList.length - 1; i >= 0; i--) {

        addExtension({
            type: extList[i],
            read: function (data) {
                return data;
            },
            /*unpack: (pack) => {
                console.log(`decode: ${pack.toString()}`);
                return pack.toString();
            }*/
        })
    }
    initialized = true;

    packer = new Packr({
        bundleStrings: true,
        moreTypes: true
    });


}