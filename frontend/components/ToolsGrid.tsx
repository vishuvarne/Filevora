import { TOOLS } from "@/config/tools";
import ToolCard from "@/components/ToolCard";

export default function ToolsGrid() {
    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {TOOLS.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
            ))}
        </section>
    );
}
