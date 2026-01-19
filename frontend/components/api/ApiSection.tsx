"use client";

import { useState } from "react";
import { ToolDef } from "@/config/tools";

interface ApiSectionProps {
    category: string;
    tools: ToolDef[];
}

export default function ApiSection({ category, tools }: ApiSectionProps) {
    const [activeTab, setActiveTab] = useState<"curl" | "python">("curl");

    const getCurlSnippet = (tool: ToolDef) => {
        return `curl -X POST "https://api.filevora.com/v1${tool.endpoint}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@/path/to/your/file${tool.acceptedTypes.split(',')[0]}" ${tool.id === 'convert-image' ? '\\\n  -F "target_format=PNG"' : ''}`;
    };

    const getPythonSnippet = (tool: ToolDef) => {
        return `import requests

url = "https://api.filevora.com/v1${tool.endpoint}"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
files = {"file": open("file${tool.acceptedTypes.split(',')[0]}", "rb")}
${tool.id === 'convert-image' ? 'data = {"target_format": "PNG"}\n' : ''}
response = requests.post(url, headers=headers, files=files${tool.id === 'convert-image' ? ', data=data' : ''})
print(response.json())`;
    };

    return (
        <section className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-slate-900">{category} APIs</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Endpoints List */}
                <div className="space-y-4">
                    {tools.map((tool) => (
                        <div key={tool.id} className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${tool.theme.bgLight} ${tool.theme.text} flex items-center justify-center`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d={tool.iconPath} />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-slate-800">{tool.name}</h3>
                                </div>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-wider">POST</span>
                            </div>
                            <code className="block bg-slate-50 px-3 py-2 rounded-lg text-xs text-slate-600 font-mono mb-3 truncate">
                                /v1{tool.endpoint}
                            </code>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4">{tool.description}</p>
                            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Rent this tool API →
                            </button>
                        </div>
                    ))}
                </div>

                {/* Right: Code Generator */}
                <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl lg:sticky lg:top-24 h-fit">
                    <div className="flex border-b border-slate-800">
                        <button
                            onClick={() => setActiveTab("curl")}
                            className={`px-6 py-4 text-xs font-bold transition-all ${activeTab === "curl" ? "text-white border-b-2 border-blue-500 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            cURL
                        </button>
                        <button
                            onClick={() => setActiveTab("python")}
                            className={`px-6 py-4 text-xs font-bold transition-all ${activeTab === "python" ? "text-white border-b-2 border-blue-500 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"}`}
                        >
                            PYTHON
                        </button>
                    </div>
                    <div className="p-6 overflow-x-auto min-h-[300px]">
                        <pre className="text-xs text-blue-300 font-mono leading-relaxed">
                            <code>
                                {activeTab === "curl" ? getCurlSnippet(tools[0]) : getPythonSnippet(tools[0])}
                            </code>
                        </pre>
                    </div>
                    <div className="bg-slate-800/50 p-4 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-medium">Auto-generated for {tools[0].name}</span>
                        <button className="text-[10px] bg-slate-700 text-white px-3 py-1.5 rounded-lg hover:bg-slate-600 font-bold transition-colors">
                            Copy Code
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
