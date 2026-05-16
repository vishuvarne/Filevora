"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { CategorySlug, getToolsByCategory, TOOLS } from "@/config/tools";
import ToolSelector from "@/components/ToolSelector";
import ToolInterface from "@/components/ToolInterface";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ToolLoadingSkeleton from "@/components/ui/ToolLoadingSkeleton";

interface CategoryPageClientProps {
    categorySlug: CategorySlug;
    categoryName: string;
}

function CategoryPageInner({ categorySlug, categoryName }: CategoryPageClientProps) {
    const searchParams = useSearchParams();
    const toolParam = searchParams.get("tool");

    const categoryTools = useMemo(() => getToolsByCategory(categorySlug), [categorySlug]);
    
    // Resolve active tool: from URL param or default to first tool in category
    const activeTool = useMemo(() => {
        if (toolParam) {
            const found = categoryTools.find(t => t.id === toolParam);
            if (found) return found;
        }
        return categoryTools[0];
    }, [toolParam, categoryTools]);

    if (!activeTool) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">No tools found</h1>
                <p className="text-muted-foreground">This category has no available tools.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 pb-20 pt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <Breadcrumbs items={[
                    { label: "Home", href: "/" },
                    { label: categoryName },
                ]} />

                {/* Category Header */}
                <div className="mt-4 mb-6">
                    <h1 className="text-3xl sm:text-4xl font-black text-foreground leading-tight">
                        {categoryName}
                    </h1>
                </div>

                {/* Tool Selector Pills */}
                <ToolSelector
                    tools={categoryTools}
                    activeToolId={activeTool.id}
                    categorySlug={categorySlug}
                />
            </div>

            {/* Tool Interface */}
            <ToolInterface tool={activeTool} key={activeTool.id} />
        </main>
    );
}

export default function CategoryPageClient(props: CategoryPageClientProps) {
    return (
        <Suspense fallback={<ToolLoadingSkeleton />}>
            <CategoryPageInner {...props} />
        </Suspense>
    );
}
