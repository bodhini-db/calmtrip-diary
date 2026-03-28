# CalmTrip Database Schema

This document describes the PostgreSQL schema required for CalmTrip in Supabase.

## Tables

### 1. Privacy Settings
Stores user privacy preferences and consent.

```sql
CREATE TABLE privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gps_tracking_enabled BOOLEAN DEFAULT true,
  photo_geotagging_enabled BOOLEAN DEFAULT true,
  allow_anonymous_sharing BOOLEAN DEFAULT false,
  allow_research_data BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON privacy_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON privacy_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON privacy_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 2. Trips
Stores trip data with routes and metadata.

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin TEXT,
  destination TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  distance_km FLOAT NOT NULL,
  duration_minutes INT NOT NULL,
  route_coordinates JSONB, -- Array of [longitude, latitude] pairs
  purpose TEXT, -- User-provided trip description
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. Profiles
Stores public traveler profile metadata.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_username ON profiles(username);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
```

### 4. Follows
Stores user follow relationships for the community feed.

```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_follows_unique ON follows(follower_id, following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own follows"
  ON follows FOR SELECT
  USING (auth.uid() = follower_id);

CREATE POLICY "Users can insert follows"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);
```

### 5. Followed trips feed
Allows authenticated users to read trips posted by people they follow.

```sql
CREATE POLICY "Users can read followed trips"
  ON trips FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM follows
      WHERE follower_id = auth.uid()
        AND following_id = trips.user_id
    )
  );
```

### 6. Photos
Stores photo metadata and geo-tagging information.

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  caption TEXT,
  emoji_mood TEXT, -- Single emoji representing mood/feeling
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_photos_trip_id ON photos(trip_id);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_taken_at ON photos(taken_at DESC);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own photos"
  ON photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create photos"
  ON photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  USING (auth.uid() = user_id);
```

## Storage

### Bucket: `photos`

Configuration:
- **Name**: `photos`
- **Visibility**: Public (optional - for faster CDN loading)
- **File size limit**: 50MB recommended

#### Upload Path Structure
```
{user_id}/{trip_id}/{timestamp}-{original_filename}
```

Example:
```
550e8400-e29b-41d4-a716-446655440000/a7b84c1e-2d8f-4c7c-8a5f-123456789012/1706538000000-sunset.jpg
```

#### Storage RLS Policies (Supabase Storage)

Make sure the storage policies reference the first folder segment (index 0) since the upload path uses `{user_id}/{trip_id}/...`.

Example SQL (the exact commands you ran):

```sql
BEGIN;
  ALTER POLICY "Users can read their own photos 1io9m69_0" ON "storage"."objects" USING (((auth.uid())::text = (storage.foldername(name))[0]));
COMMIT;

BEGIN;
  ALTER POLICY "Users can upload their own photos 1io9m69_0" ON "storage"."objects" WITH CHECK (((auth.uid())::text = (storage.foldername(name))[0]));
COMMIT;
```

Notes:
- These policies ensure the first folder segment (the `user_id`) matches the authenticated user.
- This matches the client upload path used by the app:
  ```ts
  const filePath = `${user.id}/${tripId}/${Date.now()}-${file.name}`
  ```
- With these policies, files uploaded to `photos/{userId}/...` are only readable and writable by that `userId`.


#### Image Format Support
- JPEG
- PNG
- WebP
- HEIC (iOS)

## Data Types & Constraints

### Coordinates (JSONB)
```json
[
  [longitude, latitude, timestamp],
  [-122.4194, 37.7749, 1706538000000],
  ...
]
```

### Route Coordinates (JSONB)
```json
[
  [-122.4194, 37.7749],
  [-122.4195, 37.7750],
  ...
]
```

## Triggers

### Auto-update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Query Examples

### Get user's trips for a date range
```sql
SELECT * FROM trips
WHERE user_id = $1
  AND created_at >= $2
  AND created_at <= $3
ORDER BY created_at DESC;
```

### Get all photos for a trip with captions
```sql
SELECT id, storage_path, latitude, longitude, caption, emoji_mood
FROM photos
WHERE trip_id = $1
ORDER BY taken_at DESC;
```

### Calculate monthly distance
```sql
SELECT 
  DATE_TRUNC('month', created_at)::date as month,
  SUM(distance_km) as total_distance,
  COUNT(*) as trip_count
FROM trips
WHERE user_id = $1
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### Find most visited location
```sql
SELECT 
  destination,
  COUNT(*) as visit_count
FROM trips
WHERE user_id = $1
GROUP BY destination
ORDER BY visit_count DESC
LIMIT 10;
```

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only read their own data
- Users can only create/update/delete their own records
- Service role can bypass RLS (for admin operations)

## Performance Considerations

1. **Indexes**: Create on frequently queried columns (user_id, dates)
2. **JSON Storage**: route_coordinates and coordinates are stored as JSONB for flexibility
3. **Lazy Loading**: Client-side pagination recommended for photo grids
4. **Caching**: Consider caching monthly stats in a separate table if queries become slow

## Maintenance

### Backup Strategy
- Daily automated backups via Supabase
- Manual exports before major updates
- Keep 30 days of transaction logs

### Data Cleanup
Consider archiving old trips (>1 year) to separate table:
```sql
CREATE TABLE trips_archive AS 
SELECT * FROM trips 
WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
```

## Migration Notes

For existing installations, apply migrations in order:
1. Create privacy_settings table
2. Create trips table
3. Create photos table
4. Enable RLS policies
5. Create indexes
6. Create triggers

---

**Schema Version**: 1.0
**Compatible with**: Supabase (PostgreSQL 14+)
