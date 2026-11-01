-- =====================================================================
-- Hassan's Toys World — database schema for Supabase (PostgreSQL 15+)
--
-- HOW TO USE: Supabase dashboard → SQL Editor → paste this whole file → Run.
-- Run it ONCE on a fresh project, then run supabase/seed.sql, then
-- supabase/make-admin.sql (after creating your admin user).
--
-- SECURITY MODEL
--   * Every table has Row Level Security (RLS) enabled.
--   * Visitors (role "anon") can only read the public catalogue, delivery fees,
--     public store settings and APPROVED reviews. They can never read orders,
--     customers, costs, fraud rules or admin accounts.
--   * Orders and reviews are created ONLY by the server (service_role) through
--     place_order() / submit_review(), which re-check every rule and recompute
--     every price on the server. The browser can never set a price.
--   * Admins are rows in admin_users. Every admin table policy checks is_admin().
-- =====================================================================

-- ---------- Types ----------
create type public.order_status as enum
  ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.admin_role as enum ('owner', 'staff');

-- ---------- Generic helpers ----------
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Admin users ----------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       public.admin_role not null default 'staff',
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

create function public.is_owner() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'owner')
$$;

-- ---------- Store settings (public) and order rules (private) ----------
create table public.store_settings (
  id                 int primary key default 1 check (id = 1),
  whatsapp_number    text check (whatsapp_number is null or whatsapp_number ~ '^[0-9]{10,15}$'),
  contact_phone      text,
  contact_email      text,
  address_en         text,
  address_ar         text,
  instagram_url      text,
  tiktok_url         text,
  facebook_url       text,
  orders_enabled     boolean not null default true,
  promo_active       boolean not null default true,
  promo_title_en     text not null default 'Little Toys. BIG Happiness!',
  promo_title_ar     text not null default 'ألعاب صغيرة. سعادة كبيرة!',
  promo_text_en      text not null default 'Fresh squishies, plushies and collectibles are waiting for you.',
  promo_text_ar      text not null default 'سكويشي ودمى ومقتنيات جديدة بانتظارك.',
  updated_at         timestamptz not null default now()
);
insert into public.store_settings (id) values (1);

create table public.order_rules (
  id                         int primary key default 1 check (id = 1),
  max_qty_per_item           int not null default 10  check (max_qty_per_item > 0),
  max_items_per_order        int not null default 30  check (max_items_per_order > 0),
  large_order_value_iqd      int not null default 150000 check (large_order_value_iqd > 0),
  large_order_items          int not null default 20  check (large_order_items > 0),
  deposit_required_above_iqd int not null default 0   check (deposit_required_above_iqd >= 0), -- 0 = off
  deposit_on_flagged         boolean not null default false,
  deposit_percent            int not null default 30  check (deposit_percent between 1 and 100),
  duplicate_window_minutes   int not null default 30  check (duplicate_window_minutes >= 0),
  max_orders_per_hour        int not null default 3   check (max_orders_per_hour > 0),
  many_pending_count         int not null default 3   check (many_pending_count > 0),
  updated_at                 timestamptz not null default now()
);
insert into public.order_rules (id) values (1);

