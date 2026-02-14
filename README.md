# Ichtys Facturador Exterior

Sistema de facturacion para **Ichtys Technology** (Veritas Lux Capital LLC). Permite gestionar clientes y generar facturas con logica de precios por protocolos, visitas on-site/remotas, descuentos por volumen, e items libres.

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (PostgreSQL + Auth)
- **Deploy**: Vercel

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ejecutar el SQL de `supabase-schema.sql` en el SQL Editor de Supabase
3. Crear un usuario admin en Authentication > Users
4. Copiar `.env.local` y completar las variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Iniciar desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Agregar las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Deploy automatico
