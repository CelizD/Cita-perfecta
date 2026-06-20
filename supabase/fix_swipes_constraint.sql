-- Agrega el UNIQUE constraint a swipes si no existe
-- (la tabla ya existia sin el constraint)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.swipes'::regclass
      and contype = 'u'
      and conname like '%from_user_id%to_user_id%'
  ) then
    alter table public.swipes
      add constraint swipes_from_user_id_to_user_id_key
      unique (from_user_id, to_user_id);
  end if;
end;
$$;

-- Verifica que el constraint existe
select conname from pg_constraint
where conrelid = 'public.swipes'::regclass and contype = 'u';
