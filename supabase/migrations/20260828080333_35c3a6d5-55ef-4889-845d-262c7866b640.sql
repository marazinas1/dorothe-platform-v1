-- 1. Promote the single remaining account to the new top tier before the
--    role vocabulary narrows. Triggers are paused because the old rules
--    treat any demotion of the last owner as fatal.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.user_invitations DROP CONSTRAINT IF EXISTS user_invitations_role_check;
ALTER TABLE public.profiles DISABLE TRIGGER profiles_enforce_role_integrity;
ALTER TABLE public.profiles DISABLE TRIGGER profiles_protect_last_owner_upd;
UPDATE public.profiles SET role = 'developer' WHERE role = 'owner';
ALTER TABLE public.profiles ENABLE TRIGGER profiles_enforce_role_integrity;
ALTER TABLE public.profiles ENABLE TRIGGER profiles_protect_last_owner_upd;

-- 2. Narrow the role vocabulary.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('developer', 'owner', 'editor'));

ALTER TABLE public.user_invitations
  ADD CONSTRAINT user_invitations_role_check
  CHECK (role IN ('developer', 'owner', 'editor'));

-- 3. Role helpers.
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(ARRAY['developer']) $$;

CREATE OR REPLACE FUNCTION public.is_owner_or_above()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(ARRAY['developer','owner']) $$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(ARRAY['developer','owner','editor']) $$;

