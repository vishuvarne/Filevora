import Link from "next/link";

interface BreadcrumbsProps {
    items: {
        label: string;
        href?: string;
    }[];
    dark?: boolean;
}

export default function Breadcrumbs({ items, dark }: BreadcrumbsProps) {
    const baseColor = dark ? "text-slate-400" : "text-slate-500";
    const activeColor = dark ? "text-white" : "text-slate-700";
    const hoverColor = dark ? "hover:text-blue-400" : "hover:text-blue-600";
    const separatorColor = dark ? "text-slate-600" : "text-slate-400";

    return (
        <nav className={`flex mb-2 text-sm ${baseColor}`} aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                {items.map((item, index) => (
                    <li key={index} className="inline-flex items-center">
                        {index > 0 && (
                            <svg className={`w-3 h-3 ${separatorColor} mx-1`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                            </svg>
                        )}
                        {item.href ? (
                            <Link href={item.href} className={`inline-flex items-center ${hoverColor} font-medium transition-colors`}>
                                {item.label}
                            </Link>
                        ) : (
                            <span className={`ml-1 font-semibold ${activeColor} md:ml-2`}>
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
