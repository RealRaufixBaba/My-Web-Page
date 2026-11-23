create extension if not exists pgcrypto;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  ip text
);

create index if not exists messages_created_at_idx on public.messages (created_at desc);
create index if not exists messages_ip_idx on public.messages (ip, created_at desc);

alter table public.messages enable row level security;

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select using (true);

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated with check (auth.uid() = user_id);

create or replace function public.chat_guard() returns trigger
language plpgsql security definer set search_path = public as $guard$
declare
  recent integer;
  per_minute integer;
  dup integer;
  links integer;
  hdr json;
begin
  new.user_id := auth.uid();
  if new.user_id is null then
    raise exception 'giris gerekli';
  end if;
  new.name := btrim(regexp_replace(coalesce(new.name, ''), '[[:cntrl:]]', '', 'g'));
  new.body := btrim(regexp_replace(coalesce(new.body, ''), '[[:cntrl:]]', '', 'g'));
  if char_length(new.name) < 2 or char_length(new.name) > 24 then
    raise exception 'isim uzunlugu';
  end if;
  if char_length(new.body) < 2 or char_length(new.body) > 220 then
    raise exception 'mesaj uzunlugu';
  end if;
  if new.body ~ '(.)\1{9,}' then
    raise exception 'spam tekrar';
  end if;
  if new.name ~* 'https?://' then
    raise exception 'isimde link';
  end if;
  links := coalesce((select count(*) from regexp_matches(new.body, 'https?://', 'g')), 0);
  if links > 1 then
    raise exception 'cok fazla link';
  end if;
  select count(*) into recent from public.messages
    where user_id = new.user_id and created_at > now() - interval '9 seconds';
  if recent > 0 then
    raise exception 'cok hizli';
  end if;
  select count(*) into per_minute from public.messages
    where user_id = new.user_id and created_at > now() - interval '1 minute';
  if per_minute >= 5 then
    raise exception 'dakika limiti';
  end if;
  select count(*) into dup from public.messages
    where user_id = new.user_id and body = new.body and created_at > now() - interval '5 minutes';
  if dup > 0 then
    raise exception 'tekrar mesaj';
  end if;
  begin
    hdr := current_setting('request.headers', true)::json;
    new.ip := split_part(coalesce(hdr->>'x-forwarded-for', ''), ',', 1);
  exception when others then
    new.ip := null;
  end;
  if new.ip is not null and new.ip <> '' then
    select count(*) into per_minute from public.messages
      where ip = new.ip and created_at > now() - interval '1 minute';
    if per_minute >= 8 then
      raise exception 'dakika limiti';
    end if;
  end if;
  return new;
end;
$guard$;

drop trigger if exists chat_guard_trg on public.messages;
create trigger chat_guard_trg before insert on public.messages
  for each row execute function public.chat_guard();

revoke update, delete on public.messages from anon, authenticated;
grant select on public.messages to anon, authenticated;
grant insert on public.messages to authenticated;
