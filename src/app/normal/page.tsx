"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, MessageCircle, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, generateId } from "@/lib/utils";
import { saveToHistory } from "@/lib/storage";
import type { Person } from "@/types";

const TIP_OPTIONS = [0, 10, 15, 20];

export default function NormalPage() {
  const [total, setTotal] = useState("");
  const [tipPercent, setTipPercent] = useState(10);
  const [customTip, setCustomTip] = useState("");
  const [useCustomTip, setUseCustomTip] = useState(false);
  const [equalSplit, setEqualSplit] = useState(true);
  const [people, setPeople] = useState<Person[]>([
    { id: generateId(), name: "Pessoa 1" },
    { id: generateId(), name: "Pessoa 2" },
  ]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    totalWithTip: number;
    perPerson: number;
    breakdown: { name: string; amount: number }[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const addPerson = () => {
    const newId = generateId();
    setPeople([...people, { id: newId, name: `Pessoa ${people.length + 1}` }]);
  };

  const removePerson = (id: string) => {
    if (people.length <= 1) return;
    setPeople(people.filter((p) => p.id !== id));
    const newAmounts = { ...customAmounts };
    delete newAmounts[id];
    setCustomAmounts(newAmounts);
  };

  const updateName = (id: string, name: string) => {
    setPeople(people.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const calculate = () => {
    const totalValue = parseFloat(total.replace(",", ".")) || 0;
    if (totalValue <= 0) return;

    const tip = useCustomTip
      ? parseFloat(customTip.replace(",", ".")) || 0
      : tipPercent;
    const tipAmount = (totalValue * tip) / 100;
    const totalWithTip = totalValue + tipAmount;

    let breakdown: { name: string; amount: number }[] = [];

    if (equalSplit) {
      const perPerson = totalWithTip / people.length;
      breakdown = people.map((p) => ({ name: p.name, amount: perPerson }));
      setResult({ totalWithTip, perPerson, breakdown });
    } else {
      let sumCustom = 0;
      const amounts: Record<string, number> = {};
      people.forEach((p) => {
        const val = parseFloat((customAmounts[p.id] || "0").replace(",", ".")) || 0;
        amounts[p.id] = val;
        sumCustom += val;
      });

      if (sumCustom <= 0) {
        const perPerson = totalWithTip / people.length;
        breakdown = people.map((p) => ({ name: p.name, amount: perPerson }));
        setResult({ totalWithTip, perPerson, breakdown });
      } else {
        breakdown = people.map((p) => {
          const share = amounts[p.id] / sumCustom;
          return { name: p.name, amount: totalWithTip * share };
        });
        setResult({
          totalWithTip,
          perPerson: totalWithTip / people.length,
          breakdown,
        });
      }
    }

    saveToHistory({
      title: `Conta de ${formatCurrency(totalWithTip)}`,
      mode: "normal",
      total: totalWithTip,
      peopleCount: people.length,
      data: {
        type: "normal",
        total: totalValue,
        peopleCount: people.length,
        tipPercent: tip,
        equalSplit,
        people,
        resultPerPerson: totalWithTip / people.length,
        totalWithTip,
      },
    });
  };

  const getWhatsAppText = () => {
    if (!result) return "";
    let text = `🔥 *DivideAí* - Divisão de conta\n\n`;
    text += `💰 Total com gorjeta: *${formatCurrency(result.totalWithTip)}*\n\n`;
    result.breakdown.forEach((b) => {
      text += `• ${b.name}: *${formatCurrency(b.amount)}*\n`;
    });
    text += `\nFeito com DivideAí 🧡`;
    return encodeURIComponent(text);
  };

  const copyResult = async () => {
    if (!result) return;
    let text = `DivideAí - Divisão de conta\n\nTotal: ${formatCurrency(result.totalWithTip)}\n\n`;
    result.breakdown.forEach((b) => {
      text += `${b.name}: ${formatCurrency(b.amount)}\n`;
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-dvh px-4 py-6 safe-bottom">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Dividir Conta</h1>
          <p className="text-sm text-muted-foreground">Modo normal</p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">
              Valor total da conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                R$
              </span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="pl-12 text-2xl font-bold h-14"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">
              Gorjeta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {TIP_OPTIONS.map((t) => (
                <Button
                  key={t}
                  variant={!useCustomTip && tipPercent === t ? "default" : "secondary"}
                  size="sm"
                  onClick={() => {
                    setTipPercent(t);
                    setUseCustomTip(false);
                  }}
                  className="h-11"
                >
                  {t}%
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant={useCustomTip ? "default" : "secondary"}
                size="sm"
                onClick={() => setUseCustomTip(true)}
                className="shrink-0"
              >
                Outro
              </Button>
              {useCustomTip && (
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="%"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  className="h-9"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pessoas ({people.length})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={addPerson} className="gap-1">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 mb-2">
              <Button
                variant={equalSplit ? "default" : "secondary"}
                size="sm"
                onClick={() => setEqualSplit(true)}
                className="flex-1"
              >
                Divisão igual
              </Button>
              <Button
                variant={!equalSplit ? "default" : "secondary"}
                size="sm"
                onClick={() => setEqualSplit(false)}
                className="flex-1"
              >
                Personalizada
              </Button>
            </div>

            {people.map((person) => (
              <div key={person.id} className="flex items-center gap-2">
                <Input
                  value={person.name}
                  onChange={(e) => updateName(person.id, e.target.value)}
                  className="flex-1"
                  placeholder="Nome"
                />
                {!equalSplit && (
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="R$"
                    value={customAmounts[person.id] || ""}
                    onChange={(e) =>
                      setCustomAmounts({
                        ...customAmounts,
                        [person.id]: e.target.value,
                      })
                    }
                    className="w-24"
                  />
                )}
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

        <Button
          size="xl"
          className="w-full"
          onClick={calculate}
          disabled={!total}
        >
          Calcular divisão
        </Button>

        {result && (
          <Card className="border-2 border-primary/30 bg-gradient-to-b from-orange-50 to-white dark:from-orange-950/30 dark:to-card">
            <CardHeader>
              <CardTitle className="text-center text-muted-foreground text-sm font-medium">
                Total com gorjeta
              </CardTitle>
              <p className="text-center text-4xl font-extrabold text-primary">
                {formatCurrency(result.totalWithTip)}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.breakdown.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-2xl bg-white/80 dark:bg-stone-900/50 px-4 py-3"
                >
                  <span className="font-medium">{b.name}</span>
                  <span className="text-xl font-bold">{formatCurrency(b.amount)}</span>
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
