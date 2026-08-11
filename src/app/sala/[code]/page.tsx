"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Copy, Check, Loader2, Users, MessageCircle, Send, Plus, Trash2, Flame, Share2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";

type Person = { id: string; name: string; isDrinker?: boolean };
type BillItem = { id: string; name: string; amount: number; category: "carne" | "bebida" | "extra"; participants: string[] };
type Comment = { id: string; content: string; userId: string; userName: string; createdAt: string };
type Member = { id: string; userId: string; name: string; isDrinker: boolean; amountDue: number | null };
type Room = {
  id: string; code: string; title: string; mode: string; status: string; tipPercent: number;
  data: { people?: Person[]; items?: BillItem[]; tipPercent?: number };
  isOwner: boolean; members: Member[]; comments: Comment[]; updatedAt: string;
};

function calcResults(items: BillItem[], people: Person[], tipPercent: number) {
  const results: Record<string, number> = {};
  people.forEach((p) => (results[p.id] = 0));
  for (const item of items) {
    const parts = item.participants.filter((id) => people.some((p) => p.id === id));
    if (parts.length === 0 || item.amount <= 0) continue;
    const share = item.amount / parts.length;
    parts.forEach((id) => { results[id] = (results[id] || 0) + share; });
  }
  const subtotal = Object.values(results).reduce((a, b) => a + b, 0);
  const tip = subtotal * (tipPercent / 100);
  if (subtotal > 0 && tip > 0) {
    for (const id of Object.keys(results)) {
      results[id] = results[id] + (results[id] / subtotal) * tip;
    }
  }
  return { results, total: subtotal + tip };
}

