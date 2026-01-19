import { useState, useCallback } from 'react';

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

    const loadScript = useCallback(() => {
        if (window.OneDrive) {
            setIsLoaded(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://js.live.net/v7.2/OneDrive.js";
        script.onload = () => setIsLoaded(true);
        document.body.appendChild(script);
    }, []);

    const openPicker = useCallback((): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!window.OneDrive) {
                loadScript();
                reject("OneDrive SDK not loaded, try again in a moment");
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
