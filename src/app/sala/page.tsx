"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Users, Flame, Receipt, Loader2, LogIn, Crown, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { getPreferences } from "@/lib/storage";

type RoomSummary = {
  id: string; code: string; title: string; mode: string; status: string;
  memberCount: number; commentCount: number; updatedAt: string;
  isOwner: boolean; createdBy: string;
};

export default function SalasPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [title, setTitle] = useState("Churrasco");
  const [mode, setMode] = useState<"BBQ" | "NORMAL">("BBQ");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    setIsPro(getPreferences().isPro || Boolean((session?.user as any)?.isPro));
    loadRooms();
  }, [session]);

  async function loadRooms() {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) setRooms(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, mode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao criar sala"); setCreating(false); return; }
      router.push(`/sala/${data.code}`);
    } catch { setError("Erro ao criar sala"); setCreating(false); }
  }

  async function handleJoin() {
    setError("");
    setJoining(true);
    try {
      const res = await fetch("/api/sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Código inválido"); setJoining(false); return; }
      router.push(`/sala/${data.code}`);
    } catch { setError("Erro ao entrar"); setJoining(false); }
  }

  return (
    <main className="min-h-dvh px-4 py-6 safe-bottom">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Salas juntas</h1>
          <p className="text-sm text-muted-foreground">Ambiente compartilhado</p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" className="h-auto flex-col gap-1 py-4" onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}>
            <Plus className="h-6 w-6" /><span>Criar sala</span>
          </Button>
          <Button size="lg" variant="secondary" className="h-auto flex-col gap-1 py-4" onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}>
            <LogIn className="h-6 w-6" /><span>Entrar com código</span>
          </Button>
        </div>

        {showCreate && (
          <Card className="border-2 border-primary/30">
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label>Nome da sala</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Churrasco do sábado" />
              </div>
              <div className="space-y-2">
                <Label>Modo</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={mode === "BBQ" ? "default" : "outline"} onClick={() => setMode("BBQ")} className="gap-2">
                    <Flame className="h-4 w-4" /> Churrasco
                  </Button>
                  <Button type="button" variant={mode === "NORMAL" ? "default" : "outline"} onClick={() => setMode("NORMAL")} className="gap-2">
                    <Receipt className="h-4 w-4" /> Normal
                  </Button>
                </div>
              </div>
              {!isPro && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Crown className="h-4 w-4 shrink-0" />
                  Criar sala é recurso Pro — no MVP liberamos para testar.
                </p>
              )}
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              <Button className="w-full" size="lg" onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</> : "Criar e entrar"}
              </Button>
            </CardContent>
          </Card>
        )}

        {showJoin && (
          <Card className="border-2 border-primary/30">
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label>Código da sala</Label>
                <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Ex: AB12CD" className="text-center text-xl tracking-widest font-bold uppercase" maxLength={8} />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
              <Button className="w-full" size="lg" onClick={handleJoin} disabled={joining || joinCode.length < 4}>
                {joining ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Entrando...</> : "Entrar na sala"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="pt-2">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Suas salas</h2>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : rooms.length === 0 ? (
            <Card className="py-10">
              <CardContent className="text-center text-muted-foreground space-y-2">
                <Users className="h-10 w-10 mx-auto opacity-40" />
                <p>Nenhuma sala ainda.</p>
                <p className="text-sm">Crie uma ou entre com o código dos amigos.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rooms.map((r) => (
                <Link key={r.id} href={`/sala/${r.code}`} className="block">
                  <Card className="hover:shadow-md transition-shadow active:scale-[0.99]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${r.mode === "BBQ" ? "bg-primary/10 text-primary" : "bg-stone-100 text-stone-600 dark:bg-stone-800"}`}>
                        {r.mode === "BBQ" ? <Flame className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{r.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">{r.code}</span>
                          <span>·</span><Users className="h-3.5 w-3.5" />{r.memberCount}
                          {r.commentCount > 0 && (<><span>·</span><MessageCircle className="h-3.5 w-3.5" />{r.commentCount}</>)}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${r.status === "OPEN" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-stone-100 text-stone-500"}`}>
                        {r.status === "OPEN" ? "Aberta" : "Fechada"}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
