"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

export default function RedirectPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Procurando Alice...");

    useEffect(() => {
        async function go() {
            const { data } = await supabase.from("alunos").select("id").ilike("nome", "%Alice%").single();
            if (data) {
                setStatus("Alice encontrada! Redirecionando...");
                router.push(`/alunos/${data.id}`);
            } else {
                setStatus("Alice não encontrada. Tente rodar o seed novamente.");
            }
        }
        go();
    }, [router]);

    return <div className="p-10 font-bold text-xl">{status}</div>;
}
