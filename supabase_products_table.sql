-- DealZone PK Supabase SQL
-- Supabase Dashboard -> SQL Editor -> New Query -> paste all -> Run

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price text not null,
  category text not null,
  stock text default 'In Stock',
  description text not null,
  image text not null,
  created_at timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists "Allow public read products" on public.products;
drop policy if exists "Allow public insert products" on public.products;
drop policy if exists "Allow public delete products" on public.products;

create policy "Allow public read products"
on public.products
for select
using (true);

create policy "Allow public insert products"
on public.products
for insert
with check (true);

create policy "Allow public delete products"
on public.products
for delete
using (true);
