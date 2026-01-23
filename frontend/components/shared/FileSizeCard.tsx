"use client";

interface FileSizeCardProps {
    originalSize: number;
    compressedSize?: number;
    showSavings?: boolean;
    className?: string;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function FileSizeCard({
    originalSize,
    compressedSize,
    showSavings = true,
    className = ""
}: FileSizeCardProps) {
    const savedPercentage = compressedSize != null && originalSize > 0
        ? Math.round((1 - compressedSize / originalSize) * 100)
        : null;

    const getSavingsColor = (savings: number) => {
        if (savings >= 30) return "text-green-600";
        if (savings >= 10) return "text-amber-600";
        return "text-red-600";
    };

    const getSavingsBarColor = (savings: number) => {
        if (savings >= 30) return "bg-green-500";
        if (savings >= 10) return "bg-amber-500";
        return "bg-red-500";
    };

    return (
        <div className={`bg-muted/30 rounded-2xl p-4 border border-border space-y-3 ${className}`}>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Original</span>
                    <span className="text-sm font-bold text-foreground">{formatBytes(originalSize)}</span>
                </div>

                {compressedSize != null && (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground font-medium">Compressed</span>
                            <span className="text-sm font-bold text-foreground">{formatBytes(compressedSize)}</span>
                        </div>

                        {showSavings && savedPercentage != null && (
                            <>
                                {/* Savings Bar */}
                                <div className="pt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-muted-foreground">Savings</span>
                                        <span className={`text-xs font-bold ${getSavingsColor(savedPercentage)}`}>
                                            {savedPercentage >= 0 ? `${savedPercentage}%` : `+${-savedPercentage}%`}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${getSavingsBarColor(savedPercentage)}`}
                                            style={{ width: `${Math.min(100, Math.abs(savedPercentage))}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Savings Message */}
                                {savedPercentage >= 30 && (
                                    <p className="text-xs text-green-600 font-medium">Excellent compression! 🎉</p>
                                )}
                                {savedPercentage >= 10 && savedPercentage < 30 && (
                                    <p className="text-xs text-amber-600 font-medium">Good compression 👍</p>
                                )}
                                {savedPercentage < 10 && savedPercentage >= 0 && (
                                    <p className="text-xs text-muted-foreground">Minimal savings</p>
                                )}
                                {savedPercentage < 0 && (
                                    <p className="text-xs text-red-600">File size increased (format change)</p>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
