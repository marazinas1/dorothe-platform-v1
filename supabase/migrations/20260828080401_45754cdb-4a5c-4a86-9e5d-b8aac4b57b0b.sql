REVOKE EXECUTE ON FUNCTION public.is_developer() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_owner_or_above() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_profile(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_developer() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_owner_or_above() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_profile(uuid) TO authenticated, service_role;
COMMENT ON FUNCTION public.can_manage_profile(uuid) IS 'Caller-scoped guard: true when the signed-in staff member may manage the target profile. Definer because it reads profiles.role, which is not readable by the caller.';