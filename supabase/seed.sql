-- Optional sample data. Run after 0001_init.sql and after your first admin
-- user has signed up (see README "Primer usuario admin").

insert into projects (name, slug, description)
values ('Inventra', 'inventra', 'App de inventario para bodegas, mercados y minimarkets (React Native/Expo + Supabase).')
on conflict (name) do nothing;
