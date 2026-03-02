import React, { useState, useEffect } from 'react';

export type PricingTier = 'economy' | 'standard' | 'performance';

interface CostPreviewProps {
    fileSizeMb: number;
    fileType: string;
    onTierChange: (tier: PricingTier) => void;
}

export default function CostPreview({ fileSizeMb, fileType, onTierChange }: CostPreviewProps) {
    const [selectedTier, setSelectedTier] = useState<PricingTier>('standard');

    const RATES = {
        economy: 0.00001,
        standard: 0.00005,
        performance: 0.00020
    };

    const BASE_FEES = {
        economy: 0.00,
        standard: 0.005,
        performance: 0.02
    };

    const calculateCost = (tier: PricingTier) => {
        // Simple client-side estimation matching backend logic roughly
        const isVideo = fileType.includes('video') || fileType.includes('mp4') || fileType.includes('mkv');
        const baseDuration = isVideo ? fileSizeMb * 2.5 : Math.max(1, fileSizeMb * 0.5);

        let speedFactor = 1.0;
        if (tier === 'economy') speedFactor = 1.5;
        if (tier === 'performance') speedFactor = 0.4;

        const duration = baseDuration * speedFactor;
        const total = BASE_FEES[tier] + (duration * RATES[tier]);
        return total.toFixed(4);
    };

    const handleSelect = (tier: PricingTier) => {
        setSelectedTier(tier);
        onTierChange(tier);
    };

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Select Processing Tier
            </h4>

            <div className="grid gap-3">
                {[
                    { id: 'economy', label: 'Economy', desc: 'Slower, lowest cost. Best for non-urgent jobs.', icon: '🐢' },
                    { id: 'standard', label: 'Standard', desc: 'Balanced speed and cost. Recommended.', icon: '🐇' },
                    { id: 'performance', label: 'Performance', desc: 'Maximum speed, dedicated resources.', icon: '🚀' },
                ].map((tier) => (
                    <div
                        key={tier.id}
                        onClick={() => handleSelect(tier.id as PricingTier)}
                        className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${selectedTier === tier.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-500'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{tier.icon}</span>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white capitalize">{tier.label}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{tier.desc}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                ~${calculateCost(tier.id as PricingTier)}
                            </div>
                            <div className="text-[10px] text-slate-400">est. cost</div>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-center text-slate-400 italic">
                *Final cost depends on actual execution time.
            </p>
        </div>
    );
}
