"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

const routeMap: Record<string, string> = {
    "dashboard": "Dashboard",
    "turmas": "Minhas Turmas",
    "alunos": "Alunos",
    "novo": "Novo Parecer",
    "perfil": "Meu Perfil",
    "parecer": "Parecer",
};

export function Breadcrumbs() {
    const pathname = usePathname();

    // Don't show on dashboard or root
    if (pathname === "/" || pathname === "/dashboard") return null;

    const paths = pathname.split("/").filter(Boolean);

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
            <Link
                href="/dashboard"
                className="flex items-center hover:text-foreground transition-colors"
            >
                <Home className="w-4 h-4" />
            </Link>

            {paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                const href = `/${paths.slice(0, index + 1).join("/")}`;

                // Try to map known routes, otherwise format the string or leave as is (for IDs)
                let label = routeMap[path] || path;

                // Simple UUID check to make it look nicer (skip showing full UUIDs in breadcrumb content if possible, or shorten)
                if (path.length > 20 && /\d/.test(path)) {
                    label = "Detalhes";
                }

                return (
                    <Fragment key={path}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                        {isLast ? (
                            <span className="font-medium text-foreground">
                                {label}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-foreground transition-colors capitalize"
                            >
                                {label}
                            </Link>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
