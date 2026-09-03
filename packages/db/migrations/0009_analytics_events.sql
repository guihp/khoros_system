-- KHOROS — Analytics first-party (Onda 0: pageviews, UTM, funil).
-- Append-only. Sem PII / sem IP. Escrita via service_role (POST /api/events).
-- Leitura admin via service_role (GET /admin/metrics/*).

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  visitor_id text,
  session_id text,
  device_type text,
  article_slug text,
  article_category text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_created_at_idx on analytics_events (created_at desc);
create index analytics_events_event_created_idx on analytics_events (event_name, created_at desc);
create index analytics_events_path_idx on analytics_events (path);
create index analytics_events_utm_source_idx on analytics_events (utm_source);

alter table analytics_events enable row level security;
-- Sem policies: leitura/escrita só via service_role (bypassa RLS).

-- Agregações do painel admin (service_role via RPC).
create or replace function get_metrics_summary(from_ts timestamptz, to_ts timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  v_pageviews bigint;
  v_unique_visitors bigint;
  v_unique_sessions bigint;
  v_leads_count bigint;
begin
  select count(*) into v_pageviews
  from analytics_events
  where event_name = 'page_view'
    and created_at >= from_ts
    and created_at < to_ts;

  select count(distinct visitor_id) into v_unique_visitors
  from analytics_events
  where event_name = 'page_view'
    and visitor_id is not null
    and created_at >= from_ts
    and created_at < to_ts;

  select count(distinct session_id) into v_unique_sessions
  from analytics_events
  where event_name = 'page_view'
    and session_id is not null
    and created_at >= from_ts
    and created_at < to_ts;

  select count(*) into v_leads_count
  from leads
  where created_at >= from_ts
    and created_at < to_ts;

  select jsonb_build_object(
    'pageviews', v_pageviews,
    'unique_visitors', v_unique_visitors,
    'unique_sessions', v_unique_sessions,
    'leads_count', v_leads_count,
    'funnel', coalesce((
      select jsonb_object_agg(event_name, cnt)
      from (
        select event_name, count(*)::bigint as cnt
        from analytics_events
        where created_at >= from_ts
          and created_at < to_ts
          and event_name in (
            'validation_needs_help',
            'lead_form_open',
            'lead_form_submit',
            'lead_form_success'
          )
        group by event_name
      ) f
    ), '{}'::jsonb),
    'top_paths', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'count', cnt) order by cnt desc)
      from (
        select coalesce(nullif(path, ''), '(sem path)') as path, count(*)::bigint as cnt
        from analytics_events
        where event_name = 'page_view'
          and created_at >= from_ts
          and created_at < to_ts
        group by 1
        order by cnt desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'top_referrers', coalesce((
      select jsonb_agg(jsonb_build_object('referrer', referrer_host, 'count', cnt) order by cnt desc)
      from (
        select
          case
            when referrer is null or btrim(referrer) = '' then '(direto)'
            else coalesce(
              nullif(substring(referrer from '^https?://([^/]+)'), ''),
              left(referrer, 80)
            )
          end as referrer_host,
          count(*)::bigint as cnt
        from analytics_events
        where event_name = 'page_view'
          and created_at >= from_ts
          and created_at < to_ts
        group by 1
        order by cnt desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'top_utm_sources', coalesce((
      select jsonb_agg(jsonb_build_object('utm_source', utm_source, 'count', cnt) order by cnt desc)
      from (
        select coalesce(nullif(utm_source, ''), '(nenhum)') as utm_source, count(*)::bigint as cnt
        from analytics_events
        where event_name = 'page_view'
          and created_at >= from_ts
          and created_at < to_ts
        group by 1
        order by cnt desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'top_utm_campaigns', coalesce((
      select jsonb_agg(jsonb_build_object('utm_campaign', utm_campaign, 'count', cnt) order by cnt desc)
      from (
        select coalesce(nullif(utm_campaign, ''), '(nenhum)') as utm_campaign, count(*)::bigint as cnt
        from analytics_events
        where event_name = 'page_view'
          and created_at >= from_ts
          and created_at < to_ts
        group by 1
        order by cnt desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('device_type', device_type, 'count', cnt) order by cnt desc)
      from (
        select coalesce(nullif(device_type, ''), '(desconhecido)') as device_type, count(*)::bigint as cnt
        from analytics_events
        where event_name = 'page_view'
          and created_at >= from_ts
          and created_at < to_ts
        group by 1
        order by cnt desc
      ) t
    ), '[]'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day', day::text,
        'pageviews', pageviews,
        'visitors', visitors
      ) order by day)
      from (
        select
          (created_at at time zone 'America/Sao_Paulo')::date as day,
          count(*)::bigint as pageviews,
          count(distinct visitor_id)::bigint as visitors
        from analytics_events
        where event_name = 'page_view'
          and created_at >= from_ts
          and created_at < to_ts
        group by 1
        order by 1
      ) d
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function get_metrics_summary(timestamptz, timestamptz) from public;
grant execute on function get_metrics_summary(timestamptz, timestamptz) to service_role;
