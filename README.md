# Ichtys Facturador Exterior

Sistema de facturacion para **Ichtys Technology** (Veritas Lux Capital LLC). Permite gestionar clientes y generar facturas con logica de precios por protocolos, visitas on-site/remotas, descuentos por volumen e items libres.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui**
- **Neon PostgreSQL**
- **Auth local por variables de entorno** (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- **Deploy**: Vercel

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Neon y auth

1. Crear un proyecto en [Neon](https://neon.tech)
2. Ejecutar `supabase-schema.sql` (schema compatible con Neon)
3. Copiar `.env.local.example` a `.env.local` y completar:

```env
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
ADMIN_EMAIL=admin@ichtys.com
ADMIN_PASSWORD=super-seguro
APP_SESSION_SECRET=un-secreto-largo-de-al-menos-32-caracteres
```

### 3. Iniciar desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Migracion de datos Supabase -> Neon

1. Cargar en entorno:

```env
SUPABASE_DATABASE_URL=postgresql://...
DATABASE_URL=postgresql://... (Neon)
```

2. Ejecutar:

```bash
node scripts/migrate-supabase-to-neon.mjs
```

## Deploy en Vercel

Variables requeridas en Vercel:

- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `APP_SESSION_SECRET`

