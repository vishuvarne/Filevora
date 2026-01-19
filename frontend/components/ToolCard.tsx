import { ToolDef } from "@/config/tools";

export default function ToolCard({ tool }: { tool: ToolDef }) {
    return (
        <a href={`/tools/${tool.id}`} className={`group relative bg-white p-6 rounded-2xl shadow-sm border ${tool.theme.border} hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-300 overflow-hidden touch-manipulation cursor-pointer [content-visibility:auto] [contain-intrinsic-size:300px]`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${tool.theme.fromTo} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -mr-4 -mt-4`}></div>

            <div className="relative z-10">
                <div className={`w-12 h-12 ${tool.theme.bgLight} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${tool.theme.text}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                    </svg>
                </div>

                <h3 className={`text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2`}>
                    {tool.name}
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed">
                    {tool.description}
                </p>
            </div>

            <div className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 ${tool.theme.text}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </div>
        </a>
    );
}
