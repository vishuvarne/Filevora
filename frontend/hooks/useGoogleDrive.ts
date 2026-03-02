import { useState, useCallback, useRef } from 'react';

// Use a type definition for the Google Picker API
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

interface GoogleDriveConfig {
    clientId: string;
    apiKey: string;
    appId?: string;
}

export function useGoogleDrivePicker({ clientId, apiKey, appId }: GoogleDriveConfig) {
    const [isLoaded, setIsLoaded] = useState(false);
    const pickerRef = useRef<any>(null);

    const loadScriptPromise = useRef<Promise<void> | null>(null);

    const loadGapi = useCallback((): Promise<void> => {
        if (loadScriptPromise.current) return loadScriptPromise.current;

        loadScriptPromise.current = new Promise((resolve) => {
            if (window.gapi && window.google?.picker) {
                setIsLoaded(true);
                resolve(undefined);
                return;
            }

            const script = document.createElement("script");
            script.src = "https://apis.google.com/js/api.js";
            script.onload = () => {
                window.gapi.load('picker', () => {
                    setIsLoaded(true);
                    resolve(undefined);
                });
            };
            document.body.appendChild(script);
        });

        return loadScriptPromise.current;
    }, []);

    const closeCustomButton = () => {
        const btn = document.getElementById('google-picker-close-btn');
        if (btn) btn.remove();
        const backdrop = document.getElementById('google-picker-backdrop-click');
        if (backdrop) backdrop.remove();
    };

    const cancelGooglePicker = useCallback(() => {
        if (pickerRef.current) {
            pickerRef.current.setVisible(false);
        }
        closeCustomButton();
    }, []);

    const openPicker = useCallback(async (): Promise<any> => {
        // Ensure GAPI is loaded first
        await loadGapi();

        return new Promise((resolve, reject) => {
            if (!window.google?.picker) {
                reject(new Error("Google Picker API failed to load. Please check your connection."));
                return;
            }

            try {
                const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
                view.setMimeTypes('application/pdf,image/png,image/jpeg');

                const pickerBuilder = new window.google.picker.PickerBuilder()
                    // NO HIDDEN NAV
                    .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                    .setAppId(appId || "")
                    .addView(view)
                    .setDeveloperKey(apiKey)
                    .setCallback((data: any) => {
                        if (data.action === window.google.picker.Action.PICKED) {
                            closeCustomButton();
                            resolve(data.docs);
                        } else if (data.action === window.google.picker.Action.CANCEL) {
                            closeCustomButton();
                            reject("Cancelled");
                        }
                    });

                pickerRef.current = pickerBuilder.build();

                // Save scroll
                const scrollY = window.scrollY;
                const scrollX = window.scrollX;

                pickerRef.current.setVisible(true);

                // MANUAL INJECTION - FORCE VISIBLE
                // Custom Close Button
                const btn = document.createElement('div');
                btn.id = 'google-picker-close-btn';
                btn.innerHTML = `<button style="background:white; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.3); border:1px solid #ddd; cursor:pointer;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5f6368" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                </button>`;
                btn.style.position = 'fixed';
                btn.style.top = '20px';
                btn.style.right = '20px';
                btn.style.zIndex = '2147483647';
                btn.onclick = (e) => {
                    e.stopPropagation();
                    cancelGooglePicker();
                };
                document.body.appendChild(btn);

                // Invisible Backdrop Click Catcher
                const bg = document.createElement('div');
                bg.id = 'google-picker-backdrop-click';
                bg.style.position = 'fixed';
                bg.style.inset = '0';
                bg.style.zIndex = '2147483646'; // Below button, above everything else
                bg.style.pointerEvents = 'none'; // START NON-BLOCKING to let picker work
                // But wait, if pointer-events is none, it can't catch clicks.
                // We want to catch clicks OUTSIDE the picker box.
                // The picker box is centered.
                // It's safer to just rely on the Close Button for now to avoid blocking the picker itself.
                // document.body.appendChild(bg); // Skipping backdrop for now to ensure button works

                // Restore scroll
                setTimeout(() => window.scrollTo(scrollX, scrollY), 100);

            } catch (err: any) {
                console.error("Picker error:", err);
                closeCustomButton();
                reject(new Error("Failed to open Google Picker: " + err.message));
            }
        });
    }, [apiKey, appId, isLoaded]);

    return { openPicker, isLoaded, cancelGooglePicker, isPickerOpen: false };
}
