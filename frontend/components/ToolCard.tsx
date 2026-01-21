
import { ToolDef } from "@/config/tools";
import Link from "next/link";

export default function ToolCard({ tool }: { tool: ToolDef }) {
    return (
        <Link
            href={`/tools/${tool.id}`}
            className="group relative bg-card hover:bg-secondary p-6 rounded-2xl border border-border hover:border-primary/50 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden flex flex-col h-full"
        >
            {/* Ambient Background Glow */}


            <div className="relative z-10 flex-1 flex flex-col">
                <div className={`w-14 h-14 ${tool.theme.bgLight} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-7 h-7 ${tool.theme.text}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                    </svg>
                </div>

                <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">
                    {tool.name}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                    {tool.description}
                </p>
            </div>

            <div className="relative z-10 mt-5 flex items-center text-sm font-semibold text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Try Now
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </div>
        </Link>
    );
}
