"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, History, Trash2, Flame, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";
import type { SplitHistoryItem } from "@/types";

export default function HistoricoPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<SplitHistoryItem[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
        setIsPro(Boolean((session?.user as any)?.isPro));
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  const handleClear = async () => {
    if (!confirm("Tem certeza que deseja limpar todo o seu histórico?")) return;
    await fetch("/api/history", { method: "DELETE" });
    setHistory([]);
  };

  return (
    <main className="min-h-dvh px-4 py-6 safe-bottom">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Histórico</h1>
            <p className="text-sm text-muted-foreground">
              {isPro ? "Ilimitado (Pro)" : "Últimas 5 (Free)"} · só o seu
            </p>
          </div>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-secondary gap-1">
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      <div className="mx-auto max-w-md space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center gap-3">
              <History className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma divisão salva ainda.</p>
              <Link href="/">
                <Button variant="outline">Fazer a primeira divisão</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          history.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    item.mode === "bbq"
                      ? "bg-primary/10 text-primary"
                      : "bg-stone-100 text-stone-600 dark:bg-stone-800"
                  }`}
                >
                  {item.mode === "bbq" ? (
                    <Flame className="h-6 w-6" />
                  ) : (
                    <Receipt className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.peopleCount} {item.peopleCount === 1 ? "pessoa" : "pessoas"} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary">{formatCurrency(item.total)}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.mode === "bbq" ? "Churrasco" : "Normal"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
