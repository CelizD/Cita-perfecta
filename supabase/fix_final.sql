-- Agrega el UNIQUE constraint que falta en swipes
alter table public.swipes
  drop constraint if exists swipes_from_to_unique,
  drop constraint if exists swipes_from_user_id_to_user_id_key;

alter table public.swipes
  add constraint swipes_from_to_unique unique (from_user_id, to_user_id);

-- Agrega UNIQUE en matches también (necesario para upsert)
alter table public.matches
  drop constraint if exists matches_user_a_b_unique,
  drop constraint if exists matches_user_a_user_b_key;

alter table public.matches
  add constraint matches_user_a_b_unique unique (user_a, user_b);

-- Fuerza PostgREST a recargar el schema (sin esto no ve los nuevos constraints)
notify pgrst, 'reload schema';

-- Verifica
select table_name, constraint_name, constraint_type
from information_schema.table_constraints
where table_schema = 'public'
  and table_name in ('swipes', 'matches')
  and constraint_type = 'UNIQUE';
