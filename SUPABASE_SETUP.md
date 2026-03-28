# CalmTrip - Supabase Setup Verification ✅

## 🎉 Your Setup is Complete!

### Environment Configuration
✅ **Supabase URL**: https://nuwlhqshxsiakhjbcilz.supabase.co  
✅ **Anon Key**: Configured  
✅ **Development Server**: Running at http://localhost:8080/  

### Database Tables
✅ **trips** - Trip records with route and metadata  
✅ **photos** - Photo metadata with geolocation data  
✅ **privacy_settings** - User privacy preferences  
✅ **profiles** - Public traveler profile metadata for discover  
✅ **follows** - User follow relationships for the community feed  

### Storage Configuration
✅ **Bucket**: `photos`  
✅ **Upload Policy**: Only users can upload to their own folder  
✅ **Read Policy**: Only users can read their own photos  
✅ **Path Format**: `{userId}/{tripId}/{timestamp}-{filename}`

---

## 🧪 Testing Checklist

### 1. **Test User Signup** 
- [ ] Open http://localhost:8080/
- [ ] Click "Create Account"
- [ ] Enter email and password
- [ ] Accept privacy consent
- [ ] Should see Home dashboard

**Expected Result**: User record appears in `auth.users` table

### 2. **Test Trip Detection**
- [ ] Go to Map View page
- [ ] Click "Start Trip"
- [ ] Allow location access in browser
- [ ] Move around (or simulate movement)
- [ ] Click "End Trip"

**Expected Result**: 
- Trip record created in `trips` table
- GPS coordinates stored in `route_coordinates` JSON
- Distance calculated and stored in `distance_km`

### 3. **Test Photo Upload**
- [ ] Still on Map View
- [ ] Click "Photo" button
- [ ] Take/upload a photo
- [ ] Grant location permission
- [ ] Photo should show on map

**Expected Result**:
- Photo file uploaded to `photos/{userId}/{tripId}/` in Storage
- Photo metadata stored in `photos` table with coordinates
- Photo appears as marker on map with thumbnail

### 4. **Test Photo Gallery**
- [ ] Go to Journal page
- [ ] Select a trip
- [ ] Photos should display in grid
- [ ] Click photo to open fullscreen viewer

**Expected Result**: Photos load correctly with captions and emojis

### 5. **Test Analytics**
- [ ] Go to Stats page
- [ ] Should see:
  - Total distance traveled
  - Number of trips
  - Favorite locations
  - Total photos

**Expected Result**: Calculations match your trip data

### 6. **Test Privacy Settings**
- [ ] Go to Settings page
- [ ] Toggle "GPS Tracking"
- [ ] Toggle "Photo Geotagging"
- [ ] Click "Export Data"
- [ ] Download JSON file

**Expected Result**:
- Settings saved to `privacy_settings` table
- JSON export contains all your trip data

---

## 🔍 Database Verification

### Check Tables Created

Run these queries in Supabase SQL Editor:

```sql
-- Check trips table
SELECT * FROM trips LIMIT 5;

-- Check photos table
SELECT id, trip_id, latitude, longitude, storage_path FROM photos LIMIT 5;

-- Check privacy_settings
SELECT user_id, gps_tracking_enabled, allow_anonymous_sharing FROM privacy_settings LIMIT 5;

-- Check storage files
SELECT name FROM storage.objects WHERE bucket_id = 'photos' LIMIT 10;
```

### Required community tables
These tables are required for Discover and Feed to work:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

In addition, the community feed requires a Supabase RLS policy on `trips` that allows reading trips from people you follow:

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

### Check RLS Policies

In Supabase > Storage > Photos bucket:

✅ Policy 1 (INSERT): `auth.uid()::text = (storage.foldername(name))[1]`  
✅ Policy 2 (SELECT): `auth.uid()::text = (storage.foldername(name))[1]`  

