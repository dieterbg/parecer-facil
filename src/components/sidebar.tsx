"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, User, LogOut, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Novo Parecer",
        href: "/novo",
        icon: PlusCircle,
    },
    {
        title: "Meu Perfil",
        href: "/perfil",
        icon: User,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <div className="flex flex-col h-full w-64 bg-card/50 backdrop-blur-xl border-r border-border/50 fixed left-0 top-0 z-40">
            <div className="p-6 flex items-center gap-3 border-b border-border/50">
                <img src="/logo.png" alt="Parecer Fácil" className="w-14 h-14 object-contain" />
                <span className="font-bold text-xl tracking-tight">Parecer Fácil</span>
            </div>

            <div className="flex-1 py-6 px-4 space-y-2">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}>
                                <item.icon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                                <span className="font-medium">{item.title}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]" />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-border/50">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => signOut()}
                >
                    <LogOut className="w-5 h-5" />
                    Sair
                </Button>
            </div>
        </div>
    );
}
