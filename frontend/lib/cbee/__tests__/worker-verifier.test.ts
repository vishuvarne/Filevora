/**
 * Worker Capability Verifier Tests
 * 
 * Tests for TypeScript-based capability enforcement in workers
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { verifyFileRead, verifyFileWrite, verifyCpuExecute, verifyMemoryAllocate } from '../worker-capability-verifier';
import { capabilityTokenIssuer } from '../capability-token';
import { CapabilityType, CapabilityBundle } from '../capability-types';

describe('Worker Capability Verifier', () => {
    let validBundle: CapabilityBundle;

    beforeAll(async () => {
        await capabilityTokenIssuer.initialize();

        // Create a valid bundle for testing
        validBundle = await capabilityTokenIssuer.issueBundle(
            'test-tool',
            [
                {
                    capability: CapabilityType.FILE_READ,
                    resource: { type: 'file', pattern: 'test.pdf' },
                    constraints: { max_bytes: 10 * 1024 * 1024 } // 10MB
                },
                {
                    capability: CapabilityType.FILE_WRITE,
                    resource: { type: 'file', pattern: '/output/*' },
                    constraints: { max_bytes: 50 * 1024 * 1024, max_files: 1 }
                },
                {
                    capability: CapabilityType.CPU_EXECUTE,
                    resource: { type: 'cpu', pattern: '*' },
                    constraints: { max_instructions: 10_000_000 }
                },
                {
                    capability: CapabilityType.MEMORY_ALLOCATE,
                    resource: { type: 'memory', pattern: '*' },
                    constraints: { max_bytes: 256 * 1024 * 1024 } // 256MB
                }
            ]
        );
    });

    describe('File Read Verification', () => {
        it('should allow reading file within size limit', () => {
            const result = verifyFileRead(validBundle, 'test.pdf', 5 * 1024 * 1024); // 5MB
            expect(result.allowed).toBe(true);
        });

        it('should deny reading file exceeding size limit', () => {
            const result = verifyFileRead(validBundle, 'test.pdf', 20 * 1024 * 1024); // 20MB
            expect(result.allowed).toBe(false);
            expect(result.violation).toContain('Size constraint exceeded');
        });

        it('should deny reading file not in capability', () => {
            const result = verifyFileRead(validBundle, 'unauthorized.pdf', 1024);
            expect(result.allowed).toBe(false);
            expect(result.violation).toContain('Missing capability');
        });
    });

    describe('File Write Verification', () => {
        it('should allow writing to output with wildcard pattern', () => {
            const result = verifyFileWrite(validBundle, '/output/result.pdf', 10 * 1024 * 1024);
            expect(result.allowed).toBe(true);
        });

        it('should deny writing outside allowed pattern', () => {
            const result = verifyFileWrite(validBundle, '/etc/passwd', 1024);
            expect(result.allowed).toBe(false);
            expect(result.violation).toContain('Missing capability');
        });

        it('should deny writing file exceeding size limit', () => {
            const result = verifyFileWrite(validBundle, '/output/huge.pdf', 100 * 1024 * 1024);
            expect(result.allowed).toBe(false);
            expect(result.violation).toContain('Size constraint exceeded');
        });
    });

    describe('CPU Execution Verification', () => {
        it('should allow CPU execution with valid bundle', () => {
            const result = verifyCpuExecute(validBundle);
            expect(result.allowed).toBe(true);
        });

        it('should allow CPU execution in legacy mode (no bundle)', () => {
            const result = verifyCpuExecute(undefined);
            expect(result.allowed).toBe(true);
        });
    });

    describe('Memory Allocation Verification', () => {
        it('should allow memory allocation within limit', () => {
            const result = verifyMemoryAllocate(validBundle, 128 * 1024 * 1024); // 128MB
            expect(result.allowed).toBe(true);
        });

        it('should deny memory allocation exceeding limit', () => {
            const result = verifyMemoryAllocate(validBundle, 512 * 1024 * 1024); // 512MB
            expect(result.allowed).toBe(false);
            expect(result.violation).toContain('Size constraint exceeded');
        });
    });

    describe('Bundle Expiration', () => {
        it('should deny all operations with expired bundle', async () => {
            const expiredBundle = await capabilityTokenIssuer.issueBundle(
                'test-tool',
                [
                    {
                        capability: CapabilityType.FILE_READ,
                        resource: { type: 'file', pattern: 'test.pdf' },
                        constraints: {}
                    }
                ],
                -1 // Already expired
            );

            const result = verifyFileRead(expiredBundle, 'test.pdf', 1024);
            expect(result.allowed).toBe(false);
            expect(result.violation).toContain('expired');
        });
    });

    describe('Pattern Matching', () => {
        it('should match wildcard patterns', async () => {
            const wildcardBundle = await capabilityTokenIssuer.issueBundle(
                'test-tool',
                [
                    {
                        capability: CapabilityType.FILE_WRITE,
                        resource: { type: 'file', pattern: '/output/*.pdf' },
                        constraints: {}
                    }
                ]
            );

            const result1 = verifyFileWrite(wildcardBundle, '/output/file1.pdf', 1024);
            expect(result1.allowed).toBe(true);

            const result2 = verifyFileWrite(wildcardBundle, '/output/file2.pdf', 1024);
            expect(result2.allowed).toBe(true);

            const result3 = verifyFileWrite(wildcardBundle, '/output/file.txt', 1024);
            expect(result3.allowed).toBe(false);
        });

        it('should match exact file names', () => {
            const result = verifyFileRead(validBundle, 'test.pdf', 1024);
            expect(result.allowed).toBe(true);
        });
    });
});
