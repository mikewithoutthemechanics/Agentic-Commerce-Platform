-- Initial schema for the agentic commerce platform.
-- This migration is designed for Supabase PostgreSQL and keeps human
-- checkout data separate from the UCP/MCP presentation layer.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  gtin text unique,
  title text not null,
  detailed_specs jsonb not null default '{}'::jsonb,
  inventory_count integer not null default 0
    check (inventory_count >= 0),
  human_price numeric(12, 2) not null
    check (human_price >= 0),
  agent_tokenized_price numeric(12, 2) not null
    check (agent_tokenized_price >= 0),
  trend_score numeric(6, 3) not null default 0
    check (trend_score >= 0 and trend_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is
  'Commerce catalog shared by human storefronts and machine consumers.';
comment on column public.products.detailed_specs is
  'Structured product attributes intended for agent and compatibility queries.';
comment on column public.products.agent_tokenized_price is
  'Machine-checkout price expressed in the store currency before token settlement.';

create index if not exists products_trend_score_idx
  on public.products (trend_score desc);
create index if not exists products_inventory_count_idx
  on public.products (inventory_count);
create index if not exists products_detailed_specs_gin_idx
  on public.products using gin (detailed_specs);

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_products_updated_at();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  cart_details jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in (
      'pending',
      'payment_pending',
      'paid',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'failed'
    )),
  agent_id text,
  payment_gateway text not null
    check (payment_gateway in ('payfast', 'agent_api')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.orders.cart_details is
  'Immutable-at-checkout cart snapshot, including product IDs, quantities, and prices.';
comment on column public.orders.agent_id is
  'Nullable machine consumer identifier for headless UCP checkout.';

create index if not exists orders_user_id_idx
  on public.orders (user_id);
create index if not exists orders_agent_id_idx
  on public.orders (agent_id)
  where agent_id is not null;
create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_orders_updated_at();

drop materialized view if exists public.ucp_catalog_view;

create materialized view public.ucp_catalog_view as
select
  p.id,
  jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'Product',
    '@id', 'urn:product:' || p.id::text,
    'productID', p.id::text,
    'gtin', p.gtin,
    'name', p.title,
    'additionalProperty', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            '@type', 'PropertyValue',
            'name', attribute.key,
            'value', attribute.value
          )
        )
        from jsonb_each_text(p.detailed_specs) as attribute(key, value)
      ),
      '[]'::jsonb
    ),
    'offers', jsonb_build_object(
      '@type', 'Offer',
      'priceCurrency', 'ZAR',
      'price', p.human_price,
      'availability',
        case
          when p.inventory_count > 0
            then 'https://schema.org/InStock'
          else 'https://schema.org/OutOfStock'
        end,
      'inventoryLevel', p.inventory_count
    ),
    'agentOffer', jsonb_build_object(
      '@type', 'Offer',
      'priceCurrency', 'ZAR',
      'price', p.agent_tokenized_price,
      'availability',
        case
          when p.inventory_count > 0
            then 'https://schema.org/InStock'
          else 'https://schema.org/OutOfStock'
        end,
      'paymentMethod', 'UCP tokenized payment'
    ),
    'trendScore', p.trend_score,
    'updatedAt', p.updated_at
  ) as catalog_item
from public.products as p;

create unique index ucp_catalog_view_id_idx
  on public.ucp_catalog_view (id);

-- Row-level security is enabled for the base tables. Server-side routes and
-- trusted machine consumers should use the Supabase service role; browser
-- access can be granted with narrowly-scoped policies in a later migration.
alter table public.products enable row level security;
alter table public.orders enable row level security;