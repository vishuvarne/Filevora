interface ProgressBarProps {
    progress: number;
    className?: string;
}

export default function ProgressBar({ progress, className }: ProgressBarProps) {
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4 overflow-hidden">
            <div
                className={`${className || "bg-blue-600"} h-2.5 rounded-full transition-all duration-300 ease-out`}
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            ></div>
        </div>
    );
}
