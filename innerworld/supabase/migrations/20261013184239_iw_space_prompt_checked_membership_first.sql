-- Check membership before the version lookup so non-members get the same
-- 'invalid shared scene' error as iw_space_prompt, instead of a 'scene changed'
-- error that reveals whether a space id and version exist.
create or replace function public.iw_space_prompt_checked(p_space uuid, p_version integer, p_prompt text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
 if not exists (select 1 from public.iw_relationship_members
                where space_id = p_space and user_id = auth.uid() and revoked_at is null) then
  raise exception 'invalid shared scene';
 end if;
 perform 1 from public.iw_relationship_spaces
 where id=p_space and prompt_version=p_version for update;
 if not found then
  raise exception 'scene changed; refresh before saving' using errcode='PT409';
 end if;
 perform public.iw_space_prompt(p_space,p_prompt);
end
$function$;
