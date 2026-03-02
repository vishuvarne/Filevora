"use client";

import { useSharedPathname } from "@/lib/navigation";

export default function FooterWrapper({ children }: { children: React.ReactNode }) {
    const pathname = useSharedPathname();
    const isToolPage = pathname?.startsWith("/tools/");

    if (isToolPage) {
        return null;
    }

    return <>{children}</>;
}
