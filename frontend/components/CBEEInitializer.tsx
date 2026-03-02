/**
 * CBEE Initialization Script
 * 
 * Initialize the Capability-Based Execution Engine on app startup
 */

'use client';

import { useEffect } from 'react';
import { initializeCBEE } from '@/lib/cbee';

export default function CBEEInitializer() {
    useEffect(() => {
        // Initialize CBEE on client-side mount
        const init = async () => {
            try {
                await initializeCBEE();
                console.log('[CBEE] ✅ Capability-Based Execution Engine initialized');
            } catch (error) {
                console.error('[CBEE] ❌ Initialization failed:', error);
            }
        };

        init();
    }, []);

    // This component doesn't render anything
    return null;
}
