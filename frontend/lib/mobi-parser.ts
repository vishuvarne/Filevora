
export class MobiParser {
    async parse(file: File): Promise<string> {
        const buffer = await file.arrayBuffer();
        const data = new DataView(buffer);

        // Parse PDB Header to find record count and offsets
        const recordCount = data.getUint16(76);
        const recordOffsets: number[] = [];

        for (let i = 0; i < recordCount; i++) {
            const offset = data.getUint32(78 + (i * 8));
            recordOffsets.push(offset);
        }

        // Read Record 0 (Mobi Header) to find compression type
        const headerOffset = recordOffsets[0];
        const compression = data.getUint16(headerOffset); // 1=No, 2=PalmDoc, 17480=Huffman

        // PalmDoc Header is usually at headerOffset + 16? No, PDB header is first.
        // Actually, let's just iterate records 1..N and try to decompress text.
        // Record 0 is header.

        let text = '';

        for (let i = 1; i < recordCount; i++) {
            const start = recordOffsets[i];
            const end = i < recordCount - 1 ? recordOffsets[i + 1] : buffer.byteLength;

            // Limit check
            if (end > buffer.byteLength) break;

            const chunk = new Uint8Array(buffer, start, end - start);

            // Skip non-text records (images, etc)
            // Usually text records are first, until 0xffffffff gap

            if (compression === 2) {
                text += this.decompressPalmDoc(chunk);
            } else if (compression === 1) {
                text += new TextDecoder().decode(chunk);
            } else {
                // Huffman not supported in this basic parser
                text += "[Huffman compressed content not supported]";
                break;
            }
        }

        return text;
    }

    private decompressPalmDoc(data: Uint8Array): string {
        let output: number[] = [];
        let p = 0;

        while (p < data.length) {
            const byte = data[p++];

            if (byte >= 1 && byte <= 8) {
                // Copy bytes
                for (let i = 0; i < byte; i++) {
                    if (p < data.length) output.push(data[p++]);
                }
            } else if (byte <= 0x7F) {
                // Literal
                output.push(byte);
            } else if (byte >= 0xC0) {
                // Space + Literal
                output.push(0x20);
                output.push(byte ^ 0x80);
            } else {
                // LZ77 pair
                if (p >= data.length) break;
                const next = data[p++];
                const pair = (byte << 8) | next;

                const distance = (pair >> 3) & 0x07FF;
                const length = (pair & 0x0007) + 3;

                let copyStart = output.length - distance;
                for (let i = 0; i < length; i++) {
                    if (copyStart >= 0 && copyStart < output.length) {
                        output.push(output[copyStart++]);
                    } else {
                        output.push(0); // Should not happen in valid file
                    }
                }
            }
        }

        return new TextDecoder().decode(new Uint8Array(output));
    }
}
