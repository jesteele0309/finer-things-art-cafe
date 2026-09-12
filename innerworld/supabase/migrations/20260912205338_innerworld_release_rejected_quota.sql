-- A confirmed provider rejection must not consume a user's daily allowance.
-- Keep the request row so that retries with the same ID remain duplicates.
alter table iw_private.generation_requests
  add column if not exists released_at timestamptz;

create or replace function public.iw_release_rejected_request(
  p_uid uuid, p_kind text, p_request uuid
) returns boolean language plpgsql security definer set search_path='' as $$
declare charged_day date;
begin
  if p_uid is null or p_request is null or p_kind is null
     or p_kind not in ('image','reflection') then
    raise exception 'invalid request';
  end if;
  -- Use the same lock as reservation to serialize counters for this owner/kind.
  perform pg_advisory_xact_lock(hashtextextended(p_uid::text||':'||p_kind,0));
  update iw_private.generation_requests set released_at=now()
    where user_id=p_uid and kind=p_kind and request_id=p_request
      and released_at is null
    returning usage_date into charged_day;
  if charged_day is null then return false; end if;
  update public.iw_request_usage set used=greatest(used-1,0)
    where user_id=p_uid and kind=p_kind and day=charged_day;
  return true;
end;
$$;
revoke all on function public.iw_release_rejected_request(uuid,text,uuid)
  from public,anon,authenticated;
grant execute on function public.iw_release_rejected_request(uuid,text,uuid)
  to service_role;
