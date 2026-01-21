"use client";

import { useState, useEffect } from "react";
import convert from 'convert-units';
import { FirestoreService } from "@/lib/firestore-service";
// Type definition since @types/convert-units is not installed/standard for this version export
type Measure = "length" | "mass" | "temperature" | "volume" | "area" | "speed" | "time" | "digital" | "pressure" | "energy" | "frequency";

// Map user friendly names to convert-units keys where possible
// Note: convert-units keys are specific (m, km, cm, mm, etc.)
// We need a mapping to make our UI robust.

const MEASURE_MAP: Record<string, Measure> = {
    "Length": "length",
    "Weight": "mass",
    "Temperature": "temperature",
    "Volume": "volume",
    "Area": "area",
    "Speed": "speed",
    "Time": "time",
    // "Data": "digital"
};

export interface UnitConverterProps {
    initialCategory?: string;
}

export default function UnitConverter({ initialCategory }: UnitConverterProps) {
    // Default to Length if invalid category
    const [category, setCategory] = useState(initialCategory || "Length");
    const [measure, setMeasure] = useState<Measure>("length");

    const [possibilities, setPossibilities] = useState<string[]>([]);
    const [fromUnit, setFromUnit] = useState("");
    const [toUnit, setToUnit] = useState("");

    const [value, setValue] = useState(1);
    const [result, setResult] = useState<number | string>("");

    // Initialize units when category changes
    useEffect(() => {
        let m = MEASURE_MAP[category] || "length";
        setMeasure(m);

        const units = convert().possibilities(m);
        setPossibilities(units);
        setFromUnit(units[0]);
        setToUnit(units[1] || units[0]); // Default to something different if possible

    }, [category]);

    // Calculate result and log to Firestore (debounced)
    useEffect(() => {
        if (!fromUnit || !toUnit) return;
        try {
            const res = convert(value).from(fromUnit as any).to(toUnit as any);
            setResult(typeof res === 'number' ? res.toFixed(4) : res);

            // Log conversion capability
            // In a real app, you'd want to debounce this or only log on explicit content
            // For now, we'll leave it as a comment to show where it would go to avoid write quota usage
            /* 
            FirestoreService.logConversion({
                toolId: "unit-converter",
                status: "success",
                fileName: `${category}: ${fromUnit} -> ${toUnit}`
            });
            */
        } catch (e) {
            setResult("...");
        }
    }, [value, fromUnit, toUnit, measure]);

    return (
        <div className="bg-card rounded-3xl shadow-xl border border-border p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-8">{category} Converter</h2>

            <div className="mb-8">
                <label className="block text-sm font-bold text-muted-foreground mb-2">Select Converter Type</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-border bg-muted/40 text-lg font-medium text-foreground focus:ring-2 focus:ring-primary outline-none"
                >
                    {Object.keys(MEASURE_MAP).map(cat => (
                        <option key={cat} value={cat}>{cat} Converter</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* From */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide">From</label>
                    <div className="flex flex-col gap-2">
                        <input
                            type="number"
                            value={value}
                            onChange={(e) => setValue(parseFloat(e.target.value))}
                            className="w-full text-4xl font-bold p-4 rounded-2xl border border-border bg-background text-foreground focus:border-primary outline-none transition-colors"
                        />
                        <select
                            value={fromUnit}
                            onChange={(e) => setFromUnit(e.target.value)}
                            className="w-full p-3 rounded-xl bg-muted/40 border-none font-medium text-muted-foreground"
                        >
                            {possibilities.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                {/* Swap Icon (Visual) */}
                <div className="hidden md:flex justify-center pt-8 text-muted-foreground/30">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                </div>

                {/* To */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wide">To</label>
                    <div className="flex flex-col gap-2">
                        <div className="w-full text-4xl font-bold p-4 rounded-2xl bg-muted/30 border border-border text-foreground break-all">
                            {result || "..."}
                        </div>
                        <select
                            value={toUnit}
                            onChange={(e) => setToUnit(e.target.value)}
                            className="w-full p-3 rounded-xl bg-muted/40 border-none font-medium text-muted-foreground"
                        >
                            {possibilities.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-12 p-6 bg-muted/30 rounded-2xl border border-border">
                <h4 className="font-bold text-foreground mb-2">Formula</h4>
                <p className="text-muted-foreground font-mono text-sm">
                    {value} {fromUnit} = {result} {toUnit}
                </p>
            </div>
        </div>
    );
}
