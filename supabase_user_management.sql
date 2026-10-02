-- =====================================================================
-- ScooterLink POS - User Management & Role Hardening
-- Jalankan file ini di Supabase SQL Editor SETELAH supabase_schema.sql.
-- Aman dijalankan ulang (idempotent).
-- =====================================================================

-- 1. Backfill: pastikan setiap user auth punya baris di profiles
insert into public.profiles (id, email, role)
select u.id, u.email, 'kasir'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- 2. Helper: apakah user yang sedang login adalah admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. RLS profiles: user hanya bisa membaca profilnya sendiri, admin bisa membaca semua.
--    Tidak ada policy insert/update/delete -> perubahan hanya lewat fungsi admin di bawah,
--    sehingga kasir/gudang tidak bisa mengubah role-nya sendiri lewat API.
drop policy if exists "Auth users full access" on public.profiles;
drop policy if exists "Profiles read own or admin" on public.profiles;
create policy "Profiles read own or admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- 4. Admin: buat user baru (langsung aktif, tanpa konfirmasi email)
create or replace function public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role public.user_role
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh menambah user';
  end if;

  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Format email tidak valid';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password minimal 6 karakter';
  end if;

  if p_role is null then
    raise exception 'Role wajib diisi';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email % sudah terdaftar', v_email;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email, extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', nullif(trim(p_full_name), '')),
    now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id, v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  -- Trigger on_auth_user_created sudah membuat profil (role kasir); set role sesuai pilihan admin.
  insert into public.profiles (id, email, full_name, role)
  values (v_user_id, v_email, nullif(trim(p_full_name), ''), p_role)
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role;

  return v_user_id;
end;
$$;

-- 5. Admin: ubah nama & role user
create or replace function public.admin_update_user(
  p_user_id uuid,
  p_full_name text,
  p_role public.user_role
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_role public.user_role;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh mengubah user';
  end if;

  if p_role is null then
    raise exception 'Role wajib diisi';
  end if;

  select role into v_current_role from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'User tidak ditemukan';
  end if;

  -- Jangan sampai tidak ada admin sama sekali
  if v_current_role = 'admin' and p_role <> 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Tidak bisa mengubah role: minimal harus ada 1 admin';
  end if;

  update public.profiles
  set full_name = nullif(trim(p_full_name), ''),
      role = p_role
  where id = p_user_id;
end;
$$;

-- 6. Admin: reset password user
create or replace function public.admin_reset_password(
  p_user_id uuid,
  p_password text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh reset password';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password minimal 6 karakter';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'User tidak ditemukan';
  end if;
end;
$$;

-- 7. Hak eksekusi: hanya user yang sudah login (pengecekan admin ada di dalam fungsi)
revoke all on function public.is_admin() from public, anon;
revoke all on function public.admin_create_user(text, text, text, public.user_role) from public, anon;
revoke all on function public.admin_update_user(uuid, text, public.user_role) from public, anon;
revoke all on function public.admin_reset_password(uuid, text) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_create_user(text, text, text, public.user_role) to authenticated;
grant execute on function public.admin_update_user(uuid, text, public.user_role) to authenticated;
grant execute on function public.admin_reset_password(uuid, text) to authenticated;

-- 8. Jadikan akun Anda admin (ganti email lalu jalankan baris ini sekali):
-- update public.profiles set role = 'admin' where email = 'email-anda@gmail.com';
