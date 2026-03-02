"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type DesignStyle = "classic" | "neubrutalist";

interface ThemeStyleContextType {
    designStyle: DesignStyle;
    setDesignStyle: (style: DesignStyle) => void;
    isNeu: boolean;
}

const ThemeStyleContext = createContext<ThemeStyleContextType>({
    designStyle: "neubrutalist",
    setDesignStyle: () => { },
    isNeu: true,
});

export function ThemeStyleProvider({ children }: { children: ReactNode }) {
    const [designStyle, setDesignStyleState] = useState<DesignStyle>("neubrutalist");

    useEffect(() => {
        const saved = localStorage.getItem("design-style") as DesignStyle | null;
        if (saved === "classic") {
            setDesignStyleState("classic");
            document.documentElement.removeAttribute("data-design");
        } else {
            setDesignStyleState("neubrutalist");
            document.documentElement.setAttribute("data-design", "neubrutalist");
        }
    }, []);

    const setDesignStyle = (style: DesignStyle) => {
        setDesignStyleState(style);
        localStorage.setItem("design-style", style);
        if (style === "neubrutalist") {
            document.documentElement.setAttribute("data-design", "neubrutalist");
        } else {
            document.documentElement.removeAttribute("data-design");
        }
    };

    return (
        <ThemeStyleContext.Provider value={{ designStyle, setDesignStyle, isNeu: designStyle === "neubrutalist" }}>
            {children}
        </ThemeStyleContext.Provider>
    );
}

export const useDesignStyle = () => useContext(ThemeStyleContext);
