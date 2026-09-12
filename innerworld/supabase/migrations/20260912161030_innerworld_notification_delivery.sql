-- INNERWORLD notification delivery. No journal text enters the delivery queue.
create table if not exists iw_private.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  daily_time time,
  timezone text not null default 'UTC',
  collaboration boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists iw_push_user_idx on iw_private.push_subscriptions(user_id);
alter table iw_private.push_subscriptions enable row level security;
revoke all on iw_private.push_subscriptions from public,anon,authenticated;

create table if not exists iw_private.push_jobs (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references iw_private.push_subscriptions(id) on delete cascade,
  dedupe_key text not null,
  href text not null,
  kind text not null check(kind in ('daily','collaboration','test')),
  state text not null default 'pending' check(state in ('pending','sent','failed')),
  attempts integer not null default 0,
  lease_id uuid,
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(subscription_id,dedupe_key)
);
create index if not exists iw_push_pending_idx on iw_private.push_jobs(available_at) where state='pending';
alter table iw_private.push_jobs enable row level security;
revoke all on iw_private.push_jobs from public,anon,authenticated;

create or replace function public.iw_push_save(p_subscription jsonb,p_time text default null,p_timezone text default 'UTC',p_collaboration boolean default true)
returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); ep text:=p_subscription->>'endpoint'; i uuid; tm time;
begin
 if u is null then raise exception 'Sign in first';end if;
 if p_subscription is null or pg_column_size(p_subscription)>5000 or ep is null or length(ep)>2048 or ep !~ '^https://(fcm[.]googleapis[.]com|updates[.]push[.]services[.]mozilla[.]com|web[.]push[.]apple[.]com|[a-z0-9-]+[.]notify[.]windows[.]com)/' or coalesce(p_subscription#>>'{keys,p256dh}','') !~ '^[A-Za-z0-9_-]{87}=?$' or coalesce(p_subscription#>>'{keys,auth}','') !~ '^[A-Za-z0-9_-]{22}==?$|^[A-Za-z0-9_-]{22}$' then raise exception 'Unsupported push subscription';end if;
 if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'Invalid timezone';end if;
 if p_time is not null then if p_time !~ '^[0-2][0-9]:[0-5][0-9]$' then raise exception 'Invalid reminder time';end if;tm:=p_time::time;end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text||':push',0));
 select id into i from iw_private.push_subscriptions where endpoint=ep and user_id=u;
 if i is null and (select count(*) from iw_private.push_subscriptions where user_id=u)>=5 then raise exception 'Remove a device before adding more than five';end if;
 insert into iw_private.push_subscriptions(user_id,endpoint,subscription,daily_time,timezone,collaboration)
 values(u,ep,jsonb_build_object('endpoint',ep,'keys',p_subscription->'keys'),tm,p_timezone,coalesce(p_collaboration,false))
 on conflict(endpoint) do update set subscription=excluded.subscription,daily_time=excluded.daily_time,timezone=excluded.timezone,collaboration=excluded.collaboration,updated_at=now()
 where iw_private.push_subscriptions.user_id=u returning id into i;
 if i is null then raise exception 'This device is linked to another account. Disable its previous notifications first';end if;
 delete from iw_private.push_jobs where subscription_id=i and state='pending';
 return i;
end $$;

create or replace function public.iw_push_status(p_endpoint text)
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('dailyTime',to_char(daily_time,'HH24:MI'),'timezone',timezone,'collaboration',collaboration)
 from iw_private.push_subscriptions where user_id=(select auth.uid()) and endpoint=p_endpoint;
$$;
create or replace function public.iw_push_remove(p_endpoint text)
returns void language sql security definer set search_path='' as $$
 delete from iw_private.push_subscriptions where user_id=(select auth.uid()) and endpoint=p_endpoint;
$$;
create or replace function public.iw_push_test(p_endpoint text)
returns void language plpgsql security definer set search_path='' as $$
declare i uuid;
begin
 select id into i from iw_private.push_subscriptions where user_id=auth.uid() and endpoint=p_endpoint;
 if i is null then raise exception 'Enable notifications on this device first';end if;
 insert into iw_private.push_jobs(subscription_id,dedupe_key,href,kind)
 values(i,'test:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24MI'),'#notifications','test') on conflict do nothing;
end $$;

