/*
# Create Lost & Found Tables

## Summary
Creates the core tables for a campus Lost & Found system where students can report
lost items and log found items. When a found item is added, the app compares it
against all lost items and computes a real Match Confidence score based on
field-by-field comparison (name, category, color, brand, tags, description,
location, date/time, and photo).

## New Tables

### lost_items
Stores items students have reported as lost.
- id (uuid, primary key)
- reporter_name (text) — name of the student reporting
- reporter_contact (text) — email or phone for follow-up
- item_name (text) — what the item is, e.g. "Blue Backpack"
- category (text) — Electronics, Clothing, Bag, Accessory, Book, Other
- color (text) — primary color of the item
- brand (text) — brand or manufacturer
- tags (text[]) — free-form tags for flexible matching
- description (text) — longer description of the item
- location (text) — where the item was last seen
- lost_date (timestamptz) — when the item was lost
- photo_url (text) — URL to uploaded photo in storage
- status (text) — 'active' or 'recovered'
- created_at (timestamptz)

### found_items
Stores items that have been found and logged.
- id (uuid, primary key)
- finder_name (text) — name of the person logging the found item
- finder_contact (text) — email or phone
- item_name (text)
- category (text)
- color (text)
- brand (text)
- tags (text[])
- description (text)
- location (text) — where the item was found
- found_date (timestamptz) — when the item was found
- photo_url (text)
- status (text) — 'active' or 'claimed'
- created_at (timestamptz)

## Security
- RLS enabled on both tables.
- This is a single-tenant app (no sign-in screen), so policies use
  TO anon, authenticated to allow the anon-key client to read and write.
- All data is intentionally shared/public across the campus.

## Storage
- A public storage bucket 'lost-found-photos' is created for photo uploads.
*/

-- ============================================================
-- lost_items
-- ============================================================
CREATE TABLE IF NOT EXISTS lost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  reporter_contact text NOT NULL,
  item_name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  color text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  lost_date timestamptz,
  photo_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lost_items" ON lost_items;
CREATE POLICY "anon_select_lost_items" ON lost_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lost_items" ON lost_items;
CREATE POLICY "anon_insert_lost_items" ON lost_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lost_items" ON lost_items;
CREATE POLICY "anon_update_lost_items" ON lost_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lost_items" ON lost_items;
CREATE POLICY "anon_delete_lost_items" ON lost_items FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- found_items
-- ============================================================
CREATE TABLE IF NOT EXISTS found_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finder_name text NOT NULL,
  finder_contact text NOT NULL,
  item_name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  color text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  found_date timestamptz,
  photo_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE found_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_found_items" ON found_items;
CREATE POLICY "anon_select_found_items" ON found_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_found_items" ON found_items;
CREATE POLICY "anon_insert_found_items" ON found_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_found_items" ON found_items;
CREATE POLICY "anon_update_found_items" ON found_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_found_items" ON found_items;
CREATE POLICY "anon_delete_found_items" ON found_items FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- Indexes for common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lost_items_status ON lost_items(status);
CREATE INDEX IF NOT EXISTS idx_found_items_status ON found_items(status);
CREATE INDEX IF NOT EXISTS idx_lost_items_category ON lost_items(category);
CREATE INDEX IF NOT EXISTS idx_found_items_category ON found_items(category);

-- ============================================================
-- Storage bucket for photo uploads
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('lost-found-photos', 'lost-found-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read of photos
DROP POLICY IF EXISTS "anon_read_photos" ON storage.objects;
CREATE POLICY "anon_read_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'lost-found-photos');

-- Allow anyone to upload photos
DROP POLICY IF EXISTS "anon_upload_photos" ON storage.objects;
CREATE POLICY "anon_upload_photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'lost-found-photos');

-- Allow anyone to update/delete their own uploads (or all, since no auth)
DROP POLICY IF EXISTS "anon_update_photos" ON storage.objects;
CREATE POLICY "anon_update_photos" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'lost-found-photos') WITH CHECK (bucket_id = 'lost-found-photos');

DROP POLICY IF EXISTS "anon_delete_photos" ON storage.objects;
CREATE POLICY "anon_delete_photos" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'lost-found-photos');