export default function SalaRoomPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();
  const { data: session } = useSession();
  const myId = (session?.user as any)?.id as string | undefined;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [itemCat, setItemCat] = useState<"carne" | "bebida" | "extra">("carne");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${code}`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Erro ao carregar sala");
        setRoom(null);
        return;
      }
      setRoom(await res.json());
      setError("");
    } catch { setError("Erro de conexão"); }
    finally { setLoading(false); }
  }, [code]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const people = room?.data?.people || room?.members.map((m) => ({ id: m.userId, name: m.name, isDrinker: m.isDrinker })) || [];
  const items = room?.data?.items || [];
  const tipPercent = room?.data?.tipPercent ?? room?.tipPercent ?? 10;
  const { results, total } = calcResults(items, people, tipPercent);

  async function saveData(next: { people?: Person[]; items?: BillItem[]; tipPercent?: number }) {
    if (!room) return;
    setSaving(true);
    const data = { people: next.people ?? people, items: next.items ?? items, tipPercent: next.tipPercent ?? tipPercent };
    const { results: r, total: t } = calcResults(data.items, data.people, data.tipPercent);
    await fetch(`/api/sessions/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data, tipPercent: data.tipPercent, totalAmount: t,
        memberAmounts: Object.entries(r).map(([userId, amount]) => ({ userId, amount })),
      }),
    });
    await load();
    setSaving(false);
  }

  async function addItem() {
    const amount = parseFloat(itemAmount.replace(",", "."));
    if (!itemName.trim() || !amount || amount <= 0) return;
    const id = Math.random().toString(36).slice(2, 9);
    const participants = itemCat === "bebida"
      ? people.filter((p) => p.isDrinker !== false).map((p) => p.id)
      : people.map((p) => p.id);
    await saveData({ items: [...items, { id, name: itemName.trim(), amount, category: itemCat, participants }] });
    setItemName(""); setItemAmount("");
  }

  async function removeItem(id: string) {
    await saveData({ items: items.filter((i) => i.id !== id) });
  }

  async function toggleParticipant(itemId: string, personId: string) {
    const next = items.map((i) => {
      if (i.id !== itemId) return i;
      const has = i.participants.includes(personId);
      return { ...i, participants: has ? i.participants.filter((p) => p !== personId) : [...i.participants, personId] };
    });
    await saveData({ items: next });
  }

  async function sendComment() {
    if (!comment.trim()) return;
    setSending(true);
    await fetch(`/api/sessions/${code}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    setComment(""); setSending(false); await load();
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Entra na sala *${room?.title}* do Paga Juntos!\nCódigo: *${code}*\n\n${typeof window !== "undefined" ? window.location.origin : ""}/sala/${code}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (loading) {
    return (<main className="min-h-dvh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>);
  }

  if (error || !room) {
    return (
      <main className="min-h-dvh px-4 py-6 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-center">{error || "Sala não encontrada"}</p>
        <Link href="/sala"><Button>Voltar às salas</Button></Link>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-6 safe-bottom pb-28">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/sala"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate flex items-center gap-2">
            {room.mode === "BBQ" && <Flame className="h-5 w-5 text-primary shrink-0" />}
            {room.title}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <button onClick={copyCode} className="font-mono font-bold text-primary inline-flex items-center gap-1">
              {code}{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={load} className="rounded-full"><RefreshCw className="h-4 w-4" /></Button>
        <Button size="icon" onClick={shareWhatsApp} className="rounded-full bg-success hover:bg-success/90"><Share2 className="h-4 w-4" /></Button>
      </div>

      <div className="mx-auto max-w-md space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Quem está aqui ({room.members.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {room.members.map((m) => (
              <span key={m.id} className={`rounded-full px-3 py-1 text-sm font-medium ${m.userId === myId ? "bg-primary text-white" : "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200"}`}>
                {m.name}{m.userId === myId ? " (você)" : ""}
              </span>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Itens da conta</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Nenhum item ainda. Adicione carne, bebida ou extras.</p>}
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.name} <span className="text-xs font-normal text-muted-foreground capitalize">· {item.category}</span></p>
                    <p className="text-primary font-bold">{formatCurrency(item.amount)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-secondary h-8 w-8" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {people.map((p) => {
                    const active = item.participants.includes(p.id);
                    return (
                      <button key={p.id} type="button" onClick={() => toggleParticipant(item.id, p.id)}
                        className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${active ? "bg-primary text-white border-primary" : "bg-transparent text-muted-foreground border-border"}`}>
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="rounded-2xl bg-muted/50 p-3 space-y-2">
              <div className="flex gap-1">
                {(["carne", "bebida", "extra"] as const).map((c) => (
                  <button key={c} type="button" onClick={() => setItemCat(c)}
                    className={`flex-1 text-xs capitalize rounded-xl py-2 font-medium ${itemCat === c ? "bg-primary text-white" : "bg-background border border-border"}`}>{c}</button>
                ))}
              </div>
              <Input placeholder="Nome do item" value={itemName} onChange={(e) => setItemName(e.target.value)} />
              <div className="flex gap-2">
                <Input placeholder="R$ 0,00" value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} inputMode="decimal" />
                <Button onClick={addItem} disabled={!itemName || !itemAmount}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {total > 0 && (
          <Card className="border-2 border-primary/40 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quanto cada um paga</CardTitle>
              <p className="text-2xl font-extrabold text-primary">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground">com {tipPercent}% de gorjeta</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {people.map((p) => (
                <div key={p.id} className="flex justify-between items-center rounded-xl bg-white/80 dark:bg-black/20 px-3 py-2">
                  <span className="font-medium">{p.name}{p.id === myId ? " (você)" : ""}</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(results[p.id] || 0)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4" />Comentários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-56 overflow-y-auto space-y-2">
              {room.comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Ninguém comentou ainda. Ex: “eu não bebi”</p>
              )}
              {room.comments.map((c) => (
                <div key={c.id} className={`rounded-2xl px-3 py-2 text-sm ${c.userId === myId ? "bg-primary/10 ml-6" : "bg-muted mr-6"}`}>
                  <p className="font-semibold text-xs text-muted-foreground mb-0.5">{c.userName}{c.userId === myId ? " (você)" : ""}</p>
                  <p>{c.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Escreva um comentário..." value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComment()} />
              <Button onClick={sendComment} disabled={sending || !comment.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
