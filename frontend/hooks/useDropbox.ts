import { useState, useCallback, useRef } from 'react';

declare global {
    interface Window {
        Dropbox: any;
    }
}

interface DropboxConfig {
    appKey: string;
}

export function useDropboxChooser({ appKey }: DropboxConfig) {
    const [isLoaded, setIsLoaded] = useState(false);

    const loadPromise = useRef<Promise<void> | null>(null);

    const loadScript = useCallback((): Promise<void> => {
        if (loadPromise.current) return loadPromise.current;

        loadPromise.current = new Promise((resolve) => {
            if (window.Dropbox) {
                setIsLoaded(true);
                resolve(undefined);
                return;
            }
            const script = document.createElement("script");
            script.id = "dropboxjs";
            script.src = "https://www.dropbox.com/static/api/2/dropins.js";
            script.dataset.appKey = appKey;
            script.onload = () => {
                setIsLoaded(true);
                resolve(undefined);
            };
            document.body.appendChild(script);
        });

        return loadPromise.current;
    }, [appKey]);

    const openChooser = useCallback(async (): Promise<any> => {
        await loadScript();

        return new Promise((resolve, reject) => {
            if (!window.Dropbox) {
                reject(new Error("Dropbox SDK failed to initialize."));
                return;
            }

            window.Dropbox.choose({
                success: (files: any[]) => {
                    resolve(files[0]); // We typically just want one for now
                },
                cancel: () => reject("Cancelled"),
                linkType: "direct", // Direct download link
                multiselect: false,
                extensions: ['.pdf', '.doc', '.docx', '.jpg', '.png', '.jpeg', '.webp'],
            });
        });
    }, [loadScript]);

    return { openChooser, isLoaded, loadScript };
}