create or replace function public.iw_push_claim()
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 insert into iw_private.push_jobs(subscription_id,dedupe_key,href,kind)
 select s.id,'notice:'||n.id,case when n.action_href ~ '^#between/[a-f0-9-]{36}$' then n.action_href else '#notifications' end,'collaboration'
 from iw_private.push_subscriptions s join public.iw_notifications n on n.user_id=s.user_id
 where s.collaboration and n.read_at is null and n.created_at>=greatest(s.created_at,now()-interval '24 hours')
 on conflict do nothing;
 insert into iw_private.push_jobs(subscription_id,dedupe_key,href,kind)
 select s.id,'daily:'||((now() at time zone s.timezone)::date)::text,'#today','daily'
 from iw_private.push_subscriptions s where s.daily_time is not null
 and (now() at time zone s.timezone)::time >= s.daily_time
 and (now() at time zone s.timezone) < (now() at time zone s.timezone)::date + s.daily_time + interval '15 minutes'
 on conflict do nothing;
 with due as (
  select id from iw_private.push_jobs where state='pending' and available_at<=now() and attempts<5 order by available_at limit 20 for update skip locked
 ), claimed as (
  update iw_private.push_jobs j set lease_id=gen_random_uuid(),attempts=attempts+1,available_at=now()+interval '5 minutes'
  from due where j.id=due.id returning j.*
 ) select coalesce(jsonb_agg(jsonb_build_object('id',j.id,'lease',j.lease_id,'kind',j.kind,'href',j.href,'subscription',s.subscription)),'[]'::jsonb) into result
 from claimed j join iw_private.push_subscriptions s on s.id=j.subscription_id;
 delete from iw_private.push_jobs where created_at<now()-interval '7 days';
 return result;
end $$;
create or replace function public.iw_push_finish(p_id uuid,p_lease uuid,p_status text)
returns void language plpgsql security definer set search_path='' as $$
declare i uuid;
begin
 if p_status not in ('sent','retry','gone','invalid') then raise exception 'Invalid outcome';end if;
 if p_status='gone' then
  select subscription_id into i from iw_private.push_jobs where id=p_id and lease_id=p_lease;
  delete from iw_private.push_subscriptions where id=i;
 else
  update iw_private.push_jobs set state=case when p_status='sent' then 'sent' when attempts>=5 or p_status='invalid' then 'failed' else 'pending' end,
  lease_id=null,available_at=now()+interval '5 minutes' where id=p_id and lease_id=p_lease;
 end if;
end $$;

