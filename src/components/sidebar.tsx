"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, LogOut, Users, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth, supabase } from "@/components/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        tourId: undefined,
    },
    {
        title: "Minhas Turmas",
        href: "/turmas",
        icon: Users,
        tourId: "turmas",
    },
    {
        title: "Meu Perfil",
        href: "/perfil",
        icon: User,
        tourId: "perfil",
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");

    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                const { data } = await supabase
                    .from('professores')
                    .select('avatar_url, nome')
                    .eq('uid', user.id)
                    .single();

                if (data) {
                    setAvatarUrl(data.avatar_url);
                    setUserName(data.nome || user.email?.split('@')[0] || "Usuário");
                }
            };
            fetchProfile();
        }
    }, [user]);

    // Fechar sidebar mobile ao navegar
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (isOpen && !target.closest('.sidebar-container') && !target.closest('.sidebar-toggle')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <>
            {/* Botão hamburger - visível apenas em mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="sidebar-toggle fixed top-4 left-4 z-50 p-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 lg:hidden"
                aria-label="Menu"
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <Menu className="w-6 h-6" />
                )}
            </button>

            {/* Backdrop escurecido em mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                data-tour="sidebar"
                className={cn(
                    "sidebar-container flex flex-col h-full w-64 bg-card/50 backdrop-blur-xl border-r border-border/50 fixed left-0 top-0 z-40 transition-transform duration-300",
                    // Em mobile: escondida por padrão, mostra quando isOpen
                    "lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="p-6 flex items-center gap-3 border-b border-border/50">
                    <img src="/teste2.png?v=sidebar2" alt="Floresce.ai" className="w-48 h-auto object-contain mix-blend-multiply dark:mix-blend-screen" />
                </div>

                <div className="flex-1 py-6 px-4 space-y-2">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    data-tour={item.tourId}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
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

                <div className="p-4 border-t border-border/50 space-y-4">
                    {user && (
                        <div className="flex items-center gap-3 px-2">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={avatarUrl || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">{userName}</span>
                                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                            </div>
                        </div>
                    )}
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
        </>
    );
}

