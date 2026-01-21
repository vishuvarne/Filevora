
interface ProgressBarProps {
    progress: number;
    className?: string;
}

export default function ProgressBar({ progress, className }: ProgressBarProps) {
    return (
        <div className="w-full bg-secondary/50 rounded-full h-3 mt-6 overflow-hidden relative shadow-inner">
            <div
                className={`${className || "bg-gradient-to-r from-blue-500 to-purple-600"} h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden`}
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-shimmer"></div>
            </div>
        </div>
    );
}
