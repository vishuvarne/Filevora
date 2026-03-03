"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "convertlocally_favorites";
const MAX_FAVORITES = 10;

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);

    // Load favorites from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: string[] = JSON.parse(stored);
                setFavorites(parsed.slice(0, MAX_FAVORITES));
            }
        } catch (error) {
            console.error("Error loading favorites:", error);
        }
    }, []);

    // Toggle favorite status
    const toggleFavorite = (toolId: string): boolean => {
        try {
            let newFavorites: string[];

            if (favorites.includes(toolId)) {
                // Remove from favorites
                newFavorites = favorites.filter(id => id !== toolId);
            } else {
                // Add to favorites (check limit)
                if (favorites.length >= MAX_FAVORITES) {
                    return false; // Indicate limit reached
                }
                newFavorites = [...favorites, toolId];
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
            setFavorites(newFavorites);
            return true;
        } catch (error) {
            console.error("Error toggling favorite:", error);
            return false;
        }
    };

    // Check if a tool is favorited
    const isFavorite = (toolId: string): boolean => {
        return favorites.includes(toolId);
    };

    // Get all favorites
    const getFavorites = (): string[] => favorites;

    // Get count of favorites
    const getFavoritesCount = (): number => favorites.length;

    // Check if at max capacity
    const isAtMaxCapacity = (): boolean => favorites.length >= MAX_FAVORITES;

    return {
        favorites,
        toggleFavorite,
        isFavorite,
        getFavorites,
        getFavoritesCount,
        isAtMaxCapacity,
        MAX_FAVORITES
    };
}
