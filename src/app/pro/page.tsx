"use client";

import { useState, useEffect, useCallback } from "react";
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
  Calendar,
  Copy,
  CheckCircle2,
  Loader2,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPreferences, setProStatus } from "@/lib/storage";
import { useSession } from "next-auth/react";

const FEATURES = [
  { icon: Flame, title: "Modo Churrasco completo", desc: "Carne, bebida, extras e quem come o quê." },
  { icon: Users, title: "Ambiente compartilhado", desc: "Sala com código para o grupo inteiro." },
  { icon: MessageCircle, title: "Comentários em tempo real", desc: "Alinhamento sem briga no grupo." },
  { icon: History, title: "Histórico ilimitado", desc: "Todas as divisões salvas na sua conta." },
  { icon: Share2, title: "Exportar e compartilhar", desc: "Resultado pronto pro WhatsApp." },
  { icon: Ban, title: "Sem anúncios", desc: "Experiência limpa, sem interrupções." },
];

type PixData = {
  paymentId: string | number;
  qrCode: string;
  qrCodeBase64: string;
  amount: number;
  months: number;
  mock?: boolean;
};

export default function ProPage() {
  const { data: session, update, status: authStatus } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prefs = getPreferences();
    const sessionPro = Boolean((session?.user as any)?.isPro);
    const localPro =
      prefs.isPro &&
      (!prefs.proExpiresAt || new Date(prefs.proExpiresAt) > new Date());
    setIsPro(sessionPro || localPro);
    setExpiresAt(
      (session?.user as any)?.proExpiresAt || prefs.proExpiresAt || null
    );
  }, [session]);

  const activateProLocal = useCallback(
    async (proExpiresAt: string) => {
      setProStatus(true, proExpiresAt);
      setIsPro(true);
      setExpiresAt(proExpiresAt);
      setWaitingPayment(false);
      setPix(null);
      await update?.();
    },
    [update]
  );

  useEffect(() => {
    if (!pix?.paymentId || !waitingPayment) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pro/pix/status?id=${encodeURIComponent(String(pix.paymentId))}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "approved" && data.proExpiresAt) {
          await activateProLocal(data.proExpiresAt);
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pix, waitingPayment, activateProLocal]);

  const handleGeneratePix = async () => {
    if (authStatus !== "authenticated") {
      setError("Faça login para assinar o Pro.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pro/pix", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao gerar PIX");
        return;
      }
      setPix({
        paymentId: data.paymentId,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        amount: data.amount,
        months: data.months,
        mock: data.mock,
      });
      setWaitingPayment(true);
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pix?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = pix.qrCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMockConfirm = async () => {
    if (!pix?.paymentId || !pix.mock) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/pro/pix/status?id=${encodeURIComponent(String(pix.paymentId))}&mock_confirm=1`
      );
      const data = await res.json();
      if (data.status === "approved" && data.proExpiresAt) {
        await activateProLocal(data.proExpiresAt);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return null;
    }
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
            Obrigado por apoiar o Paga Juntos.
          </p>
          {expiresAt && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Válido até {formatDate(expiresAt)}
            </p>
          )}
          <Link href="/">
            <Button size="lg" className="mt-4">Voltar ao app</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (pix) {
    return (
      <main className="min-h-dvh px-4 py-6 safe-bottom">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => {
              setPix(null);
              setWaitingPayment(false);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Pagar com PIX</h1>
        </div>

        <div className="mx-auto max-w-md space-y-5">
          <Card className="border-2 border-orange-200">
            <CardContent className="pt-6 space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-4xl font-bold text-orange-600">
                R$ {pix.amount.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-sm text-muted-foreground">Pro por {pix.months} meses</p>

              {pix.qrCodeBase64 ? (
                <div className="flex justify-center py-2">
                  <img
                    src={`data:image/png;base64,${pix.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-56 h-56 rounded-xl border bg-white p-2"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                  <QrCode className="h-16 w-16" />
                  <p className="text-sm">Use o código copia e cola abaixo</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-left">PIX copia e cola</p>
                <div className="rounded-xl bg-muted p-3 text-left text-xs break-all font-mono max-h-24 overflow-y-auto">
                  {pix.qrCode}
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={handleCopyPix}>
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar código PIX
                    </>
                  )}
                </Button>
              </div>

              {waitingPayment && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando pagamento…
                </div>
              )}

              {pix.mock && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
                  <p className="font-medium">Modo teste (sem token MP)</p>
                  <p className="text-xs">
                    Configure MERCADOPAGO_ACCESS_TOKEN no Dokploy para PIX real.
                  </p>
                  <Button size="sm" className="w-full" onClick={handleMockConfirm} disabled={loading}>
                    {loading ? "Ativando…" : "Simular pagamento aprovado"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Após pagar, a liberação é automática em alguns segundos.
          </p>
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
            O Pro transforma o churrasco em ambiente compartilhado.
          </p>
        </div>

        <Card className="border-2 border-amber-400/50 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-center">
            <p className="text-white font-bold text-lg">R$ 12,90</p>
            <p className="text-white/90 text-sm">a cada 6 meses · pagamento via PIX</p>
          </div>
          <CardContent className="pt-5 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
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

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          size="xl"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/30 gap-2"
          onClick={handleGeneratePix}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Gerando PIX…
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Pagar com PIX · R$ 12,90
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          PIX via Mercado Pago. Pro liberado assim que o pagamento for confirmado.
        </p>
      </div>
    </main>
  );
}
