-- migrate: up
-- Cita Perfecta - H-001: Bloquea auto-otorgamiento de premium
--                 H-003: Cuota de cartas validada en servidor

-- =========================================================
-- H-001: Trigger que impide que usuarios autenticados
--         activen premium por su propia cuenta.
--         Solo el service_role (webhooks de pago) puede hacerlo.
-- =========================================================

create or replace function public.prevent_self_premium_grant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    (new.premium = true and (old.premium is distinct from true))
    or (new.is_premium = true and (old.is_premium is distinct from true))
  ) and auth.role() = 'authenticated' then
    raise exception 'premium_self_grant_denied'
      using hint = 'El estado premium solo puede ser otorgado por el sistema de pagos.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_premium_self_grant on public.profiles;
create trigger prevent_premium_self_grant
before update on public.profiles
for each row execute function public.prevent_self_premium_grant();

-- RPC para activar premium desde webhooks de pago (service_role solamente)
create or replace function public.activate_premium(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set premium = true,
      is_premium = true,
      updated_at = now()
  where id = p_user_id or user_id = p_user_id;
end;
$$;

revoke all on function public.activate_premium(uuid) from public, authenticated;

-- =========================================================
-- H-003: Cuota mensual de cartas aplicada en servidor.
--         El cliente llama a esta RPC en lugar de hacer
--         insert + update por separado.
-- =========================================================

create or replace function public.send_connection_letter(
  p_to_user_id uuid,
  p_message    text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_user_id uuid := auth.uid();
  v_premium      boolean := false;
  v_used         int     := 0;
  v_reset_at     timestamptz;
  v_quota_limit  int;
  v_next_reset   timestamptz;
begin
  if length(trim(p_message)) < 300 then
    return jsonb_build_object('ok', false, 'error', 'La carta debe tener al menos 300 caracteres.');
  end if;

  if v_from_user_id = p_to_user_id then
    return jsonb_build_object('ok', false, 'error', 'No puedes enviarte una carta a ti mismo.');
  end if;

  select
    coalesce(premium, false) or coalesce(is_premium, false),
    coalesce(letters_used_this_month, 0),
    letters_reset_at
  into v_premium, v_used, v_reset_at
  from public.profiles
  where id = v_from_user_id or user_id = v_from_user_id
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Perfil no encontrado.');
  end if;

  v_quota_limit := case when v_premium then 10 else 3 end;

  -- Resetear si expiró el periodo mensual
  if v_reset_at is null or v_reset_at <= now() then
    v_next_reset := now() + interval '1 month';
    update public.profiles
    set letters_used_this_month = 0,
        letters_reset_at = v_next_reset
    where id = v_from_user_id or user_id = v_from_user_id;
    v_used := 0;
  end if;

  if v_used >= v_quota_limit then
    return jsonb_build_object(
      'ok', false,
      'error', format('Ya usaste tus %s cartas disponibles de este mes.', v_quota_limit)
    );
  end if;

  insert into public.connection_letters (from_user_id, to_user_id, message, status)
  values (v_from_user_id, p_to_user_id, trim(p_message), 'sent');

  update public.profiles
  set letters_used_this_month = letters_used_this_month + 1
  where id = v_from_user_id or user_id = v_from_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.send_connection_letter(uuid, text) to authenticated;

-- migrate: down
drop trigger if exists prevent_premium_self_grant on public.profiles;
drop function if exists public.prevent_self_premium_grant();
drop function if exists public.activate_premium(uuid);
drop function if exists public.send_connection_letter(uuid, text);
