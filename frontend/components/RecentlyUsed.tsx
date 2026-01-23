"use client";

import { TOOLS } from "@/config/tools";
import { useRecentTools } from "@/hooks/useRecentTools";
import ToolCard from "./ToolCard";

export default function RecentlyUsed() {
    const { recentTools, clearHistory } = useRecentTools();

    // Don't show if no recent tools
    if (recentTools.length === 0) {
        return null;
    }

    // Get tool objects for recent tool IDs
    const recentToolObjects = recentTools
        .map(id => TOOLS.find(tool => tool.id === id))
        .filter(Boolean);

    if (recentToolObjects.length === 0) {
        return null;
    }

    return (
        <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Recently Used</h2>
                    <p className="text-sm text-muted-foreground mt-1">Your last {recentTools.length} tools</p>
                </div>
                <button
                    onClick={clearHistory}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                >
                    Clear History
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recentToolObjects.map((tool) => tool && (
                    <ToolCard key={tool.id} tool={tool} />
                ))}
            </div>
        </section>
    );
}
