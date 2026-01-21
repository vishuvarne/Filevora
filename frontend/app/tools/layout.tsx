import ToolsLayoutWrapper from "@/components/ToolsLayoutWrapper";

export default function ToolsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToolsLayoutWrapper>
            {children}
        </ToolsLayoutWrapper>
    );
}
