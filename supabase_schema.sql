-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ENUMS & CONSTANTS
create type user_role as enum ('admin', 'kasir', 'gudang');

-- 2. TABLES

-- Table: Profiles (Extends Auth for Roles)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role user_role default 'kasir',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Settings (Store Config)
create table public.settings (
  id integer primary key generated always as identity,
  store_name text default 'ScooterLink POS',
  store_address text,
  store_phone text,
  tax_rate numeric default 0,
  footer_message text default 'Terima kasih telah berbelanja!',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: Suppliers
create table public.suppliers (
  id uuid default uuid_generate_v4() primary key,
  nama text not null,
  alamat text,
  telepon text,
  kontak_person text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Customers
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  nama text not null,
  no_hp text,
  plat_nomor text, -- Unique to vehicle ideally, but one cust can have multiple bikes. For MVP, store primary plate.
  alamat text,
  total_spend numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Products (Updated)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  nama_barang text not null,
  sku text unique not null,
  barcode text, -- For scan
  kategori text,
  stok integer default 0,
  harga_beli numeric default 0, -- For profit calc
  harga_jual numeric not null,
  supplier_id uuid references public.suppliers(id),
  min_stock_alert integer default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Purchases (Barang Masuk / Restock)
create table public.purchases (
  id uuid default uuid_generate_v4() primary key,
  supplier_id uuid references public.suppliers(id),
  no_po text, -- Purchase Order Number
  total_cost numeric default 0,
  status text default 'completed', -- pending, completed
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Purchase Items
create table public.purchase_items (
  id uuid default uuid_generate_v4() primary key,
  purchase_id uuid references public.purchases(id) on delete cascade,
  product_id uuid references public.products(id),
  qty integer not null,
  cost_price numeric not null, -- Harga beli saat itu
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Transactions (Updated)
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  no_struk text, -- Generated invoice number
  customer_id uuid references public.customers(id),
  items jsonb not null, -- Stores snapshot: [{sku, name, qty, price, cost}]
  subtotal numeric not null,
  tax numeric default 0,
  discount numeric default 0,
  total_amount numeric not null,
  payment_method text not null, -- cash, qris, transfer
  cash_given numeric,
  change_amount numeric,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. RLS POLICIES (Simple MVP: Authenticated users can do all, can be refined later for Roles)
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.transactions enable row level security;

create policy "Auth users full access" on public.profiles for all to authenticated using (true) with check (true);
create policy "Auth users full access" on public.settings for all to authenticated using (true) with check (true);
create policy "Auth users full access" on public.suppliers for all to authenticated using (true) with check (true);
create policy "Auth users full access" on public.customers for all to authenticated using (true) with check (true);
create policy "Auth users full access" on public.products for all to authenticated using (true) with check (true);
create policy "Auth users full access" on public.purchases for all to authenticated using (true) with check (true);
create policy "Auth users full access" on public.purchase_items for all to authenticated using (true) with check (true);
create policy "Auth users full access" on public.transactions for all to authenticated using (true) with check (true);

-- 4. FUNCTIONS & TRIGGERS

-- Function: Atomic Transaction (POS Sales)
create or replace function create_transaction_atomic(
  p_items jsonb,
  p_customer_id uuid,
  p_subtotal numeric,
  p_tax numeric,
  p_discount numeric,
  p_total_amount numeric,
  p_payment_method text,
  p_cash_given numeric,
  p_change_amount numeric,
  p_user_id uuid
) returns uuid
language plpgsql
security definer
as $$
declare
  v_transaction_id uuid;
  item jsonb;
  v_sku text;
  v_qty int;
  v_prod_id uuid;
begin
  -- 1. Insert Transaction
  insert into public.transactions (
    customer_id, items, subtotal, tax, discount, total_amount, 
    payment_method, cash_given, change_amount, created_by
  )
  values (
    p_customer_id, p_items, p_subtotal, p_tax, p_discount, p_total_amount, 
    p_payment_method, p_cash_given, p_change_amount, p_user_id
  )
  returning id into v_transaction_id;

  -- 2. Update Stock & Update Customer Spend
  for item in select * from jsonb_array_elements(p_items)
  loop
    v_sku := item->>'sku';
    v_qty := (item->>'qty')::int;
    
    -- Deduct stock
    update public.products
    set stok = stok - v_qty,
        updated_at = now()
    where sku = v_sku;
  end loop;

  -- Update Customer Total Spend
  if p_customer_id is not null then
    update public.customers
    set total_spend = total_spend + p_total_amount
    where id = p_customer_id;
  end if;

  return v_transaction_id;
end;
$$;

-- Function: Process Restock (Purchase)
create or replace function process_restock_atomic(
  p_supplier_id uuid,
  p_no_po text,
  p_items jsonb, -- Array of {product_id, qty, cost_price}
  p_user_id uuid
) returns uuid
language plpgsql
security definer
as $$
declare
  v_purchase_id uuid;
  v_total_cost numeric := 0;
  item jsonb;
  v_prod_id uuid;
  v_qty int;
  v_cost numeric;
begin
  -- Calculate total cost first
  for item in select * from jsonb_array_elements(p_items) loop
    v_total_cost := v_total_cost + ((item->>'qty')::int * (item->>'cost_price')::numeric);
  end loop;

  -- 1. Insert Purchase Header
  insert into public.purchases (supplier_id, no_po, total_cost, created_by)
  values (p_supplier_id, p_no_po, v_total_cost, p_user_id)
  returning id into v_purchase_id;

  -- 2. Insert Items and Update Product Stock/Price
  for item in select * from jsonb_array_elements(p_items)
  loop
    v_prod_id := (item->>'product_id')::uuid;
    v_qty := (item->>'qty')::int;
    v_cost := (item->>'cost_price')::numeric;

    -- Insert detail
    insert into public.purchase_items (purchase_id, product_id, qty, cost_price)
    values (v_purchase_id, v_prod_id, v_qty, v_cost);

    -- Update Product Stock & Latest Buy Price
    update public.products
    set stok = stok + v_qty,
        harga_beli = v_cost, -- Update latest cost price
        updated_at = now()
    where id = v_prod_id;
  end loop;

  return v_purchase_id;
end;
$$;

-- Function: Handle New User (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'kasir');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new auth user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Initial Seed for Settings
insert into public.settings (store_name) values ('ScooterLink POS') on conflict do nothing;