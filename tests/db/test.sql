-- Database tests: business rules, fraud protection, status workflow and Row Level Security.
create schema t;
grant usage on schema t to public;
create table t.state (k text primary key, v text);
grant all on t.state to public;

create function t.ok(cond boolean, msg text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'FAILED: %', msg; end if; end $$;

-- Runs `sql` under the CURRENT role and requires it to fail with a message containing `expected`.
create function t.raises(sql text, expected text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if sqlerrm like '%' || expected || '%' then return; end if;
    raise exception 'FAILED: wrong error for [%]: got "%", wanted "%"', sql, sqlerrm, expected;
  end;
  raise exception 'FAILED: expected an error containing "%" from [%]', expected, sql;
end $$;

create function t.item(slug text, qty int) returns jsonb language sql as $$
  select jsonb_build_object('product_id', (select id from public.products where products.slug = $1), 'quantity', $2) $$;

create function t.po(phone text, gov text, items jsonb) returns jsonb language sql as $$
  select public.place_order(jsonb_build_object(
    'name', 'Test Buyer', 'phone', phone, 'governorate', gov, 'city', 'Karrada',
    'address', 'Street 12, near the market', 'notes', 'call first', 'language', 'en', 'items', items)) $$;

grant execute on all functions in schema t to public;

-- ---------- seed + helper data ----------
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'shopper@example.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'staff@example.com');
insert into public.admin_users (user_id, email, role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner@example.com', 'owner'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'staff@example.com', 'staff');

do $$ begin
  perform t.ok((select count(*) from public.products) = 22, 'seed: 22 products');
  perform t.ok((select count(*) from public.categories) = 5, 'seed: 5 categories');
  perform t.ok((select count(*) from public.delivery_fees) = 19, 'seed: 19 governorates');
  perform t.ok((select count(distinct fee_iqd) from public.delivery_fees) > 3, 'seed: fees differ by governorate');
  perform t.ok((select count(*) from public.product_costs) = 22, 'seed: costs');
end $$;

-- ---------- phone normalisation ----------
do $$ begin
  perform t.ok(public.normalize_iq_phone('0770 123 4567') = '07701234567', 'spaces');
  perform t.ok(public.normalize_iq_phone('+964 770 123 4567') = '07701234567', '+964');
  perform t.ok(public.normalize_iq_phone('00964-770-123-4567') = '07701234567', '00964');
  perform t.ok(public.normalize_iq_phone('9647701234567') = '07701234567', '964');
  perform t.ok(public.normalize_iq_phone('7701234567') = '07701234567', 'no leading zero');
  perform t.ok(public.normalize_iq_phone('٠٧٧٠١٢٣٤٥٦٧') = '07701234567', 'Arabic-Indic digits');
  perform t.ok(public.normalize_iq_phone('07801234567') = '07801234567', 'Zain');
  perform t.ok(public.normalize_iq_phone('12345') is null, 'too short');
  perform t.ok(public.normalize_iq_phone('0721234567') is null, 'bad prefix');
  perform t.ok(public.normalize_iq_phone('077012345678') is null, 'too long');
  perform t.ok(public.normalize_iq_phone('abc') is null, 'letters');
  perform t.ok(public.normalize_iq_phone(null) is null, 'null');
end $$;

-- ---------- placing orders (as the server) ----------
do $$
declare r jsonb; s0 int; s1 int;
begin
  set role service_role;
  select stock into s0 from public.products where slug = 'mini-mochi-squishy';
  r := t.po('0770 123 4567', 'baghdad', jsonb_build_array(t.item('mini-mochi-squishy', 2)));
  perform t.ok((r->>'ok')::boolean, 'happy path: ' || r::text);
  perform t.ok((r->>'subtotal')::int = 10000, 'subtotal 2 x 5,000');
  perform t.ok((r->>'delivery_fee')::int = 5000, 'Baghdad fee');
  perform t.ok((r->>'total')::int = 15000, 'total');
  perform t.ok(r->>'status' = 'pending', 'starts pending');
  perform t.ok(r->>'order_number' ~ '^HTW-[0-9]{6}-[0-9]{4}$', 'order number: ' || (r->>'order_number'));
  perform t.ok((r->>'deposit_required')::boolean = false, 'no deposit by default');
  select stock into s1 from public.products where slug = 'mini-mochi-squishy';
  perform t.ok(s1 = s0 - 2, 'stock reduced');
  insert into t.state values ('order1', r->>'order_number');

  -- Sale price + governorate-specific fee + client-sent prices are ignored.
  r := t.po('0780 000 0001', 'basra',
        jsonb_build_array(t.item('sprinkle-donut-squishy', 1) || '{"price": 1, "unit_price": 1}'::jsonb));
  perform t.ok((r->>'subtotal')::int = 4500, 'sale price used, tampered price ignored: ' || r::text);
  perform t.ok((r->>'delivery_fee')::int = 6000, 'Basra fee differs from Baghdad');
  perform t.ok((r->>'total')::int = 10500, 'total with sale');
  insert into t.state values ('order_sale', r->>'order_number');

  -- Validation errors
  perform t.ok(t.po('12345', 'baghdad', jsonb_build_array(t.item('mini-mochi-squishy', 1)))->>'error' = 'invalid_phone', 'bad phone');
  perform t.ok(t.po('0771 111 1111', 'atlantis', jsonb_build_array(t.item('mini-mochi-squishy', 1)))->>'error' = 'invalid_governorate', 'bad governorate');
  perform t.ok(t.po('0771 111 1111', 'baghdad', '[]'::jsonb)->>'error' = 'empty_cart', 'empty cart');
  perform t.ok(t.po('0771 111 1111', 'baghdad', '[{"product_id":"abc","quantity":1}]'::jsonb)->>'error' = 'invalid_items', 'bad uuid');
  perform t.ok(t.po('0771 111 1111', 'baghdad', jsonb_build_array(jsonb_build_object('product_id', gen_random_uuid(), 'quantity', 1)))->>'error' = 'product_unavailable', 'unknown product');
  perform t.ok(t.po('0771 111 1111', 'baghdad', jsonb_build_array(t.item('cloud-pup-figure', 1)))->>'error' = 'insufficient_stock', 'sold out product');
  perform t.ok(t.po('0771 111 1111', 'baghdad', jsonb_build_array(t.item('rainbow-spring-coil', 4)))->>'error' = 'insufficient_stock', 'more than stock (3)');
  perform t.ok(public.place_order(jsonb_build_object('name', 'A', 'phone', '07711111111', 'governorate', 'baghdad', 'city', 'X', 'address', 'Street 12 near market', 'items', jsonb_build_array(t.item('mini-mochi-squishy', 1))))->>'error' = 'invalid_name', 'short name');
  perform t.ok(public.place_order(jsonb_build_object('name', 'Ali Hassan', 'phone', '07711111111', 'governorate', 'baghdad', 'city', 'Karrada', 'address', 'short', 'items', jsonb_build_array(t.item('mini-mochi-squishy', 1))))->>'error' = 'invalid_address', 'short address');

  -- Inactive product cannot be bought
  update public.products set is_active = false where slug = 'rainbow-spring-coil';
  perform t.ok(t.po('0771 111 1111', 'baghdad', jsonb_build_array(t.item('rainbow-spring-coil', 1)))->>'error' = 'product_unavailable', 'inactive product');
  update public.products set is_active = true where slug = 'rainbow-spring-coil';

  -- Store switched off
  update public.store_settings set orders_enabled = false;
  perform t.ok(t.po('0771 111 1111', 'baghdad', jsonb_build_array(t.item('mini-mochi-squishy', 1)))->>'error' = 'orders_disabled', 'orders disabled');
  update public.store_settings set orders_enabled = true;

  -- Arabic-Indic phone digits are accepted
  r := t.po('٠٧٧٠٩٩٩٠٠٠١', 'najaf', jsonb_build_array(t.item('rainbow-spring-coil', 1)));
  perform t.ok((r->>'ok')::boolean and (select phone from public.orders where order_number = r->>'order_number') = '07709990001', 'Arabic digits phone');
  reset role;
end $$;

-- ---------- fake-order protection ----------
do $$
declare r jsonb;
begin
  set role service_role;

  -- Duplicate order (same phone + same basket inside the window)
  r := t.po('0770 123 4567', 'baghdad', jsonb_build_array(t.item('mini-mochi-squishy', 2)));
  perform t.ok(r->>'error' = 'duplicate_order' and r->>'order_number' = (select v from t.state where k = 'order1'), 'duplicate detected: ' || r::text);
  -- Same phone, different basket is fine
  r := t.po('0770 123 4567', 'baghdad', jsonb_build_array(t.item('peach-squishy', 1)));
  perform t.ok((r->>'ok')::boolean, 'different basket allowed');

  -- Per-hour limit (default 3)
  perform t.ok((t.po('0791 000 0001', 'baghdad', jsonb_build_array(t.item('kitty-paw-squishy', 1))))->>'ok' = 'true', 'rate 1');
  perform t.ok((t.po('0791 000 0001', 'baghdad', jsonb_build_array(t.item('bubble-tea-squishy', 1))))->>'ok' = 'true', 'rate 2');
  perform t.ok((t.po('0791 000 0001', 'baghdad', jsonb_build_array(t.item('rainbow-pop-it', 1))))->>'ok' = 'true', 'rate 3');
  perform t.ok(t.po('0791 000 0001', 'baghdad', jsonb_build_array(t.item('click-fidget-cube', 1)))->>'error' = 'too_many_orders', 'rate limit');
  perform t.ok(exists (select 1 from public.orders o
                 where o.phone = '07910000001' and 'many_pending' = any (o.flags)), 'many pending orders flagged');

  -- Quantity limits (admin-configurable)
  perform t.ok(t.po('0792 000 0001', 'baghdad', jsonb_build_array(t.item('rainbow-pop-it', 11)))->>'error' = 'quantity_limit_item', 'per-item limit');
  update public.order_rules set max_items_per_order = 5;
  perform t.ok(t.po('0792 000 0001', 'baghdad', jsonb_build_array(t.item('rainbow-pop-it', 3), t.item('peach-squishy', 3)))->>'error' = 'quantity_limit_order', 'per-order limit');
  update public.order_rules set max_items_per_order = 30;

  -- Same product listed twice is merged before limits/stock are checked
  perform t.ok(t.po('0792 000 0002', 'baghdad', jsonb_build_array(t.item('rainbow-pop-it', 6), t.item('rainbow-pop-it', 6)))->>'error' = 'quantity_limit_item', 'merged duplicate lines');

  -- Blocked customer
  perform t.ok((t.po('0793 000 0001', 'baghdad', jsonb_build_array(t.item('rainbow-pop-it', 1))))->>'ok' = 'true', 'blocked: first order');
  update public.customers set is_blocked = true where phone = '07930000001';
  perform t.ok(t.po('0793 000 0001', 'baghdad', jsonb_build_array(t.item('peach-squishy', 1)))->>'error' = 'blocked', 'blocked customer refused');

  -- Large order → flagged + deposit
  update public.order_rules set large_order_value_iqd = 20000, deposit_required_above_iqd = 20000, deposit_percent = 30;
  r := t.po('0794 000 0001', 'baghdad', jsonb_build_array(t.item('large-teddy-plush', 2)));
  perform t.ok((r->>'ok')::boolean and (r->>'needs_review')::boolean, 'large order flagged: ' || r::text);
  perform t.ok((r->>'deposit_required')::boolean and (r->>'deposit_amount')::int = 13500, '30% of 45,000 = 13,500: ' || r::text);
  perform t.ok((select 'large_value' = any (flags) and status = 'pending' from public.orders where order_number = r->>'order_number'), 'large_value flag, pending');
  insert into t.state values ('order_deposit', r->>'order_number');
  update public.order_rules set large_order_value_iqd = 150000, deposit_required_above_iqd = 0;
  reset role;
end $$;

-- ---------- status workflow (as the signed-in admin) ----------
do $$
declare oid uuid; did uuid; sid uuid; st0 int; st1 int;
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
  set role authenticated;

  select id into oid from public.orders where order_number = (select v from t.state where k = 'order1');
  perform t.raises(format('update public.orders set status = ''processing'' where id = %L', oid), 'invalid_status_transition');
  perform t.raises(format('update public.orders set status = ''delivered'' where id = %L', oid), 'invalid_status_transition');
  perform t.raises(format('update public.orders set total_iqd = 1, subtotal_iqd = 1 where id = %L', oid), 'order_amounts_locked');
  update public.orders set status = 'confirmed' where id = oid;
  perform t.ok((select approved_at is not null and approved_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' from public.orders where id = oid), 'approval recorded');
  update public.orders set status = 'processing' where id = oid;
  update public.orders set status = 'shipped' where id = oid;
  update public.orders set status = 'delivered' where id = oid;
  perform t.ok((select delivered_at is not null and shipped_at is not null from public.orders where id = oid), 'timestamps');
  perform t.raises(format('update public.orders set status = ''pending'' where id = %L', oid), 'invalid_status_transition');
  perform t.ok((select count(*) from public.order_events where order_id = oid) = 5, 'status history logged');

  -- Deposit orders cannot be dispatched until the deposit is received
  select id into did from public.orders where order_number = (select v from t.state where k = 'order_deposit');
  update public.orders set status = 'confirmed' where id = did;
  perform t.raises(format('update public.orders set status = ''processing'' where id = %L', did), 'deposit_not_received');
  update public.orders set deposit_received = true where id = did;
  update public.orders set status = 'processing' where id = did;

  -- Cancelling gives the stock back
  select id into sid from public.orders where order_number = (select v from t.state where k = 'order_sale');
  select stock into st0 from public.products where slug = 'sprinkle-donut-squishy';
  update public.orders set status = 'cancelled' where id = sid;
  select stock into st1 from public.products where slug = 'sprinkle-donut-squishy';
  perform t.ok(st1 = st0 + 1, 'stock restored on cancel');
  perform t.raises(format('update public.orders set status = ''confirmed'' where id = %L', sid), 'invalid_status_transition');
  reset role;
end $$;

-- ---------- failed deliveries flag the customer ----------
do $$
declare r jsonb; oid uuid;
begin
  set role service_role;
  r := t.po('0795 000 0001', 'basra', jsonb_build_array(t.item('squeezy-stress-ball', 1)));
  perform t.ok((r->>'ok')::boolean, 'order for failed-delivery test');
  reset role;
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
  set role authenticated;
  select id into oid from public.orders where order_number = r->>'order_number';
  update public.orders set status = 'confirmed' where id = oid;
  update public.orders set status = 'processing' where id = oid;
  update public.orders set status = 'shipped' where id = oid;
  insert into public.delivery_attempts (order_id, outcome, reason) values (oid, 'failed', 'No answer');
  perform t.ok(not (select is_flagged from public.customers where phone = '07950000001'), 'one failure does not flag');
  insert into public.delivery_attempts (order_id, outcome, reason) values (oid, 'failed', 'Phone off');
  perform t.ok((select is_flagged from public.customers where phone = '07950000001'), 'two failures flag the customer');
  reset role;
  set role service_role;
  r := t.po('0795 000 0001', 'basra', jsonb_build_array(t.item('rainbow-spring-coil', 1)));
  perform t.ok((r->>'ok')::boolean and (r->>'needs_review')::boolean, 'flagged customer order needs review: ' || r::text);
  perform t.ok((select flags @> array['flagged_customer', 'failed_delivery_history'] from public.orders where order_number = r->>'order_number'), 'flags recorded');
  reset role;
end $$;

-- ---------- reviews ----------
do $$
declare r jsonb; n int; pid uuid;
begin
  select id into pid from public.products where slug = 'mini-mochi-squishy';
  set role service_role;
  r := public.submit_review(jsonb_build_object('product_id', pid, 'name', 'Layla', 'phone', '0770 123 4567', 'rating', 5, 'body', 'Super soft and cute!'));
  perform t.ok((r->>'ok')::boolean and (r->>'verified')::boolean, 'verified purchase (delivered order): ' || r::text);
  perform t.ok(public.submit_review(jsonb_build_object('product_id', pid, 'name', 'Layla', 'phone', '07701234567', 'rating', 4, 'body', 'again'))->>'error' = 'already_reviewed', 'one review per phone per product');
  perform t.ok(public.submit_review(jsonb_build_object('product_id', pid, 'name', 'Sara', 'phone', '0799 888 7777', 'rating', 6, 'body', 'nice'))->>'error' = 'invalid_rating', 'rating range');
  r := public.submit_review(jsonb_build_object('product_id', pid, 'name', 'Sara', 'phone', '0799 888 7777', 'rating', 4, 'body', 'Nice little toy'));
  perform t.ok((r->>'ok')::boolean and not (r->>'verified')::boolean, 'not verified without delivered order');
  reset role;

  set role anon;
  select count(*) into n from public.reviews;
  perform t.ok(n = 0, 'pending reviews are invisible to visitors');
  reset role;

  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
  set role authenticated;
  update public.reviews set status = 'approved' where reviewer_name = 'Layla';
  get diagnostics n = row_count;
  perform t.ok(n = 1, 'admin approved exactly one review, rows=' || n || ' admin=' || public.is_admin()::text || ' uid=' || coalesce(auth.uid()::text, 'null'));
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);   -- visitors carry no user identity

  set role anon;
  select count(*) into n from public.reviews;
  perform t.ok(n = 1, 'approved review visible, pending one still hidden');
  perform t.ok((select review_count = 1 and avg_rating = 5 from public.product_ratings where product_id = pid), 'rating aggregate');
  perform t.raises('select * from public.review_private', 'permission denied');
  reset role;
end $$;

-- ---------- order tracking ----------
do $$
declare r jsonb; num text;
begin
  select v into num from t.state where k = 'order1';
  set role service_role;
  r := public.track_order(lower(num), '+964 770 123 4567');
  perform t.ok((r->>'ok')::boolean and r->>'status' = 'delivered' and jsonb_array_length(r->'items') = 1, 'track with matching phone: ' || r::text);
  perform t.ok(public.track_order(num, '0771 111 2222')->>'error' = 'not_found', 'wrong phone');
  perform t.ok(public.track_order('HTW-000000-0000', '0770 123 4567')->>'error' = 'not_found', 'unknown order');
  reset role;
  set role anon;
  perform t.raises('select public.track_order(''x'', ''y'')', 'permission denied');
  reset role;
end $$;

-- ---------- Row Level Security ----------
do $$
declare n int;
begin
  -- Visitors
  set role anon;
  select count(*) into n from public.products;
  perform t.ok(n = 22, 'visitors can read the catalogue');
  select count(*) into n from public.delivery_fees;
  perform t.ok(n = 19, 'visitors can read delivery fees');
  perform t.ok((select whatsapp_number is null from public.store_settings), 'no WhatsApp number invented');
  perform t.raises('select count(*) from public.orders', 'permission denied');
  perform t.raises('select count(*) from public.order_items', 'permission denied');
  perform t.raises('select count(*) from public.customers', 'permission denied');
  perform t.raises('select count(*) from public.product_costs', 'permission denied');
  perform t.raises('select count(*) from public.order_rules', 'permission denied');
  perform t.raises('select count(*) from public.admin_users', 'permission denied');
  perform t.raises('select count(*) from public.order_events', 'permission denied');
  perform t.raises('select public.place_order(''{}''::jsonb)', 'permission denied');
  perform t.raises('select public.submit_review(''{}''::jsonb)', 'permission denied');
  perform t.raises('select public.admin_stats()', 'permission denied');
  perform t.raises('update public.products set price_iqd = 1', 'permission denied');
  perform t.raises('insert into public.orders (order_number) values (''x'')', 'permission denied');
  reset role;

  update public.products set is_active = false where slug = 'mini-mochi-squishy';
  set role anon;
  select count(*) into n from public.products where slug = 'mini-mochi-squishy';
  perform t.ok(n = 0, 'inactive products are hidden from visitors');
  reset role;
  update public.products set is_active = true where slug = 'mini-mochi-squishy';

  -- Signed in, but NOT an admin
  perform set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);
  set role authenticated;
  select count(*) into n from public.orders;           perform t.ok(n = 0, 'non-admin sees no orders');
  select count(*) into n from public.customers;        perform t.ok(n = 0, 'non-admin sees no customers');
  select count(*) into n from public.product_costs;   perform t.ok(n = 0, 'non-admin sees no costs');
  select count(*) into n from public.order_rules;      perform t.ok(n = 0, 'non-admin sees no fraud rules');
  select count(*) into n from public.admin_users;      perform t.ok(n = 0, 'non-admin sees no admin accounts');
  perform t.raises('insert into public.admin_users (user_id, email, role) values (gen_random_uuid(), ''x@y.z'', ''owner'')', 'row-level security');
  perform t.raises('insert into public.products (slug, category_id, name_en, name_ar, price_iqd) select ''hack'', id, ''x'', ''x'', 1 from public.categories limit 1', 'row-level security');
  update public.products set price_iqd = 1;            get diagnostics n = row_count; perform t.ok(n = 0, 'non-admin cannot change prices');
  update public.orders set status = 'confirmed';       get diagnostics n = row_count; perform t.ok(n = 0, 'non-admin cannot change orders');
  update public.store_settings set whatsapp_number = '9647701234567'; get diagnostics n = row_count; perform t.ok(n = 0, 'non-admin cannot change settings');
  perform t.raises('select public.admin_stats()', 'not_admin');
  reset role;

  -- Staff admin: can work, but cannot manage the team
  perform set_config('request.jwt.claim.sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
  set role authenticated;
  select count(*) into n from public.orders;       perform t.ok(n > 5, 'staff sees orders');
  select count(*) into n from public.admin_users;  perform t.ok(n = 2, 'staff sees the team');
  perform t.raises('insert into public.admin_users (user_id, email, role) values (''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'', ''x@y.z'', ''owner'')', 'row-level security');
  reset role;

  -- Owner admin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
  set role authenticated;
  update public.store_settings set whatsapp_number = '9647701234567';  get diagnostics n = row_count; perform t.ok(n = 1, 'admin sets WhatsApp number');
  perform t.raises('update public.store_settings set whatsapp_number = ''0770abc''', 'check constraint');
  update public.products set price_iqd = 5500 where slug = 'mini-mochi-squishy'; get diagnostics n = row_count; perform t.ok(n = 1, 'admin changes a price');
  update public.products set price_iqd = 5000 where slug = 'mini-mochi-squishy';
  update public.delivery_fees set fee_iqd = 9000 where code = 'baghdad'; get diagnostics n = row_count; perform t.ok(n = 1, 'admin changes a delivery fee');
  update public.delivery_fees set fee_iqd = 5000 where code = 'baghdad';
  select count(*) into n from public.product_costs;  perform t.ok(n = 22, 'admin reads costs');
  perform t.raises('update public.products set sale_price_iqd = price_iqd + 1 where slug = ''mini-mochi-squishy''', 'check constraint');
  reset role;
end $$;

-- ---------- dashboard numbers ----------
do $$
declare s jsonb;
begin
  perform set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
  set role authenticated;
  s := public.admin_stats();
  perform t.ok((s->>'total_orders')::int >= 8, 'total_orders: ' || s::text);
  perform t.ok((s->>'successful_deliveries')::int = 1, 'one delivered');
  perform t.ok((s->>'cancelled_orders')::int = 1, 'one cancelled');
  perform t.ok((s->>'total_sales_iqd')::int = 10000, 'sales = delivered product value');
  perform t.ok((s->>'gross_profit_iqd')::int = 4500, 'profit = (5,000 - 2,750) x 2');
  perform t.ok(jsonb_array_length(s->'monthly') = 1, 'monthly revenue row');
  perform t.ok(jsonb_array_length(s->'best_sellers') >= 1, 'best sellers');
  perform t.ok((s->>'pending_orders')::int >= 3, 'pending orders');
  reset role;
end $$;

\echo ALL DB ASSERTIONS PASSED
