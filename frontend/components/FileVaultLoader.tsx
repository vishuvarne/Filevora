"use client";

import dynamic from "next/dynamic";

const FileVault = dynamic(() => import("@/components/FileVault"), { ssr: false });

export default function FileVaultLoader() {
    return <FileVault />;
}
