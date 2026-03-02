/**
 * Capability Token Issuer & Validator
 * 
 * Generates cryptographically signed, unforgeable capability tokens.
 * Uses Web Crypto API for ECDSA signing (P-256 curve).
 */

import {
    CapabilityToken,
    CapabilityType,
    ResourceIdentifier,
    CapabilityConstraints,
    CapabilityBundle,
} from './capability-types';

/**
 * Token version - increment when schema changes
 */
const CAPABILITY_TOKEN_VERSION = "1.0.0";

/**
 * Default token expiration time (5 minutes)
 */
const DEFAULT_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Signing key pair (cached in memory)
 * In production, this should be rotated periodically
 */
let cachedKeyPair: CryptoKeyPair | null = null;

/**
 * Capability Token Issuer
 * 
 * Generates signed capability tokens with expiration and constraints.
 */
export class CapabilityTokenIssuer {
    private keyPair: CryptoKeyPair | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize the issuer (generates or retrieves signing keys)
     */
    async initialize(): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            if (cachedKeyPair) {
                this.keyPair = cachedKeyPair;
                return;
            }

            console.log('[CBEE] Generating signing keys...');
            // Generate ECDSA key pair using P-256 curve
            this.keyPair = await crypto.subtle.generateKey(
                {
                    name: "ECDSA",
                    namedCurve: "P-256",
                },
                true, // extractable
                ["sign", "verify"]
            );

