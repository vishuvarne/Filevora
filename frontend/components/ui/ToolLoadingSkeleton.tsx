/**
 * ToolLoadingSkeleton – Loading fallback for dynamically imported tool components.
 * Shown instantly while the JS chunk is being downloaded, eliminating the
 * "blank flash" that makes tool cards feel slow to open.
 */
export default function ToolLoadingSkeleton() {
    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-pulse">
            {/* Title skeleton */}
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-64 mb-6" />

            {/* Content area skeleton */}
            <div className="space-y-4">
                <div className="h-48 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
                <div className="flex gap-4">
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex-1" />
                    <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-32" />
                </div>
                <div className="h-24 bg-slate-100 dark:bg-slate-900 rounded-xl" />
            </div>
        </div>
    );
}
