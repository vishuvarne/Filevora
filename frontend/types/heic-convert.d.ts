declare module 'heic-convert/browser' {
    interface HeicConvertOptions {
        buffer: ArrayBuffer;
        format: 'JPEG' | 'PNG';
        quality?: number;
    }

    interface HeicConvertAll {
        (options: { buffer: ArrayBuffer; format: 'JPEG' | 'PNG' }): Promise<Array<{
            convert: () => Promise<ArrayBuffer>;
        }>>;
    }

    interface HeicConvert {
        (options: HeicConvertOptions): Promise<ArrayBuffer>;
        all: HeicConvertAll;
    }

    const convert: HeicConvert;
    export default convert;
    export = convert;
}