            cachedKeyPair = this.keyPair;
        })();

        return this.initPromise;
    }

    /**
     * Ensure the issuer is initialized before proceeding
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.keyPair) {
            await this.initialize();
        }
    }

    /**
     * Issue a single capability token
     */
    async issueToken(
        capability: CapabilityType,
        resource: ResourceIdentifier,
        constraints: CapabilityConstraints,
        executionId: string,
        issuedBy: "policy-engine" | "user-consent" | "system" = "policy-engine",
        expirationMs: number = DEFAULT_EXPIRATION_MS
    ): Promise<CapabilityToken> {
        await this.ensureInitialized();

        const now = Date.now();
        const expiresAt = now + expirationMs;

        // Generate cryptographically random nonce
        const nonceArray = new Uint8Array(16);
        crypto.getRandomValues(nonceArray);
        const nonce = Array.from(nonceArray, b => b.toString(16).padStart(2, '0')).join('');

        // Create unsigned token
        const unsignedToken: Omit<CapabilityToken, 'signature'> = {
            version: CAPABILITY_TOKEN_VERSION,
            capability,
            resource,
            constraints,
            issued_by: issuedBy,
            nonce,
            expires_at: expiresAt,
            issued_at: now,
            execution_id: executionId,
        };

        // Sign the token
        const signature = await this.signToken(unsignedToken);

        return {
            ...unsignedToken,
            signature,
        };
    }

    /**
     * Issue a bundle of capability tokens
     */
    async issueBundle(
        toolId: string,
        capabilities: Array<{
            capability: CapabilityType;
            resource: ResourceIdentifier;
            constraints: CapabilityConstraints;
        }>,
        expirationMs: number = DEFAULT_EXPIRATION_MS
    ): Promise<CapabilityBundle> {
        await this.ensureInitialized();

        const executionId = this.generateExecutionId();
        const now = Date.now();
        const expiresAt = now + expirationMs;

        // Issue individual tokens
        const tokens = await Promise.all(
            capabilities.map(({ capability, resource, constraints }) =>
                this.issueToken(capability, resource, constraints, executionId, "policy-engine", expirationMs)
            )
        );

        // Create bundle
        const unsignedBundle = {
            execution_id: executionId,
            tool_id: toolId,
            tokens,
            created_at: now,
            expires_at: expiresAt,
            bundle_signature: "",
        };

        // Sign entire bundle
        const bundleSignature = await this.signBundle(unsignedBundle);

        return {
            ...unsignedBundle,
            bundle_signature: bundleSignature,
        };
    }

    /**
     * Sign a capability token
     */
    private async signToken(token: Omit<CapabilityToken, 'signature'>): Promise<string> {
        if (!this.keyPair) {
            throw new Error("No key pair available");
        }

        // Create canonical representation for signing
        const canonicalData = this.canonicalizeToken(token);
        const encoder = new TextEncoder();
        const data = encoder.encode(canonicalData);

        // Sign using ECDSA
        const signature = await crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            this.keyPair.privateKey,
            data
        );

        // Convert to hex string
        return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Sign a capability bundle
     */
    private async signBundle(bundle: Omit<CapabilityBundle, 'bundle_signature'>): Promise<string> {
        if (!this.keyPair) {
            throw new Error("No key pair available");
        }

        // Create canonical representation
        const canonicalData = JSON.stringify({
            execution_id: bundle.execution_id,
            tool_id: bundle.tool_id,
            token_count: bundle.tokens.length,
            token_signatures: bundle.tokens.map(t => t.signature).sort(),
            created_at: bundle.created_at,
            expires_at: bundle.expires_at,
        });

        const encoder = new TextEncoder();
        const data = encoder.encode(canonicalData);

        const signature = await crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            this.keyPair.privateKey,
            data
        );

        return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Create canonical string representation of token for signing
     * Order matters for signature verification!
     */
    private canonicalizeToken(token: Omit<CapabilityToken, 'signature'>): string {
        return JSON.stringify({
            version: token.version,
            capability: token.capability,
            resource: {
                type: token.resource.type,
                pattern: token.resource.pattern,
            },
            constraints: token.constraints,
            issued_by: token.issued_by,
            nonce: token.nonce,
            expires_at: token.expires_at,
            issued_at: token.issued_at,
            execution_id: token.execution_id,
        });
    }

    /**
     * Generate unique execution ID
     */
    private generateExecutionId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `exec_${timestamp}_${random}`;
    }

    /**
     * Verify token signature
     */
    async verifyToken(token: CapabilityToken): Promise<boolean> {
        if (!this.keyPair) {
            throw new Error("CapabilityTokenIssuer not initialized");
        }

        try {
            // Check expiration first (fast fail)
            if (Date.now() > token.expires_at) {
                return false;
            }

            // Reconstruct canonical data
            const unsignedToken = { ...token, signature: "" };
            const canonicalData = this.canonicalizeToken(unsignedToken);
            const encoder = new TextEncoder();
            const data = encoder.encode(canonicalData);

            // Convert hex signature back to ArrayBuffer
            const signatureArray = new Uint8Array(
                token.signature.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
            );

            // Verify signature
            const valid = await crypto.subtle.verify(
                {
                    name: "ECDSA",
                    hash: { name: "SHA-256" },
                },
                this.keyPair.publicKey,
                signatureArray,
                data
            );

            return valid;
        } catch (error) {
            console.error("Token verification failed:", error);
            return false;
        }
    }

    /**
     * Verify entire bundle
     */
    async verifyBundle(bundle: CapabilityBundle): Promise<boolean> {
        if (!this.keyPair) {
            throw new Error("CapabilityTokenIssuer not initialized");
        }

        try {
            // Check expiration
            if (Date.now() > bundle.expires_at) {
                return false;
            }

            // Verify each token
            const tokenVerifications = await Promise.all(
                bundle.tokens.map(token => this.verifyToken(token))
            );

            if (!tokenVerifications.every(v => v)) {
                return false;
            }

            // Verify bundle signature
            const unsignedBundle = { ...bundle, bundle_signature: "" };
            const canonicalData = JSON.stringify({
                execution_id: unsignedBundle.execution_id,
                tool_id: unsignedBundle.tool_id,
                token_count: unsignedBundle.tokens.length,
                token_signatures: unsignedBundle.tokens.map(t => t.signature).sort(),
                created_at: unsignedBundle.created_at,
                expires_at: unsignedBundle.expires_at,
            });

            const encoder = new TextEncoder();
            const data = encoder.encode(canonicalData);
            const signatureArray = new Uint8Array(
                bundle.bundle_signature.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
            );

            const valid = await crypto.subtle.verify(
                {
                    name: "ECDSA",
                    hash: { name: "SHA-256" },
                },
                this.keyPair.publicKey,
                signatureArray,
                data
            );

            return valid;
        } catch (error) {
            console.error("Bundle verification failed:", error);
            return false;
        }
    }

    /**
     * Export public key (for distribution to verifiers)
     */
    async exportPublicKey(): Promise<JsonWebKey> {
        if (!this.keyPair) {
            throw new Error("CapabilityTokenIssuer not initialized");
        }

        return await crypto.subtle.exportKey("jwk", this.keyPair.publicKey);
    }
}

/**
 * Singleton instance
 */
export const capabilityTokenIssuer = new CapabilityTokenIssuer();
