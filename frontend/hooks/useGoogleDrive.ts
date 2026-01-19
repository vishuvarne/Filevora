import { useState, useCallback, useEffect } from 'react';

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

    useEffect(() => {
        // Load the Google API script on mount
        const loadGapi = () => {
            if (!window.gapi) {
                const script = document.createElement("script");
                script.src = "https://apis.google.com/js/api.js";
                script.onload = () => {
                    // Once script loads, load the picker library
                    window.gapi.load('picker', () => {
                        setIsLoaded(true);
                    });
                };
                document.body.appendChild(script);
            } else {
                // gapi already exists, just load picker
                window.gapi.load('picker', () => {
                    setIsLoaded(true);
                });
            }
        };

        loadGapi();
    }, []);

    const openPicker = useCallback((): Promise<any> => {
        return new Promise((resolve, reject) => {
            // Check if API is truly ready
            if (!isLoaded || !window.google || !window.google.picker) {
                reject(new Error("Google Picker API is still loading. Please try again in a few seconds."));
                return;
            }

            try {
                const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
                view.setMimeTypes('application/pdf,image/png,image/jpeg');

                const pickerBuilder = new window.google.picker.PickerBuilder()
                    .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
                    .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                    .setAppId(appId || "")
                    .addView(view)
                    .setDeveloperKey(apiKey)
                    .setCallback((data: any) => {
                        if (data.action === window.google.picker.Action.PICKED) {
                            resolve(data.docs);
                        } else if (data.action === window.google.picker.Action.CANCEL) {
                            reject("Cancelled");
                        }
                    });

                const picker = pickerBuilder.build();
                picker.setVisible(true);
            } catch (err: any) {
                console.error("Picker build error:", err);
                reject(new Error("Failed to open Google Picker: " + err.message));
            }
        });
    }, [apiKey, appId, isLoaded]);

    return { openPicker, isLoaded };
}
