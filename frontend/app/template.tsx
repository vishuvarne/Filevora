"use client";

import { m, LazyMotion, domAnimation } from "framer-motion";
import { FEATURES } from "@/config/features";

export default function Template({ children }: { children: React.ReactNode }) {
    if (!FEATURES.ENABLE_ANIMATIONS) {
        return <>{children}</>;
    }

    return (
        <LazyMotion features={domAnimation}>
            <m.div
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 1 }}
                transition={{
                    duration: 0.1,
                    ease: "linear"
                }}
                className="flex-1 flex flex-col min-h-0 relative"
            >
                {children}
            </m.div>
        </LazyMotion>
    );
}
