"use client";

import { useState, useEffect } from "react";

interface TypewriterEffectProps {
    words: string[];
    staticText?: string;
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseTime?: number;
    className?: string; // Class for the wrapper
    cursorClassName?: string; // Class for the cursor
    textClassName?: string; // Class for the text itself
}

export default function TypewriterEffect({
    words,
    staticText = "",
    typingSpeed = 75,
    deletingSpeed = 30,
    pauseTime = 1500,
    className = "",
    cursorClassName = "",
    textClassName = "text-primary"
}: TypewriterEffectProps) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const word = words[currentWordIndex];

        let timer: NodeJS.Timeout;

        if (isDeleting) {
            timer = setTimeout(() => {
                setCurrentText(word.substring(0, currentText.length - 1));
            }, deletingSpeed);
        } else {
            timer = setTimeout(() => {
                setCurrentText(word.substring(0, currentText.length + 1));
            }, typingSpeed);
        }

        if (!isDeleting && currentText === word) {
            timer = setTimeout(() => setIsDeleting(true), pauseTime);
        } else if (isDeleting && currentText === "") {
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }

        return () => clearTimeout(timer);
    }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseTime]);

    // Only blink when waiting (paused) or empty, not while actively typing/deleting
    const isBlinking = (!isDeleting && currentText === words[currentWordIndex]) || (currentText === "" && !isDeleting);

    return (
        <span className={`${className} inline-flex items-center`}>
            {staticText && <span className="mr-2">{staticText}</span>}
            <span className={textClassName}>
                {currentText}
                {/* Cursor hidden on mobile, visible on desktop */}
                <span className={`hidden sm:inline-block w-[2px] h-[1em] bg-current ml-0.5 align-text-bottom ${isBlinking ? "animate-pulse" : "opacity-100"} ${cursorClassName}`}></span>
            </span>
        </span>
    );
}
