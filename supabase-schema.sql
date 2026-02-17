-- =====================================================
-- Ichtys Facturador Exterior - PostgreSQL Schema (Neon)
-- =====================================================

create extension if not exists pgcrypto;

create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  direccion text,
  telefono text,
  email text,
  rut_tax_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoices (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete restrict not null,
  invoice_number text unique not null,
  date date not null default current_date,
  period text,
  protocol_count integer default 0,
  protocol_unit_price numeric(10,2) default 0,
  protocol_total numeric(10,2) default 0,
  onsite_visits integer default 0,
  onsite_unit_price numeric(10,2) default 10.00,
  onsite_total numeric(10,2) default 0,
  remote_visits integer default 0,
  remote_unit_price numeric(10,2) default 2.50,
  remote_total numeric(10,2) default 0,
  visit_discount_percent numeric(5,2) default 0,
  visit_discount_amount numeric(10,2) default 0,
  implementation_fee numeric(10,2) default 0,
  subtotal numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  total numeric(10,2) default 0,
  notes text,
  status text default 'draft' check (status in ('draft', 'sent', 'paid')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references invoices(id) on delete cascade not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_invoices_client_id on invoices(client_id);
create index if not exists idx_invoices_date on invoices(date desc);
create index if not exists idx_invoice_items_invoice_id on invoice_items(invoice_id);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_clients_updated_at on clients;
create trigger update_clients_updated_at
before update on clients
for each row execute function update_updated_at_column();

drop trigger if exists update_invoices_updated_at on invoices;
create trigger update_invoices_updated_at
before update on invoices
for each row execute function update_updated_at_column();

