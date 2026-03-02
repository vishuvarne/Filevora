/**
 * Capability Token Tests
 * 
 * Tests for token generation, signing, and verification
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { capabilityTokenIssuer } from '../capability-token';
import { CapabilityType } from '../capability-types';

describe('Capability Token System', () => {
    beforeAll(async () => {
        await capabilityTokenIssuer.initialize();
    });

    it('should generate a valid capability token', async () => {
        const token = await capabilityTokenIssuer.issueToken(
            CapabilityType.FILE_READ,
            {
                type: 'file',
                pattern: 'test.pdf',
                description: 'Test file',
            },
            {
                max_bytes: 1024 * 1024, // 1MB
            },
            'test-exec-123'
        );

        expect(token).toBeDefined();
        expect(token.capability).toBe(CapabilityType.FILE_READ);
        expect(token.signature).toBeTruthy();
        expect(token.nonce).toHaveLength(32); // 16 bytes in hex
        expect(token.expires_at).toBeGreaterThan(Date.now());
    });

    it('should verify a valid token', async () => {
        const token = await capabilityTokenIssuer.issueToken(
            CapabilityType.CPU_EXECUTE,
            {
                type: 'cpu',
                pattern: '*',
            },
            {
                max_instructions: 1_000_000,
            },
            'test-exec-456'
        );

        const isValid = await capabilityTokenIssuer.verifyToken(token);
        expect(isValid).toBe(true);
    });

    it('should reject a forged token (modified signature)', async () => {
        const token = await capabilityTokenIssuer.issueToken(
            CapabilityType.FILE_WRITE,
            {
                type: 'file',
                pattern: '/output/test.pdf',
            },
            {
                max_bytes: 5 * 1024 * 1024,
            },
            'test-exec-789'
        );

        // Forge signature
        const forgedToken = {
            ...token,
            signature: 'deadbeef' + token.signature.substring(8),
        };

        const isValid = await capabilityTokenIssuer.verifyToken(forgedToken);
        expect(isValid).toBe(false);
    });

    it('should reject an expired token', async () => {
        const token = await capabilityTokenIssuer.issueToken(
            CapabilityType.MEMORY_ALLOCATE,
            {
                type: 'memory',
                pattern: '*',
            },
            {
                max_bytes: 256 * 1024 * 1024,
            },
            'test-exec-expired',
            'policy-engine',
            -1000 // Already expired
        );

        const isValid = await capabilityTokenIssuer.verifyToken(token);
        expect(isValid).toBe(false);
    });

    it('should generate unique nonces for each token', async () => {
        const token1 = await capabilityTokenIssuer.issueToken(
            CapabilityType.FILE_READ,
            { type: 'file', pattern: 'file1.pdf' },
            {},
            'exec-1'
        );

        const token2 = await capabilityTokenIssuer.issueToken(
            CapabilityType.FILE_READ,
            { type: 'file', pattern: 'file2.pdf' },
            {},
            'exec-2'
        );

        expect(token1.nonce).not.toBe(token2.nonce);
    });

    it('should create a valid capability bundle', async () => {
        const bundle = await capabilityTokenIssuer.issueBundle(
            'merge-pdf',
            [
                {
                    capability: CapabilityType.FILE_READ,
                    resource: { type: 'file', pattern: 'input1.pdf' },
                    constraints: { max_bytes: 10 * 1024 * 1024 },
                },
                {
                    capability: CapabilityType.FILE_READ,
                    resource: { type: 'file', pattern: 'input2.pdf' },
                    constraints: { max_bytes: 10 * 1024 * 1024 },
                },
                {
                    capability: CapabilityType.FILE_WRITE,
                    resource: { type: 'file', pattern: '/output/merged.pdf' },
                    constraints: { max_files: 1 },
                },
            ]
        );

        expect(bundle.tokens).toHaveLength(3);
        expect(bundle.tool_id).toBe('merge-pdf');
        expect(bundle.bundle_signature).toBeTruthy();
    });

    it('should verify a valid bundle', async () => {
        const bundle = await capabilityTokenIssuer.issueBundle(
            'compress-pdf',
            [
                {
                    capability: CapabilityType.FILE_READ,
                    resource: { type: 'file', pattern: 'input.pdf' },
                    constraints: { max_bytes: 50 * 1024 * 1024 },
                },
                {
                    capability: CapabilityType.CPU_EXECUTE,
                    resource: { type: 'cpu', pattern: '*' },
                    constraints: { max_instructions: 100_000_000 },
                },
            ]
        );

        const isValid = await capabilityTokenIssuer.verifyBundle(bundle);
        expect(isValid).toBe(true);
    });

    it('should reject bundle with modified bundle signature', async () => {
        const bundle = await capabilityTokenIssuer.issueBundle(
            'split-pdf',
            [
                {
                    capability: CapabilityType.FILE_READ,
                    resource: { type: 'file', pattern: 'input.pdf' },
                    constraints: {},
                },
            ]
        );

        const tamperedBundle = {
            ...bundle,
            bundle_signature: 'tampered_signature',
        };

        const isValid = await capabilityTokenIssuer.verifyBundle(tamperedBundle);
        expect(isValid).toBe(false);
    });
});
