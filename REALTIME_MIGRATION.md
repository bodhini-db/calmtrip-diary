# Real-Time Tracking & Supabase Migration

What needs to change when moving from simulation to real-time tracking with Supabase active.

---

## 1. Re-enable Supabase Auth

**File:** `src/hooks/useAuth.ts`
- Set `DEV_BYPASS_AUTH = false`
- Real users will sign up/in via Onboarding page

---

## 2. Real-Time GPS Tracking (replace simulation)

**File:** `src/hooks/useTripDetector.ts`
- Already has `navigator.geolocation.watchPosition()` in `startTracking()`
- Already calculates distance via Haversine formula
- **Change:** Increase `ACCURACY_THRESHOLD_M` from 50 to 100 for outdoor use
- **Change:** Reduce `TIME_THRESHOLD_MS` from 60000 to 120000 (2 min inactivity = end trip)

**File:** `src/pages/MapView.tsx`
- Remove/hide the simulator panel (or keep behind a dev flag)
- "Start Trip" button already calls `startTracking()` + `startTrip()`
- The blue dot + polyline already work with real GPS data

---

## 3. Auto-Detect Checkpoint Departure (2-4km rule)

**File:** `src/hooks/useTripDetector.ts` — Add checkpoint departure detection

```
New logic needed in handleLocationUpdate / addLocation:
- When user is at a checkpoint (last checkpoint in list)
- Calculate distance from that checkpoint's lat/lng to current position
- If distance > CHECKPOINT_DEPART_THRESHOLD_M (e.g., 2000-4000m):
  - Auto-resume tracking
  - Mark checkpoint as "departed"
  - Could trigger a "You've left [checkpoint name]!" toast
```

**New constant:** `CHECKPOINT_DEPART_THRESHOLD_M = 3000` (3km)

**New state:** `isPausedAtCheckpoint: boolean` in TripData — when true, user is stopped at a checkpoint. When they move 3km away, set to false and resume active tracking.

---

## 4. Save Trips to Supabase (replace localStorage)

**File:** `src/lib/api.ts` — Already has `createTrip()`, `uploadPhoto()`

**File:** `src/pages/MapView.tsx` — `saveTripLocally()` function
- Replace `saveLocalTrip()` with `createTrip()` from api.ts
- After creating trip, upload each checkpoint photo via `uploadPhoto()`
- Keep localStorage as offline fallback (sync when back online)

**Migration steps:**
1. In `saveTripLocally()`, try `createTrip()` first
2. If Supabase succeeds, upload photos with `uploadPhoto()`
3. If Supabase fails, fall back to `saveLocalTrip()`
4. Add a "Sync" button in Settings to push local trips to Supabase when online

---

## 5. Save Checkpoints to Supabase

**New table needed:** `checkpoints`
```sql
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  arrived_at TIMESTAMPTZ,
  departed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**File:** `src/lib/api.ts` — Add:
- `createCheckpoint(tripId, checkpoint)`
- `getCheckpoints(tripId)`

---

## 6. Photo Upload to Supabase Storage

**File:** `src/lib/api.ts` — `uploadPhoto()` already works
- Currently uses `URL.createObjectURL()` for local preview
- Change to: upload to Supabase storage, then use `getPhotoUrl()` for display
- Keep objectUrl as immediate preview, replace with storage URL after upload

**Migration:**
1. Show objectUrl immediately (instant preview)
2. Upload to Supabase storage in background
3. Once uploaded, update photo record with storage_path
4. On Journal page, prefer storage URL over objectUrl

---

## 7. Journal Page — Load from Supabase

**File:** `src/pages/Journal.tsx`
- Already tries `getTrips()` first, falls back to local
- Add `getCheckpoints(tripId)` call to load checkpoint timeline
- Add `getPhotos(tripId)` to load photos per checkpoint
- Keep local trip merge for offline-first behavior

---

## 8. Home Page — Load from Supabase

**File:** `src/pages/Home.tsx`
- Re-enable `getTrips()` and `getPhotos()` calls
- Keep `getLocalTrips()` as fallback
- Re-enable `useTripDetector` for live tracking status on home

---

## 9. Background Location Tracking (Mobile PWA)

**For production mobile use:**
- Add service worker for background geolocation
- Use `navigator.geolocation.watchPosition()` with `enableHighAccuracy: true`
- Consider Battery API to reduce tracking frequency when battery is low
- Add `wake-lock` API to prevent sleep during active tracking

---

## Summary — Files to Update

| File | Change |
|------|--------|
| `src/hooks/useAuth.ts` | Set `DEV_BYPASS_AUTH = false` |
| `src/hooks/useTripDetector.ts` | Add checkpoint departure detection (3km rule) |
| `src/pages/MapView.tsx` | Hide simulator, use real GPS, save to Supabase |
| `src/pages/Home.tsx` | Re-enable Supabase data loading |
| `src/pages/Journal.tsx` | Load checkpoints + photos from Supabase |
| `src/lib/api.ts` | Add checkpoint CRUD functions |
| `src/lib/supabase.ts` | No changes needed (types already defined) |
| `src/lib/localTrips.ts` | Keep as offline fallback |
| Supabase Dashboard | Create `checkpoints` table, unpause project |
