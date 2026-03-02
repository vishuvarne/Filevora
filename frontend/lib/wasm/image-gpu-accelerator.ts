/**
 * Image GPU Accelerator
 * 
 * Provides hardware-accelerated image operations using WebGPU.
 * Includes automatic performance monitoring and fallback.
 */

// Basic WebGPU types to satisfy the compiler if @webgpu/types is missing
declare global {
    interface Navigator {
        gpu: {
            requestAdapter(options?: any): Promise<any>;
        };
    }
}

type GPUDevice = any;
type GPUAdapter = any;
const GPUBufferUsage = {
    STORAGE: 0x80,
    COPY_SRC: 0x04,
    COPY_DST: 0x08,
    MAP_READ: 0x01
};
const GPUMapMode = {
    READ: 0x01
};

export class ImageGpuAccelerator {
    private device: GPUDevice | null = null;
    private adapter: GPUAdapter | null = null;
    private isSlow: boolean = false;

    /**
     * Initialize WebGPU device.
     * Defer this until actually needed.
     */
    async init(): Promise<boolean> {
        if (this.device) return true;
        if (this.isSlow) return false;

        try {
            if (!navigator.gpu) return false;

            this.adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'high-performance'
            });

            if (!this.adapter) return false;

            this.device = await this.adapter.requestDevice();

            // Monitor for lost device
            this.device.lost.then((info: any) => {
                console.warn(`[WebGPU] Device lost: ${info.message}`);
                this.device = null;
            });

            return true;
        } catch (e) {
            console.error('[WebGPU] Initialization failed:', e);
            return false;
        }
    }

    /**
     * Apply grayscale filter using compute shader.
     */
    async grayscale(input: Uint8Array, width: number, height: number): Promise<Uint8Array | null> {
        return this.runComputeShader(input, width, height, RAW_GRAYSCALE_SHADER);
    }

    /**
     * Adjust brightness using compute shader.
     */
    async adjustBrightness(input: Uint8Array, width: number, height: number, brightness: number): Promise<Uint8Array | null> {
        // brightness is -255 to 255, map to -1.0 to 1.0 (approx)
        const factor = brightness / 255;
        const shader = `
            @group(0) @binding(0) var<storage, read> input : array<u32>;
            @group(0) @binding(1) var<storage, read_write> output : array<u32>;
            @group(0) @binding(2) var<uniform> config : vec4<f32>; // x = brightness factor

            @compute @workgroup_size(64)
            fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
                let idx = global_id.x;
                if (idx >= arrayLength(&input)) { return; }

                let pixel = input[idx];
                let r = f32(pixel & 0xffu);
                let g = f32((pixel >> 8u) & 0xffu);
                let b = f32((pixel >> 16u) & 0xffu);
                let a = (pixel >> 24u) & 0xffu;

                let b_factor = config.x * 255.0;
                
                let new_r = u32(clamp(r + b_factor, 0.0, 255.0));
                let new_g = u32(clamp(g + b_factor, 0.0, 255.0));
                let new_b = u32(clamp(b + b_factor, 0.0, 255.0));

                output[idx] = new_r | (new_g << 8u) | (new_b << 16u) | (a << 24u);
            }
        `;

        // Note: Uniform buffer logic would need to be added to runComputeShader if used.
        // For simplicity in this first version, I'll stick to a unified runner for static shaders.
        // I will implement the uniform logic if I decide to go full GPU for multiple tools.
        return null; // Placeholder for now
    }

    private async runComputeShader(input: Uint8Array, width: number, height: number, shaderCode: string): Promise<Uint8Array | null> {
        if (!await this.init() || !this.device) return null;

        const startTime = performance.now();

        try {
            const module = this.device.createShaderModule({ code: shaderCode });
            const pipeline = this.device.createComputePipeline({
                layout: 'auto',
                compute: { module, entryPoint: 'main' }
            });

            const bufferSize = input.byteLength;
            const inputBuffer = this.device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });
            const outputBuffer = this.device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
            });
            const readBuffer = this.device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
            });

            this.device.queue.writeBuffer(inputBuffer, 0, input);

            const bindGroup = this.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: inputBuffer } },
                    { binding: 1, resource: { buffer: outputBuffer } }
                ]
            });

            const commandEncoder = this.device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.dispatchWorkgroups(Math.ceil(width * height / 64));
            passEncoder.end();

            commandEncoder.copyBufferToBuffer(outputBuffer, 0, readBuffer, 0, bufferSize);
            this.device.queue.submit([commandEncoder.finish()]);

            await readBuffer.mapAsync(GPUMapMode.READ);
            const result = new Uint8Array(readBuffer.getMappedRange().slice(0));
            readBuffer.unmap();

            const duration = performance.now() - startTime;
            this.checkPerformance(duration, width * height);

            return result;
        } catch (e) {
            console.error('[WebGPU] Shader execution failed:', e);
            return null;
        }
    }

    /**
     * Performance monitoring: If GPU is slower than expected, flag it.
     */
    private checkPerformance(durationMs: number, pixelCount: number): void {
        // Simple heuristic: If processing takes > 100ms for < 1MP, it's slow.
        if (pixelCount < 1_000_000 && durationMs > 100) {
            console.warn(`[WebGPU] Slow performance detected: ${durationMs.toFixed(1)}ms for ${pixelCount} pixels.`);
            this.isSlow = true;
            try {
                sessionStorage.setItem('filevora_gpu_slow', 'true');
            } catch { }
        }
    }
}

const RAW_GRAYSCALE_SHADER = `
    @group(0) @binding(0) var<storage, read> input : array<u32>;
    @group(0) @binding(1) var<storage, read_write> output : array<u32>;

    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
        let idx = global_id.x;
        if (idx >= arrayLength(&input)) { return; }

        let pixel = input[idx];
        let r = (pixel & 0xffu);
        let g = ((pixel >> 8u) & 0xffu);
        let b = ((pixel >> 16u) & 0xffu);
        let a = ((pixel >> 24u) & 0xffu);

        // Grayscale formula: 0.299R + 0.587G + 0.114B
        let gray = u32(f32(r) * 0.299 + f32(g) * 0.587 + f32(b) * 0.114);
        
        output[idx] = gray | (gray << 8u) | (gray << 16u) | (a << 24u);
    }
`;

export const gpuAccelerator = new ImageGpuAccelerator();
