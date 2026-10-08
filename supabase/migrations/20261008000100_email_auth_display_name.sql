-- Email login: new accounts can pick the name shown next to their notes.
--
-- The app passes it as user metadata at sign-up (supabase.auth.signUp options.data.display_name).
-- Anything else (no name given) shows as "A parent". We deliberately never derive a public name
-- from the email address, because notes are visible to everyone.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(btrim(left(new.raw_user_meta_data ->> 'display_name', 40)), '');
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(v_name, 'A parent'))
  on conflict (id) do nothing;
  return new;
end;
$$;