**What this means:**
- `storage.foldername(name)` extracts the first folder from path
- For path `{userId}/{tripId}/photo.jpg`, it extracts `{userId}`
- `auth.uid()::text` is the current user's ID (from auth token)
- Users can only access files in their own folder

---

## 🚀 Common Scenarios

### Scenario 1: User Signs Up
1. User enters email/password on Onboarding page
2. `supabase.auth.signUp()` creates user in `auth.users`
3. Auth trigger creates `privacy_settings` record
4. User logged in and redirected to Home

**Database State:**
- `auth.users` table: 1 new user
- `privacy_settings` table: 1 new record for that user

### Scenario 2: User Creates Trip
1. User navigates to Map View
2. Clicks "Start Trip"
3. Browser requests location permission
4. GPS coordinates tracked every 5 seconds (while accuracy > 50m)
5. User clicks "End Trip"

**Database State:**
- `trips` table: 1 new record with:
  - `origin`: "Delhi" (reverse geocoded from first coordinate)
  - `destination`: "Gurgaon" (reverse geocoded from last coordinate)
  - `distance_km`: calculated via Haversine
  - `duration_minutes`: calculated from timestamps
  - `route_coordinates`: GeoJSON of all GPS points

### Scenario 3: User Uploads Photo
1. User on Map View, clicks "Photo"
2. Takes photo with device camera
3. Browser auto-captures location
4. Photo uploaded to storage
5. Metadata saved to database

**Database State:**
- `storage.objects` (photos bucket): 1 new file at `{userId}/{tripId}/{timestamp}.jpg`
- `photos` table: 1 new record with:
  - `storage_path`: path to file in storage
  - `latitude`, `longitude`: auto-captured coordinates
  - `user_id`: current user
  - `trip_id`: associated trip

---

## 🐛 Troubleshooting

### Issue: "Cannot read property 'getPublicUrl' of undefined"
**Solution**: Ensure Supabase URL and key are correct in `.env.local`

### Issue: Photos not appearing on map
**Solution**: Check that photos table has `latitude` and `longitude` values

### Issue: "User denied location permission"
**Solution**: Browser needs permission to access geolocation
- Manually grant in browser settings
- Reload page and try again

### Issue: Trip creation fails
**Solution**: Check that `trips` table exists and RLS policy allows inserts

### Issue: Photos not uploading
**Solution**: Verify Storage bucket policies are set correctly
- Path must be: `{userId}/{tripId}/{filename}`
- Check that bucket is named `photos` (exact match)

---

## 📊 Data Flow

```
User Signs Up
    ↓
auth.users created (Supabase Auth)
    ↓
privacy_settings record created (trigger)
    ↓

User Starts Trip
    ↓
trips record created in database
    ↓
GPS coordinates captured in background
    ↓

User Takes Photo
    ↓
Photo file → Storage bucket (photos/{userId}/{tripId}/...)
    ↓
Photo metadata → photos table
    ↓
Photo appears on map as thumbnail marker
    ↓

User Ends Trip
    ↓
trip.distance_km calculated from coordinates
    ↓
trip.route_coordinates stored as GeoJSON
    ↓
Analytics/Insights updated
```

---

## ✨ Next Steps

1. **Add Mapbox Token** (if you have one)
   - Edit `.env.local`
   - Set `VITE_MAPBOX_TOKEN=your_token`
   - Map View will show real Mapbox instead of fallback

2. **Test All Features**
   - Follow the testing checklist above
   - Create sample trips and photos
   - Verify data in Supabase dashboard

3. **Deploy**
   - Run `npm run build` to create production build
   - Deploy `dist/` folder to Vercel/Netlify
   - Set environment variables on hosting platform

---

## 📞 Support

**Issues with Supabase?**
- Check: https://supabase.com/docs
- Debug: Supabase Dashboard > Logs

**Issues with app?**
- Check browser console (F12) for errors
- Check terminal for compilation errors
- Try clearing `.env.local` and restarting dev server

**All set! Your CalmTrip app is ready to use!** 🚀
