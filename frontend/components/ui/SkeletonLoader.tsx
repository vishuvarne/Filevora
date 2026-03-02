export default function SkeletonLoader() {
    return (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm h-full animate-pulse">
            {/* Icon placeholder */}
            <div className="w-14 h-14 bg-muted rounded-2xl mb-5" />

            {/* Title placeholder */}
            <div className="h-5 bg-muted rounded-lg mb-2 w-3/4" />

            {/* Description placeholder */}
            <div className="space-y-2 mb-4">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
            </div>

            {/* File size placeholder */}
            <div className="h-3 bg-muted rounded w-20 mt-3" />

            {/* "Try Now" placeholder */}
            <div className="h-4 bg-muted rounded w-16 mt-5" />
        </div>
    );
}
