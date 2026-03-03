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
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 25,
                    mass: 0.5
                }}
                className="flex-1 flex flex-col min-h-0 relative"
            >
                {children}
            </m.div>
        </LazyMotion>
    );
}
