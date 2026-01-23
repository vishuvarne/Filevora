"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "filevora_recent_tools";
const MAX_RECENT = 5;

interface RecentTool {
    id: string;
    timestamp: number;
}

export function useRecentTools() {
    const [recentTools, setRecentTools] = useState<string[]>([]);

    // Load recent tools from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: RecentTool[] = JSON.parse(stored);
                // Sort by timestamp (most recent first) and extract IDs
                const toolIds = parsed
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, MAX_RECENT)
                    .map(t => t.id);
                setRecentTools(toolIds);
            }
        } catch (error) {
            console.error("Error loading recent tools:", error);
        }
    }, []);

    // Add a tool to recent history
    const addRecentTool = (toolId: string) => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            let tools: RecentTool[] = stored ? JSON.parse(stored) : [];

            // Remove duplicate if exists
            tools = tools.filter(t => t.id !== toolId);

            // Add new entry at the front
            tools.unshift({
                id: toolId,
                timestamp: Date.now()
            });

            // Keep only MAX_RECENT items
            tools = tools.slice(0, MAX_RECENT);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
            setRecentTools(tools.map(t => t.id));
        } catch (error) {
            console.error("Error adding recent tool:", error);
        }
    };

    // Clear all recent history
    const clearHistory = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setRecentTools([]);
        } catch (error) {
            console.error("Error clearing recent tools:", error);
        }
    };

    // Get recent tool IDs
    const getRecentTools = () => recentTools;

    return {
        recentTools,
        addRecentTool,
        clearHistory,
        getRecentTools
    };
}
