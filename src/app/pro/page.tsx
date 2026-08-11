"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPreferences, setProStatus } from "@/lib/storage";

const FEATURES = [
  "Sem anúncios",
  "Histórico ilimitado",
  "Exportar resultado (PDF/imagem)",
  "Temas extras",
  "Suporte prioritário",
];

export default function ProPage() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsPro(getPreferences().isPro);
  }, []);

  const handlePurchase = async () => {
    setLoading(true);
    // Mock Mercado Pago integration
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
            Obrigado por apoiar o DivideAí. Aproveite todos os recursos sem limites.
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
        <h1 className="text-2xl font-bold">Virar Pro</h1>
      </div>

      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
            <Crown className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">DivideAí Pro</h2>
          <p className="text-muted-foreground mt-1">
            Apoie o app e desbloqueie tudo
          </p>
        </div>

        <Card className="border-2 border-amber-400/50 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-center">
            <p className="text-white font-bold text-lg">
              Compra única · R$ 12,90
            </p>
            <p className="text-white/90 text-sm">Sem mensalidade</p>
          </div>
          <CardContent className="pt-5 space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check className="h-4 w-4" />
                </div>
                <span className="font-medium">{f}</span>
              </div>
            ))}
          </CardContent>
        </Card>

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
          <br />
          Você pode cancelar a qualquer momento nas configurações do dispositivo.
        </p>
      </div>
    </main>
  );
}
