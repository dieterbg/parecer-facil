"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FloatingActionButton } from "@/components/ui/floating-action-button";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/";

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-0 lg:ml-64 p-4 lg:p-8 transition-all duration-300">
                <Breadcrumbs />
                {children}
            </main>
            <FloatingActionButton />
        </div>
    );
}


