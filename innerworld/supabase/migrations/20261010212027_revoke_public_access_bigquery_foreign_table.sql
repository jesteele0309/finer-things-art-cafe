-- The BigQuery foreign table bypasses RLS, so it must not be reachable with the
-- public or signed-in API roles. service_role keeps access.
revoke all on table public."The Finer Things" from anon, authenticated;
