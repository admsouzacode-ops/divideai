# DivideAí 🔥

**O divisor de contas inteligente e brasileiro.**

Acabe com a briga na hora de dividir a conta — especialmente no churrasco!

## ✨ Funcionalidades

- **Modo Normal**: valor total, gorjeta, divisão igual ou personalizada
- **Modo Churrasco / Festa** (diferencial):
  - Itens por categoria (Carne, Bebida, Extras)
  - Seleção de quem participa de cada item
  - Separação de bebedores e não-bebedores
  - Cálculo justo automático
- Histórico local (localStorage)
- Compartilhar no WhatsApp com um toque
- **Tutorial guiado** na primeira visita (onboarding)
- Preparado para PWA
- Versão Free e Pro (R$ 12,90 compra única)

## 🛠️ Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui style components
- Lucide React
- localStorage
- Docker ready (Dokploy)

## 🚀 Instalação e execução local

```bash
# Clone o repositório
git clone https://github.com/admsouzacode-ops/divideai.git
cd divideai

# Instale as dependências
npm install --legacy-peer-deps

# Rode em desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## 🏗️ Build de produção

```bash
npm run build
npm start
```

## 🐳 Deploy com Docker (Dokploy)

O projeto já vem com `Dockerfile` otimizado (multi-stage + standalone output).

### No Dokploy:

1. Conecte o repositório GitHub
2. Selecione o Dockerfile
3. Configure a porta **3000**
4. Deploy!

Ou manualmente:

```bash
docker build -t divideai .
docker run -p 3000:3000 divideai
```

## 📤 Repositório

Este projeto está em: **https://github.com/admsouzacode-ops/divideai**

## 💰 Monetização

- **Free**: anúncios (preparado) + histórico limitado a 5
- **Pro**: R$ 12,90 (compra única) — sem anúncios, histórico ilimitado, exportar

A integração com Mercado Pago está mockada. Substitua a função `handlePurchase` em `/src/app/pro/page.tsx` pela integração real.

## 🎨 Design System

- Primária: `#F97316` (Laranja)
- Secundária: `#EF4444`
- Fundo: `#FFF7ED`
- Estilo: quente, brasileiro, acolhedor, mobile-first

## 📁 Estrutura

```
src/
├── app/
│   ├── page.tsx          # Home
│   ├── normal/           # Modo normal
│   ├── bbq/              # Modo Churrasco
│   ├── historico/        # Histórico
│   └── pro/              # Paywall
├── components/ui/        # Componentes base
├── lib/                  # Utils + storage
└── types/                # TypeScript types
```

## 📝 Licença

MIT — use à vontade e faça o sucesso!

---

Feito com 🧡 pro Brasil.
