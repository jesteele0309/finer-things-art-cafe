-- Run only with a disposable auth account marked innerworld_acceptance=true.
-- This exercises SQL reconciliation with synthetic records, not Stripe delivery.
-- Every change is rolled back; no request is made to Stripe and no charge occurs.
begin;
do $$
declare
 u uuid; email text; cfg jsonb; acct text:='acct_iw_test_'||replace(gen_random_uuid()::text,'-','');
 cs text:='cs_iw_'||replace(gen_random_uuid()::text,'-','');
 sub text:='sub_iw_'||replace(gen_random_uuid()::text,'-','');
 customer text:='cus_iw_'||replace(gen_random_uuid()::text,'-','');
 s public.iw_subscriptions; expires bigint:=extract(epoch from now()+interval '30 days')::bigint;
begin
 select id,lower(auth.users.email) into u,email from auth.users
 where raw_user_meta_data->>'innerworld_acceptance'='true' and email_confirmed_at is not null limit 1;
 if u is null then raise exception 'Disposable acceptance account required';end if;
 cfg:=jsonb_build_object('account',acct,'monthly','price_iw_monthly','annual','price_iw_annual');
 update iw_private.release_config set value=cfg where key='billing';
 insert into stripe.accounts(_raw_data) values(jsonb_build_object('id',acct,'object','account'));
 insert into stripe.subscriptions(_account_id,_raw_data) values(acct,jsonb_build_object(
  'id',sub,'object','subscription','customer',customer,'livemode',true,'status','active',
  'current_period_end',expires,'cancel_at_period_end',false,
  'items',jsonb_build_object('data',jsonb_build_array(jsonb_build_object('price',jsonb_build_object('id','price_iw_monthly'))))));
 insert into stripe.checkout_sessions(_account_id,_raw_data) values(acct,jsonb_build_object(
  'id',cs,'object','checkout.session','subscription',sub,'customer',customer,'client_reference_id',u::text,
  'livemode',true,'mode','subscription','status','complete','payment_status','paid',
  'customer_details',jsonb_build_object('email',email)));
 s:=public.refresh_innerworld_subscription_for_user(u);
 assert s.plan='monthly' and s.status='active','Purchase activation';
 update stripe.subscriptions set _raw_data=jsonb_set(_raw_data,'{current_period_end}',to_jsonb(expires+2592000)) where id=sub;
 s:=public.refresh_innerworld_subscription_for_user(u);
 assert extract(epoch from s.current_period_end)=expires+2592000,'Renewal extends access';
 update stripe.subscriptions set _raw_data=jsonb_set(_raw_data,'{cancel_at_period_end}','true') where id=sub;
 s:=public.refresh_innerworld_subscription_for_user(u);
 assert s.plan='monthly' and s.cancel_at_period_end,'Cancellation preserves paid period';
 update stripe.subscriptions set _raw_data=jsonb_set(_raw_data,'{status}','"past_due"') where id=sub;
 s:=public.refresh_innerworld_subscription_for_user(u);
 assert s.plan='free','Payment failure removes entitlement';
 update stripe.subscriptions set _raw_data=jsonb_set(_raw_data,'{status}','"canceled"') where id=sub;
 s:=public.refresh_innerworld_subscription_for_user(u);
 assert s.plan='free','Canceled subscription removes entitlement';
 update stripe.subscriptions set _raw_data=jsonb_set(_raw_data,'{status}','"active"') where id=sub;
 update stripe.checkout_sessions set _raw_data=jsonb_set(_raw_data,'{customer_details,email}','"someone_else@example.invalid"') where id=cs;
 s:=public.refresh_innerworld_subscription_for_user(u);
 assert s.plan='free','Mismatched verified email rejects entitlement';
 update stripe.checkout_sessions set _raw_data=jsonb_set(_raw_data,'{customer_details,email}',to_jsonb(email)) where id=cs;
 update stripe.subscriptions set _raw_data=jsonb_set(_raw_data,'{items,data,0,price,id}','"price_unapproved"') where id=sub;
 s:=public.refresh_innerworld_subscription_for_user(u);
 assert s.plan='free','Unapproved price rejects entitlement';
 assert public.iw_billing_ready()=false,'Synthetic or unconfigured sync cannot enable checkout';
end $$;
select '8 SQL reconciliation checks passed; all fixtures rolled back' as result;
rollback;
