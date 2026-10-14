-- Per-account daily limits that replace the plan defaults (e.g. for the owner).
-- Lives in iw_private: not exposed through the Data API, and only reachable
-- through the security-definer iw_reserve_request below.
-- Override rows are production data and are not stored in this repo; add one with:
--   insert into iw_private.limit_overrides (user_id, image_limit, reflection_limit, note)
--   values ('<auth user id>', 100, 300, 'owner');
create table if not exists iw_private.limit_overrides (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  image_limit      integer check (image_limit >= 0),
  reflection_limit integer check (reflection_limit >= 0),
  note             text,
  updated_at       timestamptz not null default now()
);
alter table iw_private.limit_overrides enable row level security;
revoke all on table iw_private.limit_overrides from public, anon, authenticated;

-- Same as before, except an override row (when present) replaces the plan limit.
create or replace function public.iw_reserve_request(p_uid uuid, p_kind text, p_request uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$ declare sub public.iw_subscriptions;lim integer;n integer;v_day date:=(now() at time zone 'UTC')::date;paid boolean;ov integer;begin if p_uid is null or p_request is null or p_kind is null or p_kind not in ('image','reflection') then raise exception 'invalid request';end if;perform pg_advisory_xact_lock(hashtextextended(p_uid::text||':'||p_kind,0));if exists(select 1 from iw_private.generation_requests where user_id=p_uid and kind=p_kind and request_id=p_request) then return jsonb_build_object('allowed',false,'duplicate',true);end if;sub:=public.refresh_innerworld_subscription_for_user(p_uid);paid:=sub.plan in ('monthly','annual') and sub.status in ('active','trialing') and sub.current_period_end>now();lim:=case when p_kind='image' then case when paid then 10 else 1 end else case when paid then 30 else 4 end end;select case when p_kind='image' then o.image_limit else o.reflection_limit end into ov from iw_private.limit_overrides o where o.user_id=p_uid;if ov is not null then lim:=ov;end if;insert into public.iw_request_usage(user_id,day,kind,used) values(p_uid,v_day,p_kind,1) on conflict(user_id,day,kind) do update set used=public.iw_request_usage.used+1 where public.iw_request_usage.used<lim returning used into n;if n is null then return jsonb_build_object('allowed',false,'duplicate',false,'used',lim,'limit',lim);end if;insert into iw_private.generation_requests(user_id,kind,request_id,usage_date) values(p_uid,p_kind,p_request,v_day);return jsonb_build_object('allowed',true,'duplicate',false,'used',n,'limit',lim);end$function$;
