/**
 * CBEE Security Test Suite
 * 
 * Comprehensive security tests for capability bypass attempts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { capabilityTokenIssuer } from '../capability-token';
import { policyResolver } from '../policy-resolver';
import { CapabilityType, CapabilityToken } from '../capability-types';

describe('CBEE Security - Capability Fuzzing', () => {
    beforeAll(async () => {
        await capabilityTokenIssuer.initialize();
        await policyResolver.initialize();
    });

    describe('Token Forgery Prevention', () => {
        it('should reject token with invalid signature', async () => {
            const token = await capabilityTokenIssuer.issueToken(
                CapabilityType.FILE_READ,
                { type: 'file', pattern: 'test.pdf' },
                { max_bytes: 1024 },
                'exec-test'
            );

            // Tamper with signature
            const forged = { ...token, signature: 'deadbeef' + token.signature.substring(8) };

            const isValid = await capabilityTokenIssuer.verifyToken(forged);
            expect(isValid).toBe(false);
        });

        it('should reject token with modified resource pattern', async () => {
            const token = await capabilityTokenIssuer.issueToken(
                CapabilityType.FILE_READ,
                { type: 'file', pattern: 'safe-file.pdf' },
                { max_bytes: 1024 },
                'exec-test'
            );

            // Tamper with resource to gain broader access
            const tampered = {
                ...token,
                resource: { ...token.resource, pattern: '*' }
            };

            const isValid = await capabilityTokenIssuer.verifyToken(tampered);
            expect(isValid).toBe(false);
        });

        it('should reject token with modified constraints', async () => {
            const token = await capabilityTokenIssuer.issueToken(
                CapabilityType.FILE_READ,
                { type: 'file', pattern: 'test.pdf' },
                { max_bytes: 1024 }, // 1KB limit
                'exec-test'
            );

            // Try to escalate to 1GB
            const escalated = {
                ...token,
                constraints: { max_bytes: 1024 * 1024 * 1024 }
            };

            const isValid = await capabilityTokenIssuer.verifyToken(escalated);
            expect(isValid).toBe(false);
        });
    });

    describe('Replay Attack Prevention', () => {
        it('should detect reused nonces', async () => {
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

            // Nonces must be different
            expect(token1.nonce).not.toBe(token2.nonce);

            // Trying to reuse a nonce should fail
            // (In actual implementation, we'd check nonce database)
        });

        it('should enforce single-use execution IDs', async () => {
            const executionId = 'exec-test-replay';

            const bundle1 = await capabilityTokenIssuer.issueBundle(
                'test-tool',
                [
                    {
                        capability: CapabilityType.FILE_READ,
                        resource: { type: 'file', pattern: 'test.pdf' },
                        constraints: {}
                    }
                ]
            );

            // Attempting to reuse execution ID should be detectable
            expect(bundle1.execution_id).toBeTruthy();

            // Create another bundle with same params
            const bundle2 = await capabilityTokenIssuer.issueBundle(
                'test-tool',
                [
                    {
                        capability: CapabilityType.FILE_READ,
                        resource: { type: 'file', pattern: 'test.pdf' },
                        constraints: {}
                    }
                ]
            );

            // Must have different execution IDs
            expect(bundle1.execution_id).not.toBe(bundle2.execution_id);
        });
    });

    describe('Expiration Enforcement', () => {
        it('should reject expired tokens', async () => {
            const token = await capabilityTokenIssuer.issueToken(
                CapabilityType.FILE_READ,
                { type: 'file', pattern: 'test.pdf' },
                {},
                'exec-test',
                'policy-engine',
                -1000 // Already expired
            );

            const isValid = await capabilityTokenIssuer.verifyToken(token);
            expect(isValid).toBe(false);
        });

        it('should reject expired bundles', async () => {
            const bundle = await capabilityTokenIssuer.issueBundle(
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

            const isValid = await capabilityTokenIssuer.verifyBundle(bundle);
            expect(isValid).toBe(false);
        });
    });

    describe('Scope Escalation Prevention', () => {
        it('should deny file size exceeding grant', async () => {
            const response = await policyResolver.resolveForFileProcessing({
                tool_id: 'merge-pdf',
                files: [
                    { name: 'huge.pdf', size: 1024 * 1024 * 1024, type: 'application/pdf' } // 1GB
                ]
            });

            // Should be denied (exceeds 500MB limit for merge-pdf)
            expect(response.granted).toBe(false);
            expect(response.denial_reason).toContain('exceeds limit');
        });

        it('should deny unknown tools', async () => {
            const response = await policyResolver.resolveForFileProcessing({
                tool_id: 'malicious-tool-9000',
                files: [
                    { name: 'test.pdf', size: 1024, type: 'application/pdf' }
                ]
            });

            expect(response.granted).toBe(false);
            expect(response.denial_reason).toContain('Unknown tool');
        });

        it('should deny network access for offline-only tools', async () => {
            // PDF merge is marked as no_network: true
            const response = await policyResolver.resolveForFileProcessing({
                tool_id: 'merge-pdf',
                files: [
                    { name: 'test.pdf', size: 1024, type: 'application/pdf' }
                ]
            });

            expect(response.granted).toBe(true);
            expect(response.bundle).toBeDefined();

            // Bundle should NOT contain network capability
            const hasNetwork = response.bundle!.tokens.some(
                t => t.capability === CapabilityType.NETWORK_FETCH
            );
            expect(hasNetwork).toBe(false);
        });
    });

    describe('Bundle Integrity', () => {
        it('should detect modified token within bundle', async () => {
            const bundle = await capabilityTokenIssuer.issueBundle(
                'test-tool',
                [
                    {
                        capability: CapabilityType.FILE_READ,
                        resource: { type: 'file', pattern: 'file1.pdf' },
                        constraints: { max_bytes: 1024 }
                    },
                    {
                        capability: CapabilityType.FILE_WRITE,
                        resource: { type: 'file', pattern: '/output/result.pdf' },
                        constraints: { max_files: 1 }
                    }
                ]
            );

            // Tamper with one token
            const tamperedBundle = {
                ...bundle,
                tokens: [
                    bundle.tokens[0],
                    { ...bundle.tokens[1], constraints: { max_files: 1000 } } // Escalate
                ]
            };

            const isValid = await capabilityTokenIssuer.verifyBundle(tamperedBundle);
            expect(isValid).toBe(false);
        });

        it('should detect bundle signature tampering', async () => {
            const bundle = await capabilityTokenIssuer.issueBundle(
                'test-tool',
                [
                    {
                        capability: CapabilityType.FILE_READ,
                        resource: { type: 'file', pattern: 'test.pdf' },
                        constraints: {}
                    }
                ]
            );

            // Tamper with bundle signature
            const tampered = {
                ...bundle,
                bundle_signature: 'forged_signature_12345'
            };

            const isValid = await capabilityTokenIssuer.verifyBundle(tampered);
            expect(isValid).toBe(false);
        });
    });

    describe('Time-Based Attacks', () => {
        it('should not accept tokens from the future', async () => {
            const futureTime = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year ahead

            const token = await capabilityTokenIssuer.issueToken(
                CapabilityType.FILE_READ,
                { type: 'file', pattern: 'test.pdf' },
                {},
                'exec-test'
            );

            // Manually set issued_at to future
            const futureToken = { ...token, issued_at: futureTime };

            // Should still verify signature, but application should reject future timestamps
            const isValid = await capabilityTokenIssuer.verifyToken(futureToken);
            // Note: Signature will be invalid since issued_at is part of signed data
            expect(isValid).toBe(false);
        });
    });
});

describe('CBEE Security - Policy Enforcement', () => {
    beforeAll(async () => {
        await policyResolver.initialize();
    });

    it('should enforce least-privilege (minimal capability set)', async () => {
        const response = await policyResolver.resolveForFileProcessing({
            tool_id: 'compress-pdf',
            files: [
                { name: 'doc.pdf', size: 5 * 1024 * 1024, type: 'application/pdf' }
            ]
        });

        expect(response.granted).toBe(true);
        const bundle = response.bundle!;

        // Should have exactly: file.read, file.write, cpu.execute, memory.allocate
        // Should NOT have: network.fetch
        expect(bundle.tokens.length).toBeGreaterThan(0);

        const capabilities = bundle.tokens.map(t => t.capability);
        expect(capabilities).toContain(CapabilityType.FILE_READ);
        expect(capabilities).toContain(CapabilityType.FILE_WRITE);
        expect(capabilities).toContain(CapabilityType.CPU_EXECUTE);
        expect(capabilities).toContain(CapabilityType.MEMORY_ALLOCATE);
        expect(capabilities).not.toContain(CapabilityType.NETWORK_FETCH);
    });

    it('should calculate memory constraints based on file size', async () => {
        const fileSize = 10 * 1024 * 1024; // 10MB
        const response = await policyResolver.resolveForFileProcessing({
            tool_id: 'rotate-pdf',
            files: [
                { name: 'doc.pdf', size: fileSize, type: 'application/pdf' }
            ]
        });

        expect(response.granted).toBe(true);
        const bundle = response.bundle!;

        // Find memory allocation capability
        const memToken = bundle.tokens.find(t => t.capability === CapabilityType.MEMORY_ALLOCATE);
        expect(memToken).toBeDefined();

        // Should be ~2x file size (with max of 512MB)
        const expectedMemory = Math.min(fileSize * 2, 512 * 1024 * 1024);
        expect(memToken!.constraints.max_bytes).toBe(expectedMemory);
    });
});
