-- KHOROS — CMS de conteúdo público e páginas marketing.
-- Conteúdo em rascunho só é visível/editável por ADMIN.

create type cms_content_status as enum ('DRAFT', 'PUBLISHED');
create type cms_section_type as enum (
  'hero',
  'category_grid',
  'article_list',
  'rich_text',
  'cta_band',
  'faq',
  'steps',
  'crisis_banner',
  'validation_block',
  'disclaimer'
);

create table cms_media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique
    check (
      storage_path = btrim(storage_path)
      and storage_path <> ''
      and storage_path !~ '(^/|/\.{1,2}(/|$))'
    ),
  alt_text text not null check (char_length(btrim(alt_text)) between 1 and 500),
  mime_type text not null
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  status cms_content_status not null default 'DRAFT',
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cms_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 1000),
  image_media_id uuid references cms_media (id),
  legacy_image_path text,
  position integer not null default 0 check (position >= 0),
  status cms_content_status not null default 'DRAFT',
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cms_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references cms_categories (id),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null check (char_length(btrim(description)) between 1 and 500),
  body_mdx text not null check (char_length(btrim(body_mdx)) > 0),
  status cms_content_status not null default 'DRAFT',
  author text not null check (char_length(btrim(author)) between 1 and 160),
  reviewer text,
  reviewer_crp text,
  hero_media_id uuid references cms_media (id),
  legacy_image_path text,
  image_alt text,
  sensitive boolean not null default false,
  sources text[] not null default '{}',
  faq jsonb not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array'),
  related_slugs text[] not null default '{}',
  published_at timestamptz,
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug),
  check (status = 'DRAFT' or published_at is not null),
  check (reviewer_crp is null or reviewer is not null)
);

create table cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  status cms_content_status not null default 'DRAFT',
  published_at timestamptz,
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'DRAFT' or published_at is not null)
);

create table cms_page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references cms_pages (id) on delete cascade,
  type cms_section_type not null,
  position integer not null check (position >= 0),
  is_visible boolean not null default true,
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, position)
);

create index cms_categories_published_position_idx
  on cms_categories (position, name)
  where status = 'PUBLISHED';
create index cms_articles_published_category_date_idx
  on cms_articles (category_id, published_at desc)
  where status = 'PUBLISHED';
create index cms_articles_published_date_idx
  on cms_articles (published_at desc)
  where status = 'PUBLISHED';
create index cms_media_published_idx
  on cms_media (created_at desc)
  where status = 'PUBLISHED';

create function cms_set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

revoke all on function cms_set_updated_at() from public;

create trigger cms_media_set_updated_at
  before update on cms_media
  for each row execute function cms_set_updated_at();
create trigger cms_categories_set_updated_at
  before update on cms_categories
  for each row execute function cms_set_updated_at();
create trigger cms_articles_set_updated_at
  before update on cms_articles
  for each row execute function cms_set_updated_at();
create trigger cms_pages_set_updated_at
  before update on cms_pages
  for each row execute function cms_set_updated_at();
create trigger cms_page_sections_set_updated_at
  before update on cms_page_sections
  for each row execute function cms_set_updated_at();

alter table cms_media enable row level security;
alter table cms_categories enable row level security;
alter table cms_articles enable row level security;
alter table cms_pages enable row level security;
alter table cms_page_sections enable row level security;

create policy cms_media_public_read on cms_media
  for select to public
  using (status = 'PUBLISHED' or (select is_admin()));
create policy cms_categories_public_read on cms_categories
  for select to public
  using (status = 'PUBLISHED' or (select is_admin()));
create policy cms_articles_public_read on cms_articles
  for select to public
  using (
    (status = 'PUBLISHED' and exists (
      select 1
      from cms_categories category
      where category.id = cms_articles.category_id
        and category.status = 'PUBLISHED'
    ))
    or (select is_admin())
  );
create policy cms_pages_public_read on cms_pages
  for select to public
  using (status = 'PUBLISHED' or (select is_admin()));
create policy cms_page_sections_public_read on cms_page_sections
  for select to public
  using (
    (is_visible and exists (
      select 1
      from cms_pages page
      where page.id = cms_page_sections.page_id
        and page.status = 'PUBLISHED'
    ))
    or (select is_admin())
  );

create policy cms_media_admin_write on cms_media
  for all to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));
create policy cms_categories_admin_write on cms_categories
  for all to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));
create policy cms_articles_admin_write on cms_articles
  for all to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));
create policy cms_pages_admin_write on cms_pages
  for all to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));
create policy cms_page_sections_admin_write on cms_page_sections
  for all to authenticated
  using ((select is_admin()))
  with check ((select is_admin()));

-- Bucket privado: downloads também passam por RLS, portanto rascunhos não
-- ficam públicos apenas por conhecer a URL do objeto.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cms_media_objects_public_read" on storage.objects;
create policy "cms_media_objects_public_read"
  on storage.objects for select
  to public
  using (
    bucket_id = 'cms-media'
    and exists (
      select 1
      from public.cms_media media
      where media.storage_path = storage.objects.name
        and media.status = 'PUBLISHED'
    )
  );

drop policy if exists "cms_media_objects_admin_read" on storage.objects;
create policy "cms_media_objects_admin_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'cms-media' and (select public.is_admin()));

drop policy if exists "cms_media_objects_admin_insert" on storage.objects;
create policy "cms_media_objects_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cms-media' and (select public.is_admin()));

drop policy if exists "cms_media_objects_admin_update" on storage.objects;
create policy "cms_media_objects_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'cms-media' and (select public.is_admin()))
  with check (bucket_id = 'cms-media' and (select public.is_admin()));

drop policy if exists "cms_media_objects_admin_delete" on storage.objects;
create policy "cms_media_objects_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cms-media' and (select public.is_admin()));