revoke all on function public.iw_push_save(jsonb,text,text,boolean), public.iw_push_status(text), public.iw_push_remove(text),public.iw_push_test(text) from public,anon;
grant execute on function public.iw_push_save(jsonb,text,text,boolean), public.iw_push_status(text), public.iw_push_remove(text),public.iw_push_test(text) to authenticated;
revoke all on function public.iw_push_claim(),public.iw_push_finish(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.iw_push_claim(),public.iw_push_finish(uuid,uuid,text) to service_role;

-- A launch flag alone cannot make a test-account Stripe sync accept live purchases.
create or replace function public.iw_billing_ready()
returns boolean language sql security definer set search_path='' as $$
 select coalesce((select
  exists(select 1 from stripe._managed_webhooks w where w.account_id=c.value->>'account' and w.livemode=true and w.status='enabled'
    and w.enabled_events ? 'checkout.session.completed' and w.enabled_events ? 'customer.subscription.updated' and w.enabled_events ? 'customer.subscription.deleted')
  and exists(select 1 from stripe.prices p where p._account_id=c.value->>'account' and p.id=c.value->>'monthly' and p.livemode=true and p.active=true and p.currency='usd' and p.unit_amount=1200 and p.recurring->>'interval'='month')
  and exists(select 1 from stripe.prices p where p._account_id=c.value->>'account' and p.id=c.value->>'annual' and p.livemode=true and p.active=true and p.currency='usd' and p.unit_amount=12000 and p.recurring->>'interval'='year')
 from iw_private.release_config c where c.key='billing'),false);
$$;
revoke all on function public.iw_billing_ready() from public,anon,authenticated;
grant execute on function public.iw_billing_ready() to service_role;

-- A stale device is a client conflict, not a retryable serialization failure.
CREATE OR REPLACE FUNCTION public.iw_save_studio(p_document jsonb, p_revision bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$declare u uuid:=auth.uid();r bigint;x jsonb;c jsonb;ids uuid[];t text;begin if u is null then raise exception 'authentication required';end if;if p_document is null or p_revision is null or jsonb_typeof(p_document) is distinct from 'object' or pg_column_size(p_document)>2000000 or jsonb_typeof(p_document->'pieces') is distinct from 'array' or jsonb_typeof(p_document->'chapters') is distinct from 'array' or jsonb_array_length(p_document->'pieces')>400 or jsonb_array_length(p_document->'chapters')>100 then raise exception 'invalid snapshot';end if;insert into public.iw_studio_snapshots(user_id) values(u) on conflict do nothing;select revision into r from public.iw_studio_snapshots where user_id=u for update;if r<>p_revision then raise exception 'CLOUD_CONFLICT: download latest cloud collection before uploading' using errcode='PT409';end if;for x in select value from jsonb_array_elements(p_document->'pieces') loop if length(x->>'title')>160 or length(x->>'note')>12000 or x ? 'image' then raise exception 'invalid piece metadata';end if;if nullif(x->>'imagePath','') is not null and split_part(x->>'imagePath','/',1)<>u::text then raise exception 'invalid private image path';end if;if exists(select 1 from public.iw_pieces where id=(x->>'id')::uuid and user_id<>u) then raise exception 'piece ownership mismatch';end if;t:=case x->>'theme' when 'relationships' then 'connection' when 'boundaries' then 'space' else x->>'theme' end;insert into public.iw_pieces(id,user_id,piece_date,theme,title,line,reflection,invitation,scene_prompt,image_path,image_provider,image_model,private_note,appearance_feedback,resonance_feedback,why_this,generation_context) values((x->>'id')::uuid,u,(x->>'date')::date,t,x->>'title',coalesce(x->>'line',''),coalesce(x->>'reflection',''),coalesce(x->>'invitation',''),coalesce(x->>'scene',''),nullif(x->>'imagePath',''),case when x->>'kind'='ai' then 'openai' else null end,x->>'imageModel',coalesce(x->>'note',''),case x->>'look' when 'Love it' then 'love' when 'Not for me' then 'not_my_taste' else null end,case x->>'fit' when 'Yes' then 'yes' when 'Not really' then 'not_really' when 'Different' then 'different' else null end,jsonb_build_object('explanation',x->>'why'),x) on conflict(id) do update set title=excluded.title,line=excluded.line,reflection=excluded.reflection,invitation=excluded.invitation,scene_prompt=excluded.scene_prompt,image_path=excluded.image_path,image_model=excluded.image_model,private_note=excluded.private_note,appearance_feedback=excluded.appearance_feedback,resonance_feedback=excluded.resonance_feedback,why_this=excluded.why_this,generation_context=excluded.generation_context,updated_at=now();end loop;select coalesce(array_agg((value->>'id')::uuid),'{}'::uuid[]) into ids from jsonb_array_elements(p_document->'pieces');delete from public.iw_pieces where user_id=u and not(id=any(ids));delete from public.iw_chapters where user_id=u;for c in select value from jsonb_array_elements(p_document->'chapters') loop if length(c->>'title')>120 or length(c->>'description')>2000 then raise exception 'invalid chapter';end if;insert into public.iw_chapters(id,user_id,title,description) values((c->>'id')::uuid,u,c->>'title',coalesce(c->>'description',''));insert into public.iw_chapter_pieces(chapter_id,piece_id,position) select (c->>'id')::uuid,v::uuid,n::integer from jsonb_array_elements_text(c->'ids') with ordinality z(v,n) where v::uuid=any(ids);end loop;update public.iw_studio_snapshots set document=p_document,revision=r+1,updated_at=now() where user_id=u;return r+1;end$function$;

-- Edits to an outdated collaboration scene are also HTTP 409 conflicts.
CREATE OR REPLACE FUNCTION public.iw_space_prompt_checked(p_space uuid, p_version integer, p_prompt text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 perform 1 from public.iw_relationship_spaces
 where id=p_space and prompt_version=p_version for update;
 if not found then
  raise exception 'scene changed; refresh before saving' using errcode='PT409';
 end if;
 perform public.iw_space_prompt(p_space,p_prompt);
end
$function$;
