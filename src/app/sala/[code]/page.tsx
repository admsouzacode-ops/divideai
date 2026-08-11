"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, Check, Loader2, Users, MessageCircle, Send, Plus, Trash2, Flame, Share2, RefreshCw, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";

type Person = { id: string; name: string; isDrinker?: boolean };
type BillItem = { id: string; name: string; amount: number; category: string; participants: string[] };
type Comment = { id: string; content: string; userId: string; userName: string; createdAt: string };
type Member = { id: string; userId: string; name: string; isDrinker: boolean; amountDue: number | null };
type Room = {
  id: string; code: string; title: string; mode: string; status: string; tipPercent: number;
  data: { people?: Person[]; items?: BillItem[]; tipPercent?: number; categories?: string[]; categoriesReady?: boolean };
  isOwner: boolean; members: Member[]; comments: Comment[]; updatedAt: string;
};

const BBQ_DEFAULT_CATS = ["Carne", "Bebida", "Extra"];
const TIP_OPTIONS = [0, 10, 12, 15, 20];
const SUGGESTED_NORMAL = ["Comida", "Bebida", "Sobremesa", "Taxa", "Outro"];

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
  return { results, total: subtotal + tip, subtotal, tip };
}

export default function SalaRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code || "").toUpperCase();
  const { data: session, status: authStatus } = useSession();
  const myId = (session?.user as any)?.id as string | undefined;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [itemCat, setItemCat] = useState("");
  const [newCatInput, setNewCatInput] = useState("");
  const [setupCats, setSetupCats] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${code}`);
      if (res.status === 403) {
        setJoining(true);
        const joinRes = await fetch("/api/sessions/join", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
        });
        if (joinRes.ok) {
          const res2 = await fetch(`/api/sessions/${code}`);
          if (res2.ok) { setRoom(await res2.json()); setError(""); setJoining(false); setLoading(false); return; }
        }
        const d = await joinRes.json().catch(() => ({}));
        setError(d.error || "Não foi possível entrar na sala"); setRoom(null); setJoining(false); setLoading(false); return;
      }
      if (res.status === 401) { router.replace(`/login?callbackUrl=${encodeURIComponent(`/sala/${code}`)}`); return; }
      if (!res.ok) { const d = await res.json(); setError(d.error || "Erro ao carregar sala"); setRoom(null); return; }
      setRoom(await res.json()); setError("");
    } catch { setError("Erro de conexão"); }
    finally { setLoading(false); setJoining(false); }
  }, [code, router]);

  useEffect(() => {
    if (authStatus === "loading") return;
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load, authStatus]);

  const people = room?.data?.people || room?.members.map((m) => ({ id: m.userId, name: m.name, isDrinker: m.isDrinker })) || [];
  const items = room?.data?.items || [];
  const tipPercent = room?.data?.tipPercent ?? room?.tipPercent ?? 10;
  const { results, total, subtotal, tip } = calcResults(items, people, tipPercent);
  const roomCategories: string[] =
    room?.data?.categories && room.data.categories.length > 0
      ? room.data.categories
      : room?.mode === "BBQ" ? BBQ_DEFAULT_CATS : [];
  const needsCategorySetup = room?.mode === "NORMAL" && !room?.data?.categoriesReady;

  useEffect(() => {
    if (roomCategories.length > 0 && !itemCat) setItemCat(roomCategories[0]);
  }, [roomCategories.join(","), itemCat]);

  async function saveData(next: { people?: Person[]; items?: BillItem[]; tipPercent?: number; categories?: string[]; categoriesReady?: boolean }) {
    if (!room) return;
    setSaving(true);
    const data = {
      people: next.people ?? people,
      items: next.items ?? items,
      tipPercent: next.tipPercent ?? tipPercent,
      categories: next.categories ?? room?.data?.categories ?? roomCategories,
      categoriesReady: next.categoriesReady ?? room?.data?.categoriesReady ?? false,
    };
    const { results: r, total: t } = calcResults(data.items, data.people, data.tipPercent);
    await fetch(`/api/sessions/${code}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, tipPercent: data.tipPercent, totalAmount: t, memberAmounts: Object.entries(r).map(([userId, amount]) => ({ userId, amount })) }),
    });
    await load();
    setSaving(false);
  }

  async function addItem() {
    const amount = parseFloat(itemAmount.replace(",", "."));
    if (!itemName.trim() || !amount || amount <= 0) return;
    const category = itemCat || roomCategories[0] || "Geral";
    const id = Math.random().toString(36).slice(2, 9);
    const isDrink = category.toLowerCase().includes("bebida") || category.toLowerCase().includes("drink");
    const participants = isDrink ? people.filter((p) => p.isDrinker !== false).map((p) => p.id) : people.map((p) => p.id);
    await saveData({ items: [...items, { id, name: itemName.trim(), amount, category, participants }] });
    setItemName(""); setItemAmount("");
  }

  async function finishCategorySetup() {
    const cats = setupCats.map((c) => c.trim()).filter(Boolean);
    if (cats.length === 0) return;
    await saveData({ categories: cats, categoriesReady: true });
    setItemCat(cats[0]);
  }

  function toggleSetupCat(name: string) {
    setSetupCats((prev) => prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]);
  }

  function addCustomSetupCat() {
    const n = newCatInput.trim();
    if (!n) return;
    if (!setupCats.includes(n)) setSetupCats((prev) => [...prev, n]);
    setNewCatInput("");
  }

  async function removeItem(id: string) { await saveData({ items: items.filter((i) => i.id !== id) }); }

  async function toggleParticipant(itemId: string, personId: string) {
    const next = items.map((i) => {
      if (i.id !== itemId) return i;
      const has = i.participants.includes(personId);
      return { ...i, participants: has ? i.participants.filter((p) => p !== personId) : [...i.participants, personId] };
    });
    await saveData({ items: next });
  }

  async function setTip(pct: number) { await saveData({ tipPercent: pct }); }

  async function sendComment() {
    if (!comment.trim()) return;
    setSending(true);
    await fetch(`/api/sessions/${code}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: comment }) });
    setComment(""); setSending(false); await load();
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = encodeURIComponent(`Entra na sala *${room?.title}* do Paga Juntos!\n\nÉ só abrir o link (entra automático):\n${origin}/sala/${code}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (loading || joining || authStatus === "loading") {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {joining && <p className="text-sm text-muted-foreground">Entrando na sala...</p>}
      </main>
    );
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

        {needsCategorySetup && (
          <Card className="border-2 border-primary/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Configure as categorias</CardTitle>
              <p className="text-sm text-muted-foreground font-normal">
                Antes de lançar os itens, escolha (ou crie) as categorias desta conta. Ex: comida, bebida, transporte…
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Sugestões — toque para marcar</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_NORMAL.map((s) => {
                  const on = setupCats.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSetupCat(s)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${on ? "bg-primary text-white border-primary" : "bg-background border-border"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Categoria personalizada" value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomSetupCat()} />
                <Button type="button" variant="secondary" onClick={addCustomSetupCat}><Plus className="h-4 w-4" /></Button>
              </div>
              {setupCats.length > 0 && (
                <p className="text-sm text-muted-foreground">Selecionadas: <strong className="text-foreground">{setupCats.join(", ")}</strong></p>
              )}
              <Button className="w-full" size="lg" disabled={setupCats.length === 0 || saving} onClick={finishCategorySetup}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Continuar para a conta"}
              </Button>
            </CardContent>
          </Card>
        )}

        {!needsCategorySetup && (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Gorjeta / taxa de serviço</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {TIP_OPTIONS.map((pct) => (
                    <button key={pct} type="button" onClick={() => setTip(pct)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${tipPercent === pct ? "bg-primary text-white border-primary" : "bg-background border-border text-foreground"}`}>
                      {pct === 0 ? "Sem" : `${pct}%`}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 px-3 py-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <p><strong className="text-foreground">O que é?</strong> É a taxa de serviço (comum em restaurantes e bares no Brasil, em geral 10%). Divide junto com a conta entre quem participa.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Itens da conta</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Nenhum item ainda. Adicione o que foi consumido.</p>}
                {items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{item.name} <span className="text-xs font-normal text-muted-foreground">· {item.category}</span></p>
                        <p className="text-primary font-bold">{formatCurrency(item.amount)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-secondary h-8 w-8" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Quem divide este item:</p>
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
                  <p className="text-xs font-medium text-muted-foreground">Categoria do item</p>
                  <div className="flex flex-wrap gap-1">
                    {roomCategories.map((c) => (
                      <button key={c} type="button" onClick={() => setItemCat(c)}
                        className={`text-xs rounded-xl px-3 py-2 font-medium ${itemCat === c ? "bg-primary text-white" : "bg-background border border-border"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <Input placeholder="Nome do item" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                  <div className="flex gap-2">
                    <Input placeholder="R$ 0,00" value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} inputMode="decimal" />
                    <Button onClick={addItem} disabled={!itemName || !itemAmount || !itemCat}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {total > 0 && (
              <Card className="border-2 border-primary/40 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-background">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quanto cada um paga</CardTitle>
                  <p className="text-2xl font-extrabold text-primary">{formatCurrency(total)}</p>
                  <p className="text-xs text-muted-foreground">
                    Subtotal {formatCurrency(subtotal)}{tip > 0 ? ` + gorjeta ${tipPercent}% (${formatCurrency(tip)})` : " · sem gorjeta"}
                  </p>
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
          </>
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
                <div key={c.id} className={`rounded-2xl px-3 py-2.5 text-sm border ${
                  c.userId === myId
                    ? "bg-orange-50 border-orange-200 text-stone-900 ml-4 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-50"
                    : "bg-white border-stone-200 text-stone-800 mr-4 shadow-sm dark:bg-stone-800 dark:border-stone-600 dark:text-stone-100"
                }`}>
                  <p className={`font-semibold text-xs mb-0.5 ${c.userId === myId ? "text-orange-700 dark:text-orange-300" : "text-stone-500 dark:text-stone-300"}`}>
                    {c.userName}{c.userId === myId ? " (você)" : ""}
                  </p>
                  <p className="leading-snug">{c.content}</p>
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
