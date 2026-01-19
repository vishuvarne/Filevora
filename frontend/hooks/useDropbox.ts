import { useState, useCallback } from 'react';

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

    const loadScript = useCallback(() => {
        if (document.getElementById('dropboxjs')) {
            setIsLoaded(true);
            return;
        }
        const script = document.createElement("script");
        script.id = "dropboxjs";
        script.src = "https://www.dropbox.com/static/api/2/dropins.js";
        script.dataset.appKey = appKey;
        script.onload = () => setIsLoaded(true);
        document.body.appendChild(script);
    }, [appKey]);

    const openChooser = useCallback((): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!window.Dropbox) {
                loadScript();
                // In a real app we'd wait for load, simple retry for now
                setTimeout(() => {
                    if (!window.Dropbox) reject("Dropbox SDK not loaded");
                }, 1000);
            }

            if (window.Dropbox) {
                window.Dropbox.choose({
                    success: (files: any[]) => {
                        resolve(files[0]); // We typically just want one for now
                    },
                    cancel: () => reject("Cancelled"),
                    linkType: "direct", // Direct download link
                    multiselect: false,
                    extensions: ['.pdf', '.doc', '.docx', '.jpg', '.png'],
                });
            }
        });
    }, [loadScript]);

    return { openChooser, isLoaded, loadScript };
}