CREATE OR REPLACE FUNCTION public.can_manage_profile(_target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT public.is_developer()
     OR (public.is_owner_or_above()
         AND COALESCE((SELECT role FROM public.profiles WHERE id = _target), '') <> 'developer')
$$;

-- 4. Permission matrix for the three roles only.
DELETE FROM public.role_permissions;
INSERT INTO public.role_permissions (role, permission_key, granted)
SELECT r.role, k.permission_key, true
FROM (VALUES ('developer'), ('owner')) AS r(role),
     (VALUES
       ('listing.create'), ('listing.edit.own'), ('listing.edit.any'),
       ('listing.publish'), ('listing.status.change'), ('listing.delete'),
       ('inquiry.view.own'), ('inquiry.view.any'), ('inquiry.assign'),
       ('inquiry.delete'),
       ('settings.edit'), ('design.edit'), ('content.edit'),
       ('user.manage'), ('analytics.view.own'), ('analytics.view.any')
     ) AS k(permission_key);

INSERT INTO public.role_permissions (role, permission_key, granted)
SELECT 'editor', k.permission_key, true
FROM (VALUES
       ('listing.create'), ('listing.edit.own'), ('listing.edit.any'),
       ('listing.publish'), ('listing.status.change'),
       ('inquiry.view.own'), ('inquiry.view.any'), ('inquiry.assign'),
       ('analytics.view.own')
     ) AS k(permission_key);

-- 5. Developer is an unconditional superuser for permission checks.
CREATE OR REPLACE FUNCTION public.current_user_has_permission(_key text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_active boolean;
  v_override boolean;
  v_granted boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  SELECT role, is_active INTO v_role, v_active
    FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NULL OR NOT COALESCE(v_active, false) THEN RETURN false; END IF;

  IF v_role = 'developer' THEN RETURN true; END IF;

  SELECT granted INTO v_override
    FROM public.permissions
    WHERE profile_id = auth.uid() AND permission_key = _key;
  IF FOUND THEN RETURN v_override; END IF;

  SELECT granted INTO v_granted
    FROM public.role_permissions
    WHERE role = v_role AND permission_key = _key;
  RETURN COALESCE(v_granted, false);
END;
$$;

-- 6. Role integrity for the new hierarchy.
CREATE OR REPLACE FUNCTION public.profiles_enforce_role_integrity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  caller_role text;
  role_changed boolean;
  active_changed boolean;
  self_update boolean;
  restricted_changed boolean;
BEGIN
  role_changed := NEW.role IS DISTINCT FROM OLD.role;
  active_changed := NEW.is_active IS DISTINCT FROM OLD.is_active;
  self_update := auth.uid() = OLD.id;
  caller_role := public.current_user_role();

  IF self_update AND caller_role IS DISTINCT FROM 'developer' THEN
    restricted_changed :=
      (NEW.show_on_website IS DISTINCT FROM OLD.show_on_website)
      OR (NEW.sort_order IS DISTINCT FROM OLD.sort_order)
      OR (NEW.email IS DISTINCT FROM OLD.email);
    IF restricted_changed AND caller_role IS DISTINCT FROM 'owner' THEN
      RAISE EXCEPTION 'You may not change show_on_website, sort_order, or email on your own profile';
    END IF;
  END IF;

  IF NOT role_changed AND NOT active_changed THEN
    RETURN NEW;
  END IF;

  -- Only a developer may touch a developer row, or grant/revoke that role.
  IF (OLD.role = 'developer' OR NEW.role = 'developer')
     AND caller_role IS DISTINCT FROM 'developer' THEN
    RAISE EXCEPTION 'Only a developer may manage the developer role';
  END IF;

  -- Granting or revoking owner requires owner or developer.
  IF role_changed AND (NEW.role = 'owner' OR OLD.role = 'owner') THEN
    IF NOT public.is_owner_or_above() THEN
      RAISE EXCEPTION 'Only an owner or developer may manage the owner role';
    END IF;
  END IF;

  -- Nobody changes their own role or active status.
  IF self_update THEN
    RAISE EXCEPTION 'You may not change your own role or active status';
  END IF;

  RETURN NEW;
END;
$$;

-- 7. Last-owner protection, with a developer emergency override.
CREATE OR REPLACE FUNCTION public.profiles_protect_last_owner_upd()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role = 'owner' AND OLD.is_active = true
     AND (NEW.role <> 'owner' OR NEW.is_active = false)
     AND public.count_active_owners() <= 1
     AND public.current_user_role() IS DISTINCT FROM 'developer' THEN
    RAISE EXCEPTION 'Cannot demote or deactivate the last active owner';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_protect_last_owner_del()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role = 'owner' AND OLD.is_active = true
     AND public.count_active_owners() <= 1
     AND public.current_user_role() IS DISTINCT FROM 'developer' THEN
    RAISE EXCEPTION 'Cannot delete the last active owner';
  END IF;
  RETURN OLD;
END;
$$;

-- 8. Permission overrides: developer rows are shielded from owners.
CREATE OR REPLACE FUNCTION public.permissions_guard_overrides()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  caller_role text;
  target_role text;
  row_profile_id uuid;
  row_permission_key text;
BEGIN
  caller_role := public.current_user_role();

  IF TG_OP = 'DELETE' THEN
    row_profile_id := OLD.profile_id;
    row_permission_key := OLD.permission_key;
  ELSE
    row_profile_id := NEW.profile_id;
    row_permission_key := NEW.permission_key;
  END IF;

  IF row_profile_id = auth.uid() THEN
    RAISE EXCEPTION 'You may not create, modify, or delete permission overrides on your own profile';
  END IF;

  SELECT role INTO target_role FROM public.profiles WHERE id = row_profile_id;

  IF target_role = 'developer' AND caller_role IS DISTINCT FROM 'developer' THEN
    RAISE EXCEPTION 'Only a developer may manage permission overrides on a developer profile';
  END IF;

  IF EXISTS (SELECT 1 FROM public.owner_only_permissions WHERE permission_key = row_permission_key) THEN
    IF NOT public.is_owner_or_above() THEN
      RAISE EXCEPTION 'Only an owner may manage override for permission %', row_permission_key;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 9. New accounts without a stored invitation role become editors.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  invite record;
  resolved_role text := 'editor';
BEGIN
  SELECT id, role INTO invite
    FROM public.user_invitations
   WHERE lower(email) = lower(NEW.email)
     AND accepted_at IS NULL
     AND expires_at > now()
   ORDER BY created_at DESC
   LIMIT 1;

  IF invite.id IS NOT NULL THEN
    resolved_role := invite.role;
    UPDATE public.user_invitations SET accepted_at = now() WHERE id = invite.id;
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, resolved_role);

  RETURN NEW;
END;
$$;

-- 10. Access rules for the new roles.
DROP POLICY IF EXISTS "Owner and admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owner and admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner and admin can delete profiles" ON public.profiles;

CREATE POLICY "Managers can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_owner_or_above());
CREATE POLICY "Managers can update manageable profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.can_manage_profile(id))
  WITH CHECK (public.can_manage_profile(id));
CREATE POLICY "Managers can delete manageable profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.can_manage_profile(id));

DROP POLICY IF EXISTS "Own or admin can read permissions" ON public.permissions;
DROP POLICY IF EXISTS "Owner and admin can insert permissions" ON public.permissions;
DROP POLICY IF EXISTS "Owner and admin can update permissions" ON public.permissions;
DROP POLICY IF EXISTS "Owner and admin can delete permissions" ON public.permissions;

CREATE POLICY "Own or manager can read permissions" ON public.permissions
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid() OR public.is_owner_or_above());
CREATE POLICY "Managers can insert permissions" ON public.permissions
  FOR INSERT TO authenticated WITH CHECK (public.can_manage_profile(profile_id));
CREATE POLICY "Managers can update permissions" ON public.permissions
  FOR UPDATE TO authenticated
  USING (public.can_manage_profile(profile_id))
  WITH CHECK (public.can_manage_profile(profile_id));
CREATE POLICY "Managers can delete permissions" ON public.permissions
  FOR DELETE TO authenticated USING (public.can_manage_profile(profile_id));

DROP POLICY IF EXISTS "Owner and admin can read invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Owner and admin can insert invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Owners and admins can update invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Owner and admin can delete invitations" ON public.user_invitations;

CREATE POLICY "Managers can read invitations" ON public.user_invitations
  FOR SELECT TO authenticated USING (public.is_owner_or_above());
CREATE POLICY "Managers can insert invitations" ON public.user_invitations
  FOR INSERT TO authenticated WITH CHECK (public.is_owner_or_above());
CREATE POLICY "Managers can update invitations" ON public.user_invitations
  FOR UPDATE TO authenticated
  USING (public.is_owner_or_above()) WITH CHECK (public.is_owner_or_above());
CREATE POLICY "Managers can delete invitations" ON public.user_invitations
  FOR DELETE TO authenticated USING (public.is_owner_or_above());