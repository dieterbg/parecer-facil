"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, LogIn, Sparkles, Mail, Lock, UserPlus, ArrowRight, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const { signInWithPassword, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        alert("Conta criada! Verifique seu e-mail ou faça login.");
        setIsSignUp(false);
      } else {
        await signInWithPassword(email, password);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(error);
      alert("Erro na autenticação. Verifique seus dados.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efeitos de Fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

      <Card className="w-full max-w-md border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto w-48 h-48 flex items-center justify-center mb-4 relative">
            <Image 
              src="/logo.png" 
              alt="Parecer Fácil" 
              fill
              className="object-contain drop-shadow-[0_0_20px_rgba(124,58,237,0.6)]"
              priority
            />
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            Inteligência Artificial para relatórios pedagógicos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Seu Nome Completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 bg-background/50 border-border/50 focus:ring-primary/50 transition-all"
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-border/50 focus:ring-primary/50 transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : isSignUp ? (
                <>Criar Conta <UserPlus className="ml-2 h-5 w-5" /></>
              ) : (
                <>Entrar no Sistema <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              {isSignUp
                ? "Já tem uma conta? Faça login"
                : "Não tem conta? Crie agora gratuitamente"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
