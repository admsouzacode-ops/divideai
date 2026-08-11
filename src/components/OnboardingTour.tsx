"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Flame,
  Receipt,
  MessageCircle,
  History,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";

const ONBOARDING_KEY = "divideai_onboarding_seen";

const STEPS = [
  {
    id: 1,
    icon: Sparkles,
    title: "Bem-vindo ao DivideAí! 🔥",
    description:
      "O app feito pra acabar com a briga na hora de dividir a conta. Rápido, justo e com jeitinho brasileiro.",
    tip: "Leva menos de 1 minuto pra aprender.",
  },
  {
    id: 2,
    icon: Receipt,
    title: "Modo Normal",
    description:
      "Perfeito pro dia a dia. Coloca o valor total, a gorjeta e quantas pessoas. Pode dividir igual ou personalizar quanto cada um paga.",
    tip: "Ideal pra restaurante, bar ou delivery.",
  },
  {
    id: 3,
    icon: Flame,
    title: "Modo Churrasco (o diferencial)",
    description:
      "Aqui você adiciona carne, bebida e extras. Marca quem bebe e quem participa de cada item. O app calcula a parte justa de cada um automaticamente.",
    tip: "Nunca mais briga de 'eu não bebi' ou 'eu não comi picanha'.",
  },
  {
    id: 4,
    icon: MessageCircle,
    title: "Compartilhe no WhatsApp",
    description:
      "Depois de calcular, é só apertar o botão verde e mandar a divisão pro grupo. Todo mundo vê quanto deve de forma clara.",
    tip: "Também dá pra copiar o texto se preferir.",
  },
  {
    id: 5,
    icon: History,
    title: "Histórico e Pronto!",
    description:
      "Suas últimas divisões ficam salvas aqui no celular. Agora é só escolher o modo e começar a dividir sem estresse.",
    tip: "Bora testar?",
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsOpen(false);
    onComplete?.();
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const skip = () => {
    finish();
  };

  if (!mounted || !isOpen) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === STEPS.length - 1;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md overflow-hidden shadow-2xl border-0 animate-in slide-in-from-bottom-4 duration-300">
        <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <CardContent className="p-6 pt-5">
          <div className="flex items-start justify-between mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-7 w-7" />
            </div>
            <button
              onClick={skip}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Fechar tutorial"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-xs font-medium text-primary">
              Passo {currentStep + 1} de {STEPS.length}
            </p>
            <h2 className="text-2xl font-bold leading-tight">{step.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
            {step.tip && (
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 rounded-xl px-3 py-2">
                💡 {step.tip}
              </p>
            )}
          </div>

          <div className="flex justify-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep
                    ? "w-6 bg-primary"
                    : "w-2 bg-stone-300 dark:bg-stone-600"
                }`}
                aria-label={`Ir para passo ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {!isLast && (
              <Button
                variant="ghost"
                onClick={skip}
                className="flex-1 text-muted-foreground"
              >
                Pular
              </Button>
            )}
            <Button onClick={next} className="flex-1 gap-1" size="lg">
              {isLast ? (
                <>
                  Começar a usar
                  <Sparkles className="h-4 w-4" />
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Helper para resetar o tutorial (útil em desenvolvimento) */
export function resetOnboarding() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ONBOARDING_KEY);
  }
}
