-- Créer une fonction pour récupérer tous les profils
create or replace function get_all_profiles()
returns table (
  id uuid,
  created_at timestamp with time zone,
  full_name text,
  avatar_url text,
  role text,
  is_blocked boolean,
  email text
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    p.id,
    p.created_at,
    p.full_name,
    p.avatar_url,
    p.role,
    p.is_blocked,
    auth.users.email
  from 
    profiles p
    left join auth.users on p.id = auth.users.id
  order by 
    p.created_at desc;
end;
$$;
