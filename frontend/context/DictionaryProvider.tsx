"use client";

import React, { createContext, useContext } from 'react';

// Define the shape of our dictionary based on our JSON structure
type Dictionary = any; // We can type this more strictly later if needed

const DictionaryContext = createContext<Dictionary | null>(null);

export function DictionaryProvider({
    dictionary,
    children
}: {
    dictionary: Dictionary;
    children: React.ReactNode;
}) {
    return (
        <DictionaryContext.Provider value={dictionary}>
            {children}
        </DictionaryContext.Provider>
    );
}

export function useDictionary() {
    const context = useContext(DictionaryContext);
    if (!context) {
        throw new Error('useDictionary must be used within a DictionaryProvider');
    }
    return context;
}
