-- migrate: up
-- Cita Perfecta - campos de consentimiento legal y datos

alter table public.profiles
add column if not exists terms_accepted_at timestamptz,
add column if not exists terms_version varchar(10) default '1.0',
add column if not exists privacy_accepted_at timestamptz,
add column if not exists privacy_version varchar(10) default '1.0',
add column if not exists data_consent_given boolean not null default false,
add column if not exists data_consent_at timestamptz;

-- migrate: down
alter table public.profiles
drop column if exists terms_accepted_at,
drop column if exists terms_version,
drop column if exists privacy_accepted_at,
drop column if exists privacy_version,
drop column if exists data_consent_given,
drop column if exists data_consent_at;
