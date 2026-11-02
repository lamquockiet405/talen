BEGIN;
CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS sources (id text PRIMARY KEY, payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS eras (id text PRIMARY KEY, sort_order integer NOT NULL, payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS leaders (slug text PRIMARY KEY, name text NOT NULL, sort_order integer NOT NULL, payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS terms (
  id text PRIMARY KEY, leader_slug text NOT NULL REFERENCES leaders(slug) ON DELETE CASCADE,
  kind text NOT NULL, title text NOT NULL, start_label text NOT NULL, end_label text NOT NULL,
  start_year numeric NOT NULL, end_year numeric NOT NULL,
  payload jsonb NOT NULL, CHECK(end_year >= start_year)
);
CREATE TABLE IF NOT EXISTS leader_sources (
  leader_slug text NOT NULL REFERENCES leaders(slug) ON DELETE CASCADE,
  source_id text NOT NULL REFERENCES sources(id), PRIMARY KEY(leader_slug, source_id)
);
CREATE TABLE IF NOT EXISTS leader_eras (
  leader_slug text NOT NULL REFERENCES leaders(slug) ON DELETE CASCADE,
  era_id text NOT NULL REFERENCES eras(id), PRIMARY KEY(leader_slug, era_id)
);
CREATE TABLE IF NOT EXISTS congresses (id text PRIMARY KEY, sort_order integer NOT NULL, payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS documents (id text PRIMARY KEY, payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS site_content (key text PRIMARY KEY, payload jsonb NOT NULL);
CREATE INDEX IF NOT EXISTS terms_years_idx ON terms(start_year, end_year);
CREATE INDEX IF NOT EXISTS terms_leader_idx ON terms(leader_slug);
CREATE INDEX IF NOT EXISTS leader_sources_source_idx ON leader_sources(source_id);
INSERT INTO schema_migrations(version) VALUES(1) ON CONFLICT DO NOTHING;
COMMIT;
