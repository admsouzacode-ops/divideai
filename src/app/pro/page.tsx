"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Crown,
  Sparkles,
  Flame,
  Users,
  MessageCircle,
  History,
  Ban,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPreferences, setProStatus } from "@/lib/storage";
import { useSession } from "next-auth/react";

const FEATURES = [
  {
    icon: Flame,
    title: "Modo Churrasco completo",
    desc: "Carne, bebida, extras e quem come o quê — cálculo justo automático.",
  },
  {
    icon: Users,
    title: "Ambiente compartilhado",
    desc: "Crie uma sala, mande o código e todo mundo entra na mesma conta juntos.",
  },
  {
    icon: MessageCircle,
    title: "Comentários em tempo real",
    desc: "“Eu não bebi”, “a picanha foi 1,2kg” — alinhamento sem briga no grupo.",
  },
  {
    icon: History,
    title: "Histórico ilimitado",
    desc: "Todas as suas divisões salvas na sua conta, só você vê.",
  },
  {
    icon: Share2,
    title: "Exportar e compartilhar",
    desc: "Resultado pronto pro WhatsApp e exportação (PDF/imagem).",
  },
  {
    icon: Ban,
    title: "Sem anúncios",
    desc: "Experiência limpa, sem interrupções.",
  },
];

export default function ProPage() {
  const { data: session } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsPro(getPreferences().isPro || Boolean((session?.user as any)?.isPro));
  }, [session]);

  const handlePurchase = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProStatus(true);
    setIsPro(true);
    setLoading(false);
    alert("🎉 Parabéns! Você agora é Pro. Obrigado pelo apoio!");
  };

  if (isPro) {
    return (
      <main className="min-h-dvh px-4 py-6 flex flex-col items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Crown className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">Você é Pro! 🎉</h1>
          <p className="text-muted-foreground">
            Obrigado por apoiar o Paga Juntos. Aproveite salas compartilhadas,
            histórico ilimitado e tudo sem anúncios.
          </p>
          <Link href="/">
            <Button size="lg" className="mt-4">
              Voltar ao app
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-6 safe-bottom">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Paga Juntos Pro</h1>
      </div>

      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
            <Crown className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">Acabe de vez com a briga</h2>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            O Free já divide a conta. O Pro transforma o churrasco em um ambiente
            compartilhado: todos entram, comentam e confirmam quanto cada um deve.
          </p>
        </div>

        <Card className="border-2 border-amber-400/50 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-center">
            <p className="text-white font-bold text-lg">Compra única · R$ 12,90</p>
            <p className="text-white/90 text-sm">Sem mensalidade · para sempre</p>
          </div>
          <CardContent className="pt-5 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    {f.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 px-4 py-3 text-sm text-muted-foreground">
          <strong className="text-foreground">Free vs Pro:</strong> no Free você
          divide sozinho no celular. No Pro, o grupo entra na mesma sala, vê os
          itens e comenta — ideal pro churrasco e festas.
        </div>

        <Button
          size="xl"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/30 gap-2"
          onClick={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            "Processando..."
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Comprar Pro · R$ 12,90
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Pagamento seguro via Mercado Pago (mockado nesta versão).
        </p>
      </div>
    </main>
  );
}
