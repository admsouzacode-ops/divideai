"use client";

import Link from "next/link";
import { Receipt, History, Crown, Flame, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { getPreferences } from "@/lib/storage";
import { OnboardingTour } from "@/components/OnboardingTour";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isProLocal, setIsProLocal] = useState(false);

  useEffect(() => {
    setIsProLocal(getPreferences().isPro);
  }, []);

  const isPro = (session?.user as any)?.isPro || isProLocal;

  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-8 safe-bottom">
      <OnboardingTour />

      <div className="w-full max-w-md flex justify-end mb-4">
        {status === "loading" ? null : session?.user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground truncate max-w-[140px]">
              Olá, {session.user.name?.split(" ")[0]}
            </span>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })} className="text-muted-foreground">
              Sair
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mb-10 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="text-4xl">🤝</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">Paga Juntos</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-xs mx-auto">Acabe com a briga na hora de dividir a conta</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Link href="/normal" className="block">
          <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-transparent hover:border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-primary dark:bg-orange-950">
                  <Receipt className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-xl">Dividir Conta</CardTitle>
                  <CardDescription className="text-base">Rápido e simples</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Valor total, gorjeta e divisão igual ou personalizada. Ideal pro dia a dia.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bbq" className="block">
          <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-primary/40 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/40 dark:to-red-950/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-orange-500/30">
                  <Flame className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Modo Churrasco
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-white">TOP</span>
                  </CardTitle>
                  <CardDescription className="text-base">O diferencial do app</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Carne, bebida, extras. Separação de bebedores e quem come o quê. Justo de verdade!</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/sala" className="block">
          <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-amber-400/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                  <Users className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Salas juntas
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">PRO</span>
                  </CardTitle>
                  <CardDescription className="text-base">Ambiente compartilhado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Crie uma sala, mande o código no WhatsApp e todo mundo divide e comenta junto.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-10 flex w-full max-w-md gap-3">
        <Link href="/historico" className="flex-1">
          <Button variant="secondary" className="w-full gap-2" size="lg">
            <History className="h-5 w-5" />Histórico
          </Button>
        </Link>
        {!isPro && (
          <Link href="/pro" className="flex-1">
            <Button variant="outline" className="w-full gap-2 border-amber-400 text-amber-700 dark:text-amber-400" size="lg">
              <Crown className="h-5 w-5" />Pro
            </Button>
          </Link>
        )}
      </div>

      <p className="mt-auto pt-12 text-center text-xs text-muted-foreground">Feito com 🧡 pro Brasil · Paga Juntos</p>
    </main>
  );
}
