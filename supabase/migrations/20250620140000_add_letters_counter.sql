-- Cita Perfecta - contador mensual de cartas de conexion

alter table public.profiles
add column if not exists letters_used_this_month int not null default 0,
add column if not exists letters_reset_at timestamptz not null default (now() + interval '1 month');

alter table public.connection_letters
add column if not exists read_at timestamptz;

create index if not exists connection_letters_from_created_idx
on public.connection_letters(from_user_id, created_at);

create index if not exists connection_letters_to_created_idx
on public.connection_letters(to_user_id, created_at);