-- ---------- Catalogue ----------
create table public.categories (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en        text not null,
  name_ar        text not null,
  description_en text,
  description_ar text,
  image_url      text,
  color          text not null default 'pink' check (color in ('pink', 'yellow', 'blue', 'purple')),
  sort_order     int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id    uuid not null references public.categories (id) on delete restrict,
  name_en        text not null,
  name_ar        text not null,
  description_en text not null default '',
  description_ar text not null default '',
  price_iqd      int  not null check (price_iqd >= 0),
  sale_price_iqd int  check (sale_price_iqd is null or (sale_price_iqd >= 0 and sale_price_iqd < price_iqd)),
  sale_ends_at   timestamptz,
  stock          int  not null default 0 check (stock >= 0),
  images         text[] not null default '{}',
  featured       boolean not null default false,
  best_seller    boolean not null default false,
  is_active      boolean not null default true,
  promo_label_en text,
  promo_label_ar text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_created_idx  on public.products (created_at desc);

-- Cost lives in its own admin-only table so it can never leak to visitors.
create table public.product_costs (
  product_id uuid primary key references public.products (id) on delete cascade,
  cost_iqd   int not null default 0 check (cost_iqd >= 0)
);

-- ---------- Delivery ----------
create table public.delivery_fees (
  code       text primary key check (code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en    text not null,
  name_ar    text not null,
  fee_iqd    int  not null check (fee_iqd >= 0),
  is_active  boolean not null default true,
  sort_order int  not null default 0,
  updated_at timestamptz not null default now()
);

create table public.couriers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Customers ----------
create table public.customers (
  id               uuid primary key default gen_random_uuid(),
  phone            text not null unique check (phone ~ '^07[3-9][0-9]{8}$'),
  full_name        text not null,
  governorate_code text references public.delivery_fees (code) on update cascade,
  city             text,
  address          text,
  is_blocked       boolean not null default false,
  is_flagged       boolean not null default false,
  flag_reason      text,
  admin_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- Orders ----------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text not null unique,
  customer_id         uuid references public.customers (id) on delete set null,
  customer_name       text not null,
  phone               text not null,
  governorate_code    text,
  governorate_name_en text not null,
  governorate_name_ar text not null,
  city                text not null,
  address             text not null,
  delivery_notes      text,
  subtotal_iqd        int not null check (subtotal_iqd >= 0),
  delivery_fee_iqd    int not null check (delivery_fee_iqd >= 0),
  total_iqd           int not null check (total_iqd >= 0),
  status              public.order_status not null default 'pending',
  payment_method      text not null default 'cod' check (payment_method = 'cod'),
  language            text not null default 'en' check (language in ('en', 'ar')),
  flags               text[] not null default '{}',
  needs_review        boolean not null default false,
  deposit_required    boolean not null default false,
  deposit_amount_iqd  int not null default 0 check (deposit_amount_iqd >= 0),
  deposit_received    boolean not null default false,
  approved_at         timestamptz,
  approved_by         uuid,
  courier_id          uuid references public.couriers (id) on delete set null,
  tracking_note       text,
  admin_notes         text,
  items_signature     text not null,
  shipped_at          timestamptz,
  delivered_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (total_iqd = subtotal_iqd + delivery_fee_iqd)
);
create index orders_status_idx   on public.orders (status, created_at desc);
create index orders_phone_idx    on public.orders (phone, created_at desc);
create index orders_customer_idx on public.orders (customer_id);

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  product_name_en text not null,
  product_name_ar text not null,
  unit_price_iqd  int not null check (unit_price_iqd >= 0),
  unit_cost_iqd   int not null default 0 check (unit_cost_iqd >= 0),
  quantity        int not null check (quantity > 0),
  line_total_iqd  int not null check (line_total_iqd >= 0)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_events (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  actor       uuid,
  from_status public.order_status,
  to_status   public.order_status not null,
  created_at  timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

create table public.delivery_attempts (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  courier_id uuid references public.couriers (id) on delete set null,
  outcome    text not null check (outcome in ('failed', 'delivered')),
  reason     text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index delivery_attempts_order_idx on public.delivery_attempts (order_id);

-- ---------- Reviews ----------
create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products (id) on delete cascade,
  reviewer_name     text not null check (char_length(reviewer_name) between 2 and 60),
  rating            int  not null check (rating between 1 and 5),
  body              text not null check (char_length(body) between 3 and 1000),
  verified_purchase boolean not null default false,
  status            public.review_status not null default 'pending',
  created_at        timestamptz not null default now()
);
create index reviews_product_idx on public.reviews (product_id, status);

-- Reviewer phone numbers are private (used only to prevent duplicates and to verify purchases).
create table public.review_private (
  review_id  uuid primary key references public.reviews (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  phone      text not null,
  unique (product_id, phone)
);

create view public.product_ratings as
  select product_id,
         round(avg(rating)::numeric, 2)::float8 as avg_rating,
         count(*)::int                          as review_count
  from public.reviews
  where status = 'approved'
  group by product_id;

-- ---------- updated_at triggers ----------
create trigger products_touch      before update on public.products      for each row execute function public.touch_updated_at();
create trigger customers_touch     before update on public.customers     for each row execute function public.touch_updated_at();
create trigger delivery_fees_touch before update on public.delivery_fees for each row execute function public.touch_updated_at();
create trigger store_settings_touch before update on public.store_settings for each row execute function public.touch_updated_at();
create trigger order_rules_touch   before update on public.order_rules   for each row execute function public.touch_updated_at();

-- =====================================================================
-- ORDER SAFETY TRIGGERS
-- =====================================================================

-- New orders can only ever start as "pending".
create function public.orders_insert_guard() returns trigger
language plpgsql as $$
begin
  if new.status <> 'pending' then
    raise exception 'new_orders_must_be_pending';
  end if;
  return new;
end $$;
create trigger orders_insert_guard before insert on public.orders
  for each row execute function public.orders_insert_guard();

-- Status workflow + "never dispatch an unverified order".
--   pending → confirmed (this IS the manual approval) → processing → shipped → delivered
--   pending/confirmed/processing → cancelled        shipped/delivered → returned
create function public.orders_guard() returns trigger
language plpgsql as $$
begin
  if new.total_iqd <> old.total_iqd or new.subtotal_iqd <> old.subtotal_iqd
     or new.delivery_fee_iqd <> old.delivery_fee_iqd or new.phone <> old.phone
     or new.order_number <> old.order_number then
    raise exception 'order_amounts_locked';
  end if;

  if new.status is distinct from old.status then
    if not (
         (old.status = 'pending'    and new.status in ('confirmed', 'cancelled'))
      or (old.status = 'confirmed'  and new.status in ('processing', 'cancelled'))
      or (old.status = 'processing' and new.status in ('shipped', 'cancelled'))
      or (old.status = 'shipped'    and new.status in ('delivered', 'returned'))
      or (old.status = 'delivered'  and new.status = 'returned')
    ) then
      raise exception 'invalid_status_transition: % -> %', old.status, new.status;
    end if;

    if new.status = 'confirmed' and new.approved_at is null then
      new.approved_at := now();
      new.approved_by := auth.uid();
    end if;

    if new.status in ('processing', 'shipped', 'delivered') then
      if new.approved_at is null then
        raise exception 'order_not_approved';
      end if;
      if new.deposit_required and not new.deposit_received then
        raise exception 'deposit_not_received';
      end if;
    end if;

    if new.status = 'shipped'   then new.shipped_at   := coalesce(new.shipped_at, now()); end if;
    if new.status = 'delivered' then new.delivered_at := now(); end if;
  end if;

  new.updated_at := now();
  return new;
end $$;
create trigger orders_guard before update on public.orders
  for each row execute function public.orders_guard();

-- Log every status change; give stock back when an order is cancelled or returned.
create function public.orders_log_insert() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.order_events (order_id, actor, from_status, to_status)
  values (new.id, auth.uid(), null, new.status);
  return new;
end $$;
create trigger orders_log_insert after insert on public.orders
  for each row execute function public.orders_log_insert();

create function public.orders_after_update() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_events (order_id, actor, from_status, to_status)
    values (new.id, auth.uid(), old.status, new.status);

    if new.status in ('cancelled', 'returned') then
      update public.products p
         set stock = p.stock + oi.quantity
        from public.order_items oi
       where oi.order_id = new.id and oi.product_id = p.id;
    end if;
  end if;
  return new;
end $$;
create trigger orders_after_update after update on public.orders
  for each row execute function public.orders_after_update();

-- Two or more failed deliveries for the same customer → flag the customer.
create function public.delivery_attempt_after_insert() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_customer uuid;
  v_failed   int;
begin
  if new.outcome = 'failed' then
    select customer_id into v_customer from public.orders where id = new.order_id;
    if v_customer is not null then
      select count(*) into v_failed
        from public.delivery_attempts da
        join public.orders o on o.id = da.order_id
       where o.customer_id = v_customer and da.outcome = 'failed';
      if v_failed >= 2 then
        update public.customers
           set is_flagged = true,
               flag_reason = coalesce(flag_reason, 'Repeated failed deliveries')
         where id = v_customer;
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger delivery_attempt_after_insert after insert on public.delivery_attempts
  for each row execute function public.delivery_attempt_after_insert();

-- =====================================================================
-- SERVER FUNCTIONS (callable ONLY by the server with the service_role key)
-- =====================================================================

-- Normalises an Iraqi mobile number to 07XXXXXXXXX, or returns NULL if it is not valid.
create function public.normalize_iq_phone(raw text) returns text
language plpgsql immutable as $$
declare s text;
begin
  if raw is null then return null; end if;
  s := translate(raw, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  s := regexp_replace(s, '[^0-9+]', '', 'g');
  if    s like '+964%'  then s := '0' || substr(s, 5);
  elsif s like '00964%' then s := '0' || substr(s, 6);
  elsif s like '964%'   then s := '0' || substr(s, 4);
  elsif s ~ '^7[0-9]{9}$' then s := '0' || s;
  end if;
  if s ~ '^07[3-9][0-9]{8}$' then return s; end if;
  return null;
end $$;

create function public.effective_price(p public.products) returns int
language sql stable as $$
  select case
    when p.sale_price_iqd is not null
     and p.sale_price_iqd < p.price_iqd
     and (p.sale_ends_at is null or p.sale_ends_at > now())
    then p.sale_price_iqd else p.price_iqd end
$$;

-- Places a Cash-on-Delivery order. EVERYTHING is validated and priced here:
-- phone format, governorate, stock, quantity limits, duplicates, rate limit,
-- fraud flags and optional deposit. The order always starts as "pending".
create function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  rules      public.order_rules%rowtype;
  settings   public.store_settings%rowtype;
  v_name     text;
  v_phone    text;
  v_city     text;
  v_addr     text;
  v_notes    text;
  v_lang     text;
  v_fee      public.delivery_fees%rowtype;
  v_cust     public.customers%rowtype;
  v_cust_id  uuid;
  v_known    boolean;
  v_items    jsonb;
  v_lines    jsonb := '[]'::jsonb;
  v_n_input  int;
  v_n_found  int := 0;
  rec        record;
  v_price    int;
  v_cost     int;
  v_subtotal int := 0;
  v_qty      int := 0;
  v_total    int;
  v_flags    text[] := '{}';
  v_sig      text;
  v_dup      text;
  v_recent   int;
  v_pending  int;
  v_failed   int;
  v_returned int;
  v_dep_req  boolean := false;
  v_dep_amt  int := 0;
  v_order_id uuid;
  v_order_no text;
  line       jsonb;
begin
  select * into settings from public.store_settings where id = 1;
  if not settings.orders_enabled then
    return jsonb_build_object('ok', false, 'error', 'orders_disabled');
  end if;
  select * into rules from public.order_rules where id = 1;

  -- ---- customer details ----
  v_name := btrim(regexp_replace(coalesce(p->>'name', ''), '\s+', ' ', 'g'));
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    return jsonb_build_object('ok', false, 'error', 'invalid_name');
  end if;
  v_phone := public.normalize_iq_phone(p->>'phone');
  if v_phone is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;
  select * into v_fee from public.delivery_fees where code = p->>'governorate' and is_active;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_governorate');
  end if;
  v_city := btrim(coalesce(p->>'city', ''));
  if char_length(v_city) < 2 or char_length(v_city) > 80 then
    return jsonb_build_object('ok', false, 'error', 'invalid_city');
  end if;
  v_addr := btrim(coalesce(p->>'address', ''));
  if char_length(v_addr) < 8 or char_length(v_addr) > 300 then
    return jsonb_build_object('ok', false, 'error', 'invalid_address');
  end if;
  v_notes := nullif(left(btrim(coalesce(p->>'notes', '')), 500), '');
  v_lang  := case when p->>'language' = 'ar' then 'ar' else 'en' end;

  -- ---- items ----
  v_items := p->'items';
  if v_items is null or jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'empty_cart');
  end if;
  if jsonb_array_length(v_items) > 100 or exists (
       select 1 from jsonb_array_elements(v_items) e
        where jsonb_typeof(e) <> 'object'
           or coalesce(e->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           or coalesce(e->>'quantity', '')   !~ '^[0-9]{1,4}$') then
    return jsonb_build_object('ok', false, 'error', 'invalid_items');
  end if;

  select count(*) into v_n_input from (
    select 1 from jsonb_array_elements(v_items) e group by e->>'product_id') x;

  -- Lock the product rows (consistent order → no deadlocks) and price them from the DB.
  for rec in
    select pr.id, pr.name_en, pr.name_ar, pr.stock, pr.is_active,
           public.effective_price(pr) as eff, agg.qty
      from (select (e->>'product_id')::uuid as pid, sum((e->>'quantity')::int) as qty
              from jsonb_array_elements(v_items) e group by 1) agg
      join public.products pr on pr.id = agg.pid
     order by pr.id
       for update of pr
  loop
    v_n_found := v_n_found + 1;
    if not rec.is_active or rec.qty <= 0 then
      return jsonb_build_object('ok', false, 'error', 'product_unavailable', 'product', rec.name_en);
    end if;
    if rec.qty > rules.max_qty_per_item then
      return jsonb_build_object('ok', false, 'error', 'quantity_limit_item',
                                'product', rec.name_en, 'limit', rules.max_qty_per_item);
    end if;
    if rec.stock < rec.qty then
      return jsonb_build_object('ok', false, 'error', 'insufficient_stock',
                                'product', rec.name_en, 'product_ar', rec.name_ar, 'available', rec.stock);
    end if;
    v_price := rec.eff;
    select coalesce(cost_iqd, 0) into v_cost from public.product_costs where product_id = rec.id;
    v_cost := coalesce(v_cost, 0);
    v_subtotal := v_subtotal + v_price * rec.qty;
    v_qty := v_qty + rec.qty;
    v_sig := coalesce(v_sig || '|', '') || rec.id::text || ':' || rec.qty::text;
    v_lines := v_lines || jsonb_build_object(
      'product_id', rec.id, 'name_en', rec.name_en, 'name_ar', rec.name_ar,
      'price', v_price, 'cost', v_cost, 'qty', rec.qty);
  end loop;

  if v_n_found <> v_n_input then
    return jsonb_build_object('ok', false, 'error', 'product_unavailable');
  end if;
  if v_qty > rules.max_items_per_order then
    return jsonb_build_object('ok', false, 'error', 'quantity_limit_order', 'limit', rules.max_items_per_order);
  end if;

  v_total := v_subtotal + v_fee.fee_iqd;

  -- ---- fake-order protection ----
  select * into v_cust from public.customers where phone = v_phone;
  v_known := found;
  if v_known and v_cust.is_blocked then
    return jsonb_build_object('ok', false, 'error', 'blocked');
  end if;

  select order_number into v_dup from public.orders
   where phone = v_phone and items_signature = v_sig and status <> 'cancelled'
     and created_at > now() - make_interval(mins => rules.duplicate_window_minutes)
   order by created_at desc limit 1;
  if v_dup is not null then
    return jsonb_build_object('ok', false, 'error', 'duplicate_order', 'order_number', v_dup);
  end if;

  select count(*) into v_recent from public.orders
   where phone = v_phone and created_at > now() - interval '1 hour';
  if v_recent >= rules.max_orders_per_hour then
    return jsonb_build_object('ok', false, 'error', 'too_many_orders');
  end if;

  if v_total >= rules.large_order_value_iqd then v_flags := array_append(v_flags, 'large_value'::text); end if;
  if v_qty   >= rules.large_order_items     then v_flags := array_append(v_flags, 'large_quantity'::text); end if;
  select count(*) into v_pending from public.orders where phone = v_phone and status = 'pending';
  if v_pending + 1 >= rules.many_pending_count then v_flags := array_append(v_flags, 'many_pending'::text); end if;
  if v_known then
    if v_cust.is_flagged then v_flags := array_append(v_flags, 'flagged_customer'::text); end if;
    select count(*) into v_failed from public.delivery_attempts da
      join public.orders o on o.id = da.order_id
     where o.customer_id = v_cust.id and da.outcome = 'failed';
    if v_failed > 0 then v_flags := array_append(v_flags, 'failed_delivery_history'::text); end if;
    select count(*) into v_returned from public.orders where customer_id = v_cust.id and status = 'returned';
    if v_returned > 0 then v_flags := array_append(v_flags, 'previous_return'::text); end if;
  end if;

  if (rules.deposit_required_above_iqd > 0 and v_total >= rules.deposit_required_above_iqd)
     or (rules.deposit_on_flagged and cardinality(v_flags) > 0) then
    v_dep_req := true;
    v_dep_amt := least(v_total, (ceil(v_total * rules.deposit_percent / 100.0 / 500.0) * 500)::int);
  end if;

  -- ---- save ----
  insert into public.customers (phone, full_name, governorate_code, city, address)
  values (v_phone, v_name, v_fee.code, v_city, v_addr)
  on conflict (phone) do update
     set full_name = excluded.full_name, governorate_code = excluded.governorate_code,
         city = excluded.city, address = excluded.address
  returning id into v_cust_id;

  v_order_no := 'HTW-' || to_char(now() at time zone 'Asia/Baghdad', 'YYMMDD') || '-'
                || lpad(nextval('public.order_number_seq')::text, 4, '0');

  insert into public.orders (
    order_number, customer_id, customer_name, phone, governorate_code,
    governorate_name_en, governorate_name_ar, city, address, delivery_notes,
    subtotal_iqd, delivery_fee_iqd, total_iqd, language, flags, needs_review,
    deposit_required, deposit_amount_iqd, items_signature)
  values (
    v_order_no, v_cust_id, v_name, v_phone, v_fee.code,
    v_fee.name_en, v_fee.name_ar, v_city, v_addr, v_notes,
    v_subtotal, v_fee.fee_iqd, v_total, v_lang, v_flags, cardinality(v_flags) > 0,
    v_dep_req, v_dep_amt, v_sig)
  returning id into v_order_id;

  for line in select * from jsonb_array_elements(v_lines) loop
    insert into public.order_items (order_id, product_id, product_name_en, product_name_ar,
                                    unit_price_iqd, unit_cost_iqd, quantity, line_total_iqd)
    values (v_order_id, (line->>'product_id')::uuid, line->>'name_en', line->>'name_ar',
            (line->>'price')::int, (line->>'cost')::int, (line->>'qty')::int,
            (line->>'price')::int * (line->>'qty')::int);
    update public.products set stock = stock - (line->>'qty')::int
     where id = (line->>'product_id')::uuid;
  end loop;

  return jsonb_build_object(
    'ok', true, 'order_number', v_order_no, 'status', 'pending',
    'subtotal', v_subtotal, 'delivery_fee', v_fee.fee_iqd, 'total', v_total,
    'needs_review', cardinality(v_flags) > 0,
    'deposit_required', v_dep_req, 'deposit_amount', v_dep_amt);
end $$;

-- Saves a customer review (always starts "pending" until an admin approves it).
create function public.submit_review(p jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_pid      uuid;
  v_name     text;
  v_phone    text;
  v_rating   int;
  v_body     text;
  v_verified boolean;
  v_id       uuid;
begin
  if coalesce(p->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_product');
  end if;
  v_pid := (p->>'product_id')::uuid;
  if not exists (select 1 from public.products where id = v_pid and is_active) then
    return jsonb_build_object('ok', false, 'error', 'invalid_product');
  end if;
  v_name := btrim(regexp_replace(coalesce(p->>'name', ''), '\s+', ' ', 'g'));
  if char_length(v_name) < 2 or char_length(v_name) > 60 then
    return jsonb_build_object('ok', false, 'error', 'invalid_name');
  end if;
  v_phone := public.normalize_iq_phone(p->>'phone');
  if v_phone is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_phone');
  end if;
  if coalesce(p->>'rating', '') !~ '^[1-5]$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_rating');
  end if;
  v_rating := (p->>'rating')::int;
  v_body := btrim(coalesce(p->>'body', ''));
  if char_length(v_body) < 3 or char_length(v_body) > 1000 then
    return jsonb_build_object('ok', false, 'error', 'invalid_body');
  end if;
  if exists (select 1 from public.review_private where product_id = v_pid and phone = v_phone) then
    return jsonb_build_object('ok', false, 'error', 'already_reviewed');
  end if;

  select exists (
    select 1 from public.orders o join public.order_items oi on oi.order_id = o.id
     where o.phone = v_phone and oi.product_id = v_pid and o.status = 'delivered'
  ) into v_verified;

  insert into public.reviews (product_id, reviewer_name, rating, body, verified_purchase)
  values (v_pid, v_name, v_rating, v_body, v_verified) returning id into v_id;
  insert into public.review_private (review_id, product_id, phone) values (v_id, v_pid, v_phone);

  return jsonb_build_object('ok', true, 'verified', v_verified);
end $$;

-- Order tracking: only returns data when the order number AND the phone match.
create function public.track_order(p_order_number text, p_phone text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  o       public.orders%rowtype;
  v_phone text;
begin
  v_phone := public.normalize_iq_phone(p_phone);
  if v_phone is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  select * into o from public.orders
   where order_number = upper(btrim(p_order_number)) and phone = v_phone;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object(
    'ok', true, 'order_number', o.order_number, 'status', o.status,
    'created_at', o.created_at, 'subtotal', o.subtotal_iqd, 'delivery_fee', o.delivery_fee_iqd,
    'total', o.total_iqd, 'governorate_en', o.governorate_name_en, 'governorate_ar', o.governorate_name_ar,
    'deposit_required', o.deposit_required, 'deposit_amount', o.deposit_amount_iqd,
    'deposit_received', o.deposit_received,
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
                'name_en', i.product_name_en, 'name_ar', i.product_name_ar,
                'quantity', i.quantity, 'line_total', i.line_total_iqd)), '[]'::jsonb)
                from public.order_items i where i.order_id = o.id));
end $$;

-- Dashboard numbers for the admin. Revenue = product sales of DELIVERED orders
-- (delivery fees are passed on to the courier, so they are not counted as revenue).
create function public.admin_stats() returns jsonb
language plpgsql stable set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return jsonb_build_object(
    'total_orders',          (select count(*) from public.orders),
    'pending_orders',        (select count(*) from public.orders where status = 'pending'),
    'needs_review_orders',   (select count(*) from public.orders where status = 'pending' and needs_review),
    'in_progress_orders',    (select count(*) from public.orders where status in ('confirmed', 'processing', 'shipped')),
    'successful_deliveries', (select count(*) from public.orders where status = 'delivered'),
    'cancelled_orders',      (select count(*) from public.orders where status = 'cancelled'),
    'returned_orders',       (select count(*) from public.orders where status = 'returned'),
    'total_sales_iqd',       (select coalesce(sum(subtotal_iqd), 0) from public.orders where status = 'delivered'),
    'open_orders_value_iqd', (select coalesce(sum(total_iqd), 0) from public.orders
                               where status in ('pending', 'confirmed', 'processing', 'shipped')),
    'gross_profit_iqd',      (select coalesce(sum((oi.unit_price_iqd - oi.unit_cost_iqd) * oi.quantity), 0)
                               from public.order_items oi join public.orders o on o.id = oi.order_id
                              where o.status = 'delivered'),
    'low_stock_products',    (select count(*) from public.products where is_active and stock <= 5),
    'monthly', (select coalesce(jsonb_agg(m order by m.month), '[]'::jsonb) from (
                  select to_char(date_trunc('month', delivered_at at time zone 'Asia/Baghdad'), 'YYYY-MM') as month,
                         sum(subtotal_iqd)::int as revenue, count(*)::int as orders
                    from public.orders
                   where status = 'delivered' and delivered_at >= now() - interval '12 months'
                   group by 1) m),
    'best_sellers', (select coalesce(jsonb_agg(b), '[]'::jsonb) from (
                  select oi.product_name_en as name, sum(oi.quantity)::int as units,
                         sum(oi.line_total_iqd)::int as revenue
                    from public.order_items oi join public.orders o on o.id = oi.order_id
                   where o.status in ('confirmed', 'processing', 'shipped', 'delivered')
                   group by oi.product_name_en order by units desc limit 5) b)
  );
end $$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.admin_users       enable row level security;
alter table public.store_settings    enable row level security;
alter table public.order_rules       enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.product_costs     enable row level security;
alter table public.delivery_fees     enable row level security;
alter table public.couriers          enable row level security;
alter table public.customers         enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.order_events      enable row level security;
alter table public.delivery_attempts enable row level security;
alter table public.reviews           enable row level security;
alter table public.review_private    enable row level security;

-- Public read (visitors)
create policy store_settings_read on public.store_settings for select using (true);
create policy categories_read     on public.categories     for select using (is_active or public.is_admin());
create policy products_read       on public.products       for select using (is_active or public.is_admin());
create policy delivery_fees_read  on public.delivery_fees  for select using (is_active or public.is_admin());
create policy reviews_read        on public.reviews        for select using (status = 'approved' or public.is_admin());

-- Admin-only (every table below)
create policy store_settings_admin on public.store_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy order_rules_admin    on public.order_rules    for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy categories_admin     on public.categories     for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy products_admin       on public.products       for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy product_costs_admin  on public.product_costs  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy delivery_fees_admin  on public.delivery_fees  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy couriers_admin       on public.couriers       for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy customers_admin      on public.customers      for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy orders_admin         on public.orders         for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy order_items_admin    on public.order_items    for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy order_events_admin   on public.order_events   for select to authenticated
  using (public.is_admin());
create policy delivery_attempts_admin on public.delivery_attempts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy reviews_admin        on public.reviews        for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy review_private_admin on public.review_private for select to authenticated
  using (public.is_admin());

-- Admin accounts: any admin can see the team; only an owner can change it.
create policy admin_users_read  on public.admin_users for select to authenticated using (public.is_admin());
create policy admin_users_owner on public.admin_users for all to authenticated
  using (public.is_owner()) with check (public.is_owner());

-- =====================================================================
-- PRIVILEGES (belt and braces on top of RLS)
-- Supabase grants broad default privileges; take them away, then give back only what is needed.
-- =====================================================================
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

-- Visitors: public catalogue only (RLS filters the rows).
grant select on public.store_settings, public.categories, public.products,
                public.delivery_fees, public.reviews, public.product_ratings
  to anon, authenticated;

-- Signed-in users: RLS lets only admins touch these.
grant select, insert, update, delete on
  public.order_rules, public.product_costs, public.couriers, public.customers,
  public.orders, public.order_items, public.delivery_attempts, public.admin_users
  to authenticated;
grant insert, update, delete on public.categories, public.products, public.delivery_fees, public.reviews
  to authenticated;
grant update on public.store_settings to authenticated;
grant select on public.order_events, public.review_private to authenticated;

-- Functions
grant execute on function public.is_admin(), public.is_owner() to anon, authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.effective_price(public.products) to anon, authenticated, service_role;
grant execute on function public.normalize_iq_phone(text),
                          public.place_order(jsonb), public.submit_review(jsonb),
                          public.track_order(text, text) to service_role;
grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- =====================================================================
-- STORAGE: public bucket for product photos (only admins can upload)
-- =====================================================================
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
    on conflict (id) do nothing;
    execute $p$create policy "product images admin insert" on storage.objects for insert to authenticated
               with check (bucket_id = 'product-images' and public.is_admin())$p$;
    execute $p$create policy "product images admin update" on storage.objects for update to authenticated
               using (bucket_id = 'product-images' and public.is_admin())$p$;
    execute $p$create policy "product images admin delete" on storage.objects for delete to authenticated
               using (bucket_id = 'product-images' and public.is_admin())$p$;
  end if;
end $$;
