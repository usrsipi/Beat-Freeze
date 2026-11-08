/*
# Create genre_suggestions table

1. New Tables
- `genre_suggestions`
  - `id` (uuid, primary key)
  - `genre_name` (text, not null) — the name of the genre the user wants added
  - `description` (text, nullable) — optional description of why the genre should be added
  - `example_url` (text, not null) — YouTube or audio file link as an example
  - `status` (text, default 'pending') — review status
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `genre_suggestions`.
- Grant INSERT to `anon` + `authenticated` so any visitor can submit a suggestion.
- Grant SELECT to `authenticated` (service_role used by edge function bypasses RLS).
- Allow anon + authenticated INSERT because suggestions are intentionally public submissions.
- No SELECT/UPDATE/DELETE for anon — only the edge function (service_role) reads/manages these.
*/

CREATE TABLE IF NOT EXISTS genre_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_name text NOT NULL,
  description text,
  example_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE genre_suggestions ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON genre_suggestions TO anon, authenticated;
GRANT SELECT ON genre_suggestions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON genre_suggestions TO service_role;

DROP POLICY IF EXISTS "anon_insert_genre_suggestions" ON genre_suggestions;
CREATE POLICY "anon_insert_genre_suggestions"
ON genre_suggestions FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_select_genre_suggestions" ON genre_suggestions;
CREATE POLICY "authenticated_select_genre_suggestions"
ON genre_suggestions FOR SELECT
TO authenticated USING (true);
