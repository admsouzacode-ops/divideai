# Paga Juntos 🤝

**O divisor de contas inteligente e brasileiro.**

## Stack
- Next.js 14 + TypeScript
- PostgreSQL + Prisma
- NextAuth (login/cadastro)
- Docker (Dokploy)

## Banco (Dokploy)
1. Crie Database → PostgreSQL
2. Configure:
```
DATABASE_URL=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```
3. `npx prisma db push`

## Deploy Dokploy
- Tipo: **Application**
- Build: **Dockerfile**
- Porta: **3000**

Feito com 🧡 pro Brasil · Paga Juntos
