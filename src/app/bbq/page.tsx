"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  MessageCircle,
  Beer,
  Drumstick,
  Package,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, generateId } from "@/lib/utils";
import { saveToHistory } from "@/lib/storage";
import type { Person, BillItem } from "@/types";

const CATEGORIES = [
  { id: "carne" as const, label: "Carne", icon: Drumstick, color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  { id: "bebida" as const, label: "Bebida", icon: Beer, color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { id: "extra" as const, label: "Extras", icon: Package, color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
];

export default function BBQPage() {
  const [people, setPeople] = useState<Person[]>([
    { id: generateId(), name: "Você", isDrinker: true },
    { id: generateId(), name: "Amigo 1", isDrinker: true },
  ]);
  const [items, setItems] = useState<BillItem[]>([]);
  const [tipPercent, setTipPercent] = useState(10);
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [totalWithTip, setTotalWithTip] = useState(0);
  const [copied, setCopied] = useState(false);

  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<"carne" | "bebida" | "extra">("carne");
  const [newItemParticipants, setNewItemParticipants] = useState<string[]>([]);

  const addPerson = () => {
    setPeople([
      ...people,
      {
        id: generateId(),
        name: `Pessoa ${people.length + 1}`,
        isDrinker: true,
      },
    ]);
  };

  const removePerson = (id: string) => {
    if (people.length <= 1) return;
    setPeople(people.filter((p) => p.id !== id));
    setItems(
      items.map((item) => ({
        ...item,
        participants: item.participants.filter((pid) => pid !== id),
      }))
    );
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPeople(people.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const toggleParticipant = (personId: string) => {
    setNewItemParticipants((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const addItem = () => {
    const amount = parseFloat(newItemAmount.replace(",", ".")) || 0;
    if (!newItemName.trim() || amount <= 0) return;

    const participants =
      newItemParticipants.length > 0
        ? newItemParticipants
        : newItemCategory === "bebida"
          ? people.filter((p) => p.isDrinker).map((p) => p.id)
          : people.map((p) => p.id);

    if (participants.length === 0) return;

    setItems([
      ...items,
      {
        id: generateId(),
        name: newItemName.trim(),
        amount,
        category: newItemCategory,
        participants,
      },
    ]);
    setNewItemName("");
    setNewItemAmount("");
    setNewItemParticipants([]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const calculate = () => {
    if (items.length === 0 || people.length === 0) return;

    const personTotals: Record<string, number> = {};
    people.forEach((p) => {
      personTotals[p.id] = 0;
    });

    items.forEach((item) => {
      if (item.participants.length === 0) return;
      const share = item.amount / item.participants.length;
      item.participants.forEach((pid) => {
        personTotals[pid] = (personTotals[pid] || 0) + share;
      });
    });

    const subtotal = Object.values(personTotals).reduce((a, b) => a + b, 0);
    const tipAmount = (subtotal * tipPercent) / 100;
    const total = subtotal + tipAmount;

    const final: Record<string, number> = {};
    people.forEach((p) => {
      const base = personTotals[p.id] || 0;
      const tipShare = subtotal > 0 ? (base / subtotal) * tipAmount : 0;
      final[p.id] = base + tipShare;
    });

    setResults(final);
    setTotalWithTip(total);

    saveToHistory({
      title: `Churrasco ${formatCurrency(total)}`,
      mode: "bbq",
      total,
      peopleCount: people.length,
      data: {
        type: "bbq",
        items,
        people,
        tipPercent,
        results: final,
        totalWithTip: total,
      },
    });
  };

  const getWhatsAppText = () => {
    if (!results) return "";
    let text = `🔥 *DivideAí* - Modo Churrasco\n\n`;
    text += `💰 Total com gorjeta: *${formatCurrency(totalWithTip)}*\n\n`;
    text += `*Quanto cada um paga:*\n`;
    people.forEach((p) => {
      text += `• ${p.name}: *${formatCurrency(results[p.id] || 0)}*\n`;
    });
    text += `\nFeito com DivideAí 🧡`;
    return encodeURIComponent(text);
  };

  const copyResult = async () => {
    if (!results) return;
    let text = `DivideAí - Modo Churrasco\n\nTotal: ${formatCurrency(totalWithTip)}\n\n`;
    people.forEach((p) => {
      text += `${p.name}: ${formatCurrency(results[p.id] || 0)}\n`;
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-dvh px-4 py-6 safe-bottom pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🔥 Modo Churrasco
          </h1>
          <p className="text-sm text-muted-foreground">Justo e sem briga</p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quem tá no churras?
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={addPerson} className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {people.map((person) => (
              <div key={person.id} className="flex items-center gap-2">
                <Input
                  value={person.name}
                  onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                  className="flex-1"
                  placeholder="Nome"
                />
                <Button
                  variant={person.isDrinker ? "default" : "secondary"}
                  size="sm"
                  onClick={() =>
                    updatePerson(person.id, { isDrinker: !person.isDrinker })
                  }
                  className="shrink-0 gap-1 px-3"
                  title="Bebedor?"
                >
                  <Beer className="h-4 w-4" />
                  {person.isDrinker ? "Bebe" : "Não"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePerson(person.id)}
                  disabled={people.length <= 1}
                  className="text-muted-foreground hover:text-secondary"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">
              Adicionar item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={newItemCategory === cat.id ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setNewItemCategory(cat.id)}
                    className="gap-1 h-11"
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
            <Input
              placeholder="Nome do item (ex: Picanha, Cerveja...)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                R$
              </span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                className="pl-12"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Quem participa deste item?
              </p>
              <div className="flex flex-wrap gap-2">
                {people.map((p) => {
                  const selected = newItemParticipants.includes(p.id);
                  const isDefault =
                    newItemParticipants.length === 0 &&
                    (newItemCategory === "bebida" ? p.isDrinker : true);
                  return (
                    <Button
                      key={p.id}
                      variant={selected || isDefault ? "default" : "secondary"}
                      size="sm"
                      onClick={() => toggleParticipant(p.id)}
                      className="h-9"
                    >
                      {p.name}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {newItemCategory === "bebida"
                  ? "Por padrão: só bebedores"
                  : "Por padrão: todos"}
              </p>
            </div>

            <Button onClick={addItem} className="w-full gap-2" disabled={!newItemName || !newItemAmount}>
              <Plus className="h-4 w-4" />
              Adicionar item
            </Button>
          </CardContent>
        </Card>

        {items.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                Itens ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => {
                const cat = CATEGORIES.find((c) => c.id === item.category)!;
                const Icon = cat.icon;
                const participantNames = item.participants
                  .map((id) => people.find((p) => p.id === id)?.name || "?")
                  .join(", ");
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-2xl bg-stone-50 dark:bg-stone-900/50 p-3"
                  >
                    <div className={`rounded-xl p-2 ${cat.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">{item.name}</span>
                        <span className="font-bold">{formatCurrency(item.amount)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {participantNames}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">
              Gorjeta / Taxa de serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {[0, 10, 15, 20].map((t) => (
                <Button
                  key={t}
                  variant={tipPercent === t ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setTipPercent(t)}
                  className="h-11"
                >
                  {t}%
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          size="xl"
          className="w-full"
          onClick={calculate}
          disabled={items.length === 0}
        >
          Calcular divisão justa
        </Button>

        {results && (
          <Card className="border-2 border-primary/30 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/30 dark:to-card">
            <CardHeader>
              <CardTitle className="text-center text-muted-foreground text-sm font-medium">
                Total com gorjeta
              </CardTitle>
              <p className="text-center text-4xl font-extrabold text-primary">
                {formatCurrency(totalWithTip)}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {people.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl bg-white/80 dark:bg-stone-900/50 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {p.isDrinker && (
                      <Beer className="h-3.5 w-3.5 text-amber-600" />
                    )}
                  </div>
                  <span className="text-xl font-bold">
                    {formatCurrency(results[p.id] || 0)}
                  </span>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1 gap-2"
                  onClick={copyResult}
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
                <a
                  href={`https://wa.me/?text=${getWhatsAppText()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="whatsapp" className="w-full gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
