import React from 'react';

interface RangeSliderProps {
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
    step?: number;
    label?: string;
    unit?: string;
    showValue?: boolean;
    leftLabel?: string;
    rightLabel?: string;
    color?: 'blue' | 'green' | 'purple' | 'pink';
}

export default function RangeSlider({
    min,
    max,
    value,
    onChange,
    step = 1,
    label,
    unit = '',
    showValue = true,
    leftLabel,
    rightLabel,
    color = 'blue'
}: RangeSliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    const colorStyles = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        purple: 'text-purple-600',
        pink: 'text-pink-600'
    }[color];

    return (
        <div className="w-full">
            {/* Label */}
            {label && (
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {label}
                    </label>
                    {showValue && (
                        <span className={`text-sm font-bold ${colorStyles} bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full tabular-nums`}>
                            {value}{unit}
                        </span>
                    )}
                </div>
            )}

            {/* Modern Slider */}
            <div className="relative h-6 flex items-center select-none touch-none">
                {/* Track Background */}
                <div className="absolute w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    {/* Active Track */}
                    <div
                        className={`absolute h-full bg-current ${colorStyles}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {/* Thumb (Input Range) */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={`absolute w-full h-full opacity-0 cursor-pointer z-20`}
                />

                {/* Visible Thumb Handle */}
                <div
                    className={`absolute w-5 h-5 bg-white dark:bg-slate-900 border-[3px] border-current ${colorStyles} rounded-full shadow-lg transition-transform duration-100 ease-out pointer-events-none z-10 hover:scale-110`}
                    style={{ left: `calc(${percentage}% - 10px)` }}
                />
            </div>

            {/* Min/Max Labels */}
            {(leftLabel || rightLabel) && (
                <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wide">
                    <span>{leftLabel}</span>
                    <span>{rightLabel}</span>
                </div>
            )}
        </div>
    );
}
