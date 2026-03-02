import { useState, useCallback, useRef } from 'react';

declare global {
    interface Window {
        OneDrive: any;
    }
}

interface OneDriveConfig {
    clientId: string;
}

export function useOneDrivePicker({ clientId }: OneDriveConfig) {
    const [isLoaded, setIsLoaded] = useState(false);
    const loadPromise = useRef<Promise<void> | null>(null);

    const loadScript = useCallback((): Promise<void> => {
        if (loadPromise.current) return loadPromise.current;

        loadPromise.current = new Promise((resolve) => {
            if (window.OneDrive) {
                setIsLoaded(true);
                resolve(undefined);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://js.live.net/v7.2/OneDrive.js";
            script.onload = () => {
                setIsLoaded(true);
                resolve(undefined);
            };
            document.body.appendChild(script);
        });

        return loadPromise.current;
    }, []);

    const openPicker = useCallback(async (): Promise<any> => {
        await loadScript();

        return new Promise((resolve, reject) => {
            if (!window.OneDrive) {
                reject(new Error("OneDrive SDK failed to load."));
                return;
            }

            var odOptions = {
                clientId: clientId,
                action: "download",
                multiSelect: false,
                openInNewWindow: true,
                success: (files: any) => {
                    resolve(files.value[0]);
                },
                cancel: () => reject("Cancelled"),
                error: (e: any) => reject(e)
            };

            window.OneDrive.open(odOptions);
        });
    }, [clientId, loadScript]);

    return { openPicker, isLoaded, loadScript };
}
