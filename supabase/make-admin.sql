-- =====================================================================
-- Create your first administrator (owner)
--
-- 1. Supabase dashboard → Authentication → Users → "Add user" → "Create new user".
--    Enter your email and a STRONG password, and tick "Auto Confirm User".
-- 2. Replace YOU@EXAMPLE.COM below with that same email and run this file in the SQL Editor.
-- 3. Sign in at  https://YOUR-SITE/admin/login
--
-- Afterwards you can add staff accounts from the dashboard (Team page).
-- Also recommended: Authentication → Providers → Email → turn OFF "Allow new users to sign up",
-- so that nobody else can create an account on your project.
-- =====================================================================
insert into public.admin_users (user_id, email, role)
select id, email, 'owner'
from auth.users
where email = 'YOU@EXAMPLE.COM'
on conflict (user_id) do update set role = 'owner';

-- Check: this should return one row.
select user_id, email, role from public.admin_users;
