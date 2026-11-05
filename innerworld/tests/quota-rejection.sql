-- Run with an explicitly disposable account. All changes are rolled back.
begin;
do $$
declare u uuid; a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); result jsonb;
begin
  select id into u from auth.users
    where raw_user_meta_data->>'innerworld_acceptance'='true' limit 1;
  if u is null then raise exception 'Disposable acceptance account required'; end if;
  delete from public.iw_request_usage where user_id=u and kind='image';
  result:=public.iw_reserve_request(u,'image',a);
  assert (result->>'allowed')::boolean,'Initial reservation';
  result:=public.iw_reserve_request(u,'image',b);
  assert not (result->>'allowed')::boolean,'Free daily limit enforced';
  assert not public.iw_release_rejected_request(u,'reflection',a),'Wrong kind cannot refund';
  assert not public.iw_release_rejected_request(gen_random_uuid(),'image',a),'Wrong owner cannot refund';
  assert public.iw_release_rejected_request(u,'image',a),'Rejected request restored';
  assert not public.iw_release_rejected_request(u,'image',a),'Repeated release is a no-op';
  result:=public.iw_reserve_request(u,'image',a);
  assert (result->>'duplicate')::boolean,'Released ID still blocks a duplicate';
  result:=public.iw_reserve_request(u,'image',b);
  assert (result->>'allowed')::boolean and (result->>'used')::integer=1,'New request can use restored allowance';
  insert into iw_private.limit_overrides(user_id,image_limit,note)
    values(u,0,'zero-limit regression')
    on conflict(user_id) do update set image_limit=0;
  delete from public.iw_request_usage where user_id=u and kind='image';
  result:=public.iw_reserve_request(u,'image',c);
  assert not (result->>'allowed')::boolean and (result->>'limit')::integer=0,'Zero limit rejects initial reservation';
  assert not exists(select 1 from public.iw_request_usage
    where user_id=u and kind='image' and day=(now() at time zone 'UTC')::date),
    'Zero limit does not insert usage';
  assert not has_function_privilege('anon','public.iw_release_rejected_request(uuid,text,uuid)','execute'),'Anonymous cannot release quota';
  assert not has_function_privilege('authenticated','public.iw_release_rejected_request(uuid,text,uuid)','execute'),'Browser accounts cannot release quota';
  assert has_function_privilege('service_role','public.iw_release_rejected_request(uuid,text,uuid)','execute'),'Server can release quota';
end $$;
select '11 quota rejection checks passed; fixtures rolled back' as result;
rollback;
