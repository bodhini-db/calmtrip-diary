# CalmTrip Application - Detailed Workflow Documentation

## Table of Contents
1. [User Authentication & Onboarding Workflow](#1-user-authentication--onboarding-workflow)
2. [Home Dashboard Workflow](#2-home-dashboard-workflow)
3. [AI Trip Planning Workflow](#3-ai-trip-planning-workflow)
4. [GPS Trip Tracking Workflow](#4-gps-trip-tracking-workflow)
5. [Photo Management Workflow](#5-photo-management-workflow)
6. [Journal/Diary Workflow](#6-journaldiary-workflow)
7. [Analytics & Insights Workflow](#7-analytics--insights-workflow)
8. [Privacy Settings Workflow](#8-privacy-settings-workflow)
9. [Data Synchronization Workflow](#9-data-synchronization-workflow)

---

## 1. User Authentication & Onboarding Workflow

### 1.1 Initial Access Flow

```
User opens application
    ↓
Check authentication state (useAuth hook)
    ↓
┌─────────────────────────────────────┐
│ Is user authenticated?               │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Navigate to      Show Onboarding Page
Home Page        (/)
```

### 1.2 Onboarding Process

**Step 1: Welcome Screen**
- Display app introduction slides
- Show privacy-first messaging
- Present "Get Started" button

**Step 2: Privacy Consent Screens**
- **GPS Tracking Consent**
  - Toggle: `gpsTracking` (default: true)
  - Explanation of location tracking
  - User can enable/disable
  
- **Photo Geotagging Consent**
  - Toggle: `photoGeotagging` (default: true)
  - Explanation of geotagging
  - User can enable/disable
  
- **Anonymous Research Data**
  - Toggle: `anonymousResearch` (default: false)
  - Opt-in for anonymized data sharing
  - User can enable/disable

**Step 3: Authentication Form**
```
User selects Sign Up or Sign In
    ↓
Enter email and password
    ↓
Submit form
    ↓
┌─────────────────────────────────────┐
│ Sign Up Flow                        │
└─────────────────────────────────────┘
    ↓
Call signUp(email, password)
    ↓
┌─────────────────────────────────────┐
│ Supabase creates user account       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Email confirmation required?        │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Show confirmation    Continue to
message              privacy settings
                     creation
    ↓
Save privacy settings to database:
- user_id (from auth.users)
- gps_tracking_enabled
- photo_geotagging_enabled
- allow_anonymous_sharing
- allow_research_data
    ↓
Navigate to /home
```

**Step 4: Sign In Flow**
```
User enters credentials
    ↓
Call signIn(email, password)
    ↓
┌─────────────────────────────────────┐
│ Supabase validates credentials      │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Valid?                               │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Create session      Show error message
Load user data     User retries
Navigate to /home
```

### 1.3 Session Management

**Session Persistence:**
- Supabase Auth handles session storage
- Session checked on app load via `useAuth` hook
- Automatic redirect if session expired

**Logout Flow:**
```
User clicks Logout button
    ↓
Call signOut() from Supabase
    ↓
Clear local session
    ↓
Navigate to / (Onboarding page)
```

---

## 2. Home Dashboard Workflow

### 2.1 Page Load Sequence

```
User navigates to /home
    ↓
Check authentication (useAuth hook)
    ↓
┌─────────────────────────────────────┐
│ User authenticated?                 │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Continue            Redirect to /
    ↓
Extract username from user.email
    ↓
Load trips data:
1. Get local trips (localStorage)
2. Get remote trips (Supabase)
3. Merge and deduplicate
4. Sort by created_at DESC
    ↓
Calculate statistics:
- Total distance
- Total photos
- Recent trips (first 3)
    ↓
Render dashboard components
```

### 2.2 Dashboard Components

**Header Section:**
- User avatar (first letter of email)
- Personalized greeting (morning/afternoon)
- Notification bell icon
- Logout button

**Today's Journey Card:**
- Map preview image
- "View Map" button → Navigate to /map

**AI Trip Planner Component:**
- Receives `pastTripSummary` prop
- Format: "{trip_count} trips, favourite areas: {locations}"
- See [AI Trip Planning Workflow](#3-ai-trip-planning-workflow)

**Statistics Cards:**
- Total Distance (with trip count)
- Total Photos (with checkpoint count)
- Only shown if trips.length > 0

**Recent Trips Section:**
- Display first 3 trips
- Each trip shows:
  - Thumbnail (first photo or 🗺️ emoji)
  - Destination/Origin name
  - Distance, duration, date
- Click → Navigate to /journal

**Empty State:**
- Shown if no trips exist
- "Start Trip" button → Navigate to /map

---

## 3. AI Trip Planning Workflow

### 3.1 Trip Plan Generation

```
User enters trip description in textarea
    ↓
User selects duration (30min, 1hr, 2hr, Half day)
    ↓
User clicks "Generate Plan" button
    ↓
Set step = "planning"
Clear previous plan and errors
    ↓
Call planTrip(prompt, duration, pastTripSummary)
    ↓
┌─────────────────────────────────────┐
│ AI Trip Planning Process            │
└─────────────────────────────────────┘
    ↓
Construct prompt with:
- User's natural language request
- Available time duration
- Past travel summary
- JSON output format specification
    ↓
Call Gemini API (gemini-3-flash-preview)
    ↓
┌─────────────────────────────────────┐
│ Parse AI Response                   │
└─────────────────────────────────────┘
    ↓
Extract JSON from response
(Handle markdown code fences)
    ↓
Parse JSON to AiTripPlan structure:
{
  title: string
  description: string
  estimated_duration_minutes: number
  city: string
  checkpoints: Array<{
    name: string
    description: string
    suggested_duration_minutes: number
  }>
}
    ↓
Set step = "geocoding"
    ↓
Call geocodeCheckpoints(checkpoints, city)
    ↓
┌─────────────────────────────────────┐
│ Geocoding Process                   │
└─────────────────────────────────────┘
    ↓
For each checkpoint:
  Try query 1: "{name}, {city}, India"
    ↓
  ┌─────────────────────────────────┐
  │ Found?                          │
  └─────────────────────────────────┘
    │              │
   YES            NO
    │              │
    ↓              ↓
  Add lat/lng   Try query 2: "{name}, India"
  Continue         ↓
                ┌─────────────────────────┐
                │ Found?                  │
                └─────────────────────────┘
                  │              │
                 YES            NO
                  │              │
                  ↓              ↓
                Add lat/lng   Try query 3: "{name.split(',')[0]}, {city}, India"
                Continue         ↓
                              ┌─────────────────────────┐
                              │ Found?                  │
                              └─────────────────────────┘
                                │              │
                               YES            NO
                                │              │
                                ↓              ↓
                              Add lat/lng   Leave unmapped
                              Continue
    ↓
Wait 1100ms between requests (rate limiting)
    ↓
Return geocoded checkpoints
    ↓
Set step = "done"
Display trip plan with:
- Title and description
- Duration and stop count badges
- Checkpoint timeline (with geocoding status)
- "Simulate Trip" button (if ≥2 checkpoints mapped)
- "Copy" button (copy plan to clipboard)
```

### 3.2 Trip Simulation Flow

```
User clicks "Simulate Trip" button
    ↓
Filter checkpoints with lat/lng (≥2 required)
    ↓
Navigate to /map with state:
{
  aiPlan: {
    title: string
    checkpoints: Array<{
      name: string
      description: string
      lat: number
      lng: number
    }>
  }
}
    ↓
MapView page receives AI plan
    ↓
Update simulator checkpoints
    ↓
Show simulation panel
    ↓
User can start simulation
    ↓
See [GPS Trip Tracking Workflow - Simulation](#44-simulation-mode)
```

---

## 4. GPS Trip Tracking Workflow

### 4.1 Real-Time GPS Tracking

**Initialization:**
```
User navigates to /map
    ↓
Check authentication
    ↓
Initialize MapView component
    ↓
Request current location (getCurrentPosition)
    ↓
┌─────────────────────────────────────┐
│ Location permission granted?        │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Center map on      Show error message
current location   "Location access required"
    ↓
Start watchPosition (continuous GPS)
    ↓
Set up location update handler
```

**Trip Start Flow:**
```
User clicks "Start Trip" button
    ↓
Call startTrip() from useTripDetector
    ↓
Initialize tripData:
- locations: []
- startTime: Date.now()
- distance: 0
- isActive: true
- checkpoints: []
    ↓
Set isTracking = true
    ↓
Start GPS watchPosition with:
- enableHighAccuracy: true
- timeout: 5000ms
- maximumAge: 3000ms
    ↓
Show toast: "Trip started! Walk around — your route is being tracked."
    ↓
Begin location tracking loop
```

**Location Update Processing:**
```
GPS provides new position
    ↓
handleLocationUpdate(position) called
    ↓
Extract: latitude, longitude, accuracy, timestamp
    ↓
┌─────────────────────────────────────┐
│ Accuracy < 50m?                     │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Continue            Discard location
    ↓
Create Location object:
{
  latitude: number
  longitude: number
  timestamp: number
}
    ↓
┌─────────────────────────────────────┐
│ First location?                     │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Add to locations   Calculate distance
array              using Haversine
                   formula
    ↓
┌─────────────────────────────────────┐
│ Distance > 100m?                    │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Set isActive = true  Continue tracking
Add to locations
Update cumulative
distance
    ↓
Reset inactivity timer
    ↓
Update map display:
- Add point to polyline
- Update current location marker
- Update distance/duration stats
    ↓
┌─────────────────────────────────────┐
│ No movement for 60 seconds?         │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Set isActive = false Continue tracking
(Trip paused)
```

**Checkpoint Creation:**
```
User clicks "Add Checkpoint" button
    ↓
Get current GPS location
    ↓
Create checkpoint:
{
  id: uuid()
  name: "Checkpoint {number}"
  lat: currentLatitude
  lng: currentLongitude
  photos: []
  reached: false
}
    ↓
Add checkpoint to tripData.checkpoints
    ↓
Display checkpoint marker on map
    ↓
Show checkpoint dialog (optional)
```

**Trip End Flow:**
```
User clicks "End Trip" button
    ↓
Call endTrip() → Returns tripData
    ↓
Stop GPS watchPosition
    ↓
Set isTracking = false
    ↓
Call saveTripData(tripData)
    ↓
┌─────────────────────────────────────┐
│ Save Trip Data Process              │
└─────────────────────────────────────┘
    ↓
Calculate trip metrics:
- origin: first checkpoint name or "Start"
- destination: last checkpoint name or origin
- route_coordinates: [lat, lng] pairs
- distance_km: cumulative distance
- duration_minutes: (endTime - startTime) / 60000
    ↓
Try to save to Supabase:
  Call createTrip(tripData)
    ↓
  ┌─────────────────────────────────┐
  │ Success?                         │
  └─────────────────────────────────┘
    │              │
   YES            NO
    │              │
    ↓              ↓
  Upload photos  Save locally only
  to Supabase    (localStorage)
  Storage
    ↓
Always save to localStorage
(offline backup)
    ↓
Clear photoFilesRef
    ↓
Show success toast:
- "Trip saved to your diary!" (Supabase)
- "Trip saved locally!" (localStorage only)
    ↓
Reset trip state
    ↓
Navigate to /journal (optional)
```

### 4.2 Checkpoint Management

**Reaching a Checkpoint (Simulation):**
```
Simulator reaches checkpoint location
    ↓
Calculate distance to checkpoint
    ↓
┌─────────────────────────────────────┐
│ Distance < threshold?               │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Mark checkpoint    Continue simulation
as reached
    ↓
Call onCheckpointReached(checkpoint)
    ↓
Show toast: "Reached: {checkpoint.name}!"
    ↓
Open checkpoint dialog
    ↓
User can:
- Add photos
- Edit checkpoint name
- Add description
    ↓
User clicks "Resume" or closes dialog
    ↓
Continue simulation
```

### 4.3 Simulation Mode

**Starting Simulation:**
```
User has AI plan or custom checkpoints
    ↓
User clicks "Start Simulation" button
    ↓
┌─────────────────────────────────────┐
│ At least 2 checkpoints?             │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Continue            Show error toast
    ↓
Stop real GPS tracking
    ↓
Call startTrip()
    ↓
Call startSimulation()
    ↓
Generate route points between checkpoints
    ↓
Begin simulated movement:
- Move along route at configured speed
- Update location every interval
- Call addLocation() for each point
    ↓
When reaching checkpoint:
- Call onCheckpointReached()
- Pause simulation
- Show checkpoint dialog
    ↓
User resumes → Continue simulation
```

**Simulation Controls:**
- Play/Pause: Control simulation state
- Speed: Adjust movement speed (1x, 2x, 4x)
- Stop: End simulation and save trip

---

## 5. Photo Management Workflow

### 5.1 Photo Capture During Trip

```
User is at checkpoint or during trip
    ↓
User clicks camera button or "Add Photo"
    ↓
Request camera/file access
    ↓
┌─────────────────────────────────────┐
│ Permission granted?                 │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Open camera/file    Show error message
picker
    ↓
User selects/captures photo
    ↓
Get current GPS location
    ↓
Create photo object:
{
  id: uuid()
  file: File
  objectUrl: URL.createObjectURL(file)
  timestamp: Date.now()
  lat: currentLatitude
  lng: currentLongitude
  caption: ""
}
    ↓
Store file in photoFilesRef Map
(key: photo.id, value: File)
    ↓
Add photo to checkpoint:
- If at checkpoint: addPhotoToCheckpoint(checkpointId, photo)
- If during trip: create temporary checkpoint or add to next checkpoint
    ↓
Display photo thumbnail:
- In checkpoint dialog
- On map as marker
- In trip summary
    ↓
User can:
- Add caption
- Add emoji mood
- Delete photo
```

### 5.2 Photo Upload Process

**During Trip:**
- Photos stored locally (objectUrl)
- File reference kept in memory
- Upload deferred until trip end

**On Trip End:**
```
Trip ends → saveTripData() called
    ↓
For each checkpoint:
  For each photo in checkpoint:
    ↓
    Get File from photoFilesRef
    ↓
    ┌───────────────────────────────┐
    │ Supabase connection available? │
    └───────────────────────────────┘
      │              │
     YES            NO
      │              │
      ↓              ↓
    Upload to     Store locally
    Supabase      only
    Storage
      ↓
    Create photo record:
    {
      trip_id: tripId
      checkpoint_id: checkpointId
      user_id: userId
      storage_path: "{userId}/{tripId}/{timestamp}-{filename}"
      latitude: photo.lat
      longitude: photo.lng
      caption: photo.caption
      emoji_mood: photo.emoji
      taken_at: photo.timestamp
    }
    ↓
    Get public URL from Supabase Storage
    ↓
    Update photo object with public URL
    ↓
Clear photoFilesRef after upload
```

### 5.3 Photo Viewing & Editing

**Photo Viewer (Full Screen):**
```
User clicks photo thumbnail
    ↓
Open PhotoViewer component
    ↓
Display photo in full screen
    ↓
User can:
- Swipe left/right to navigate photos
- Zoom (1x to 3x) with pinch/scroll
- View caption and emoji
- Edit caption
- Change emoji mood
- Delete photo
    ↓
Save changes:
- Update caption: updatePhotoCaption(photoId, caption, emoji)
- Delete: Delete from storage + database
```

**Caption Editing:**
```
User clicks "Edit Caption" button
    ↓
Show text input field
    ↓
User types caption
    ↓
User selects emoji (optional)
    ↓
User clicks "Save"
    ↓
Call updatePhotoCaption(photoId, caption, emoji)
    ↓
Update database record
    ↓
Refresh photo display
```

---

## 6. Journal/Diary Workflow

### 6.1 Journal Page Load

```
User navigates to /journal
    ↓
Check authentication
    ↓
Call loadTrips()
    ↓
┌─────────────────────────────────────┐
│ Load Trips Process                  │
└─────────────────────────────────────┘
    ↓
1. Get local trips (localStorage)
2. Get remote trips (Supabase)
3. Merge and deduplicate by ID
4. Sort by created_at DESC
    ↓
Display trip list:
- Chronological order (newest first)
- Each trip shows:
  * Thumbnail (first photo or emoji)
  * Destination/Origin
  * Distance, duration, date
  * Photo count
    ↓
User can:
- Scroll through trips
- Click trip to view details
- Filter trips (future feature)
```

### 6.2 Trip Detail View

```
User clicks on a trip
    ↓
Call handleSelectTrip(trip)
    ↓
┌─────────────────────────────────────┐
│ Photos already loaded?               │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Show trip details  Load photos from Supabase
    ↓
Call getTripPhotosList(tripId)
    ↓
Group photos by checkpoint_id
    ↓
Enrich checkpoints with photos:
- Map checkpoint_id → photos array
- Convert storage_path → public URL
- Add photo metadata (caption, emoji)
    ↓
Display trip details:
- Trip metadata (origin, destination, distance, duration)
- Checkpoint timeline
- Photos grouped by checkpoint
- AI-generated journal entry (if available)
```

### 6.3 AI Journal Entry Generation

```
User views trip details
    ↓
Check if journal entry exists
    ↓
┌─────────────────────────────────────┐
│ Journal entry exists?               │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Display entry    Show "Generate Entry" button
    ↓
User clicks "Generate Entry"
    ↓
Call generateJournalEntry(tripData)
    ↓
Construct prompt with:
- Trip date
- Route (origin → destination)
- Distance and duration
- Checkpoint names with photo counts
    ↓
Call Gemini API
    ↓
Generate first-person narrative:
- Conversational tone
- 2-3 paragraphs
- Sensory details
- Reflective content
    ↓
Display generated entry
    ↓
User can:
- Regenerate entry
- Edit entry (future feature)
- Copy entry
```

### 6.4 Photo Grid View

```
User views trip details
    ↓
Display photos in grid layout
    ↓
Photos grouped by checkpoint:
- Checkpoint name header
- Photo thumbnails below
- Chronological order within checkpoint
    ↓
User clicks photo thumbnail
    ↓
Open PhotoViewer in full screen
    ↓
User can navigate all trip photos
    ↓
See [Photo Management Workflow - Photo Viewing](#53-photo-viewing--editing)
```

---

## 7. Analytics & Insights Workflow

### 7.1 Stats Page Load

```
User navigates to /stats
    ↓
Check authentication
    ↓
Load trips and photos data
    ↓
Call calculateInsights(trips, photos)
    ↓
┌─────────────────────────────────────┐
│ Calculate Insights Process           │
└─────────────────────────────────────┘
    ↓
Calculate metrics:
1. Total Distance:
   - Sum all trip distances
   
2. Weekly Distance:
   - Filter trips from last 7 days
   - Sum distances
   
3. Monthly Distance:
   - Filter trips from last 30 days
   - Sum distances
   
4. Most Visited Location:
   - Count frequency of destinations
   - Return highest frequency location
   
5. Travel Frequency Classification:
   - Count unique days with trips
   - Classify:
     * 20+ days: "Adventure Seeker"
     * 10-19 days: "Active Traveler"
     * 5-9 days: "Regular Wanderer"
     * <5 days: "Relaxed Explorer"
   
6. Total Photos:
   - Count all photos across trips
   
7. Friendly Message:
   - Generate based on total distance:
     * <10km: "You've explored {distance}km gently..."
     * <50km: "{distance}km traveled!..."
     * <200km: "{distance}km of adventures!..."
     * ≥200km: "{distance}km traveled—you're incredible!"
   
8. Trips Per Day of Week:
   - Group trips by day of week
   - Count trips per day
    ↓
Display insights:
- Total distance card
- Weekly/monthly stats
- Most visited location
- Travel frequency badge
- Friendly message
- Day of week chart
- Photo count
```

### 7.2 Data Export

```
User clicks "Export Data" button
    ↓
Collect all user data:
- Trips (with route coordinates)
- Photos metadata
- Checkpoints
- Privacy settings
    ↓
Format as JSON
    ↓
Create downloadable file
    ↓
User downloads JSON file
    ↓
File contains:
{
  trips: [...]
  photos: [...]
  checkpoints: [...]
  privacy_settings: {...}
  export_date: ISO timestamp
}
```

---

## 8. Privacy Settings Workflow

### 8.1 Settings Page Load

```
User navigates to /settings
    ↓
Check authentication
    ↓
Call loadSettings()
    ↓
Call getPrivacySettings(userId)
    ↓
Load from Supabase:
- gps_tracking_enabled
- photo_geotagging_enabled
- allow_anonymous_sharing
- allow_research_data
    ↓
Display settings UI:
- GPS Tracking toggle
- Photo Geotagging toggle
- Privacy & Consent section
- Account management
```

### 8.2 Toggle GPS Tracking

```
User toggles GPS Tracking switch
    ↓
Call handleGpsToggle(newValue)
    ↓
Update local state
    ↓
Call updatePrivacySettings(userId, {
  gps_tracking_enabled: newValue
})
    ↓
Update Supabase database
    ↓
┌─────────────────────────────────────┐
│ Success?                             │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Show success toast  Revert toggle
Update UI          Show error message
    ↓
If disabled:
- Stop active GPS tracking
- Clear location watch
- Show message: "GPS tracking disabled"
```

### 8.3 Toggle Photo Geotagging

```
User toggles Photo Geotagging switch
    ↓
Call handlePhotosToggle(newValue)
    ↓
Update local state
    ↓
Call updatePrivacySettings(userId, {
  photo_geotagging_enabled: newValue
})
    ↓
Update Supabase database
    ↓
┌─────────────────────────────────────┐
│ Success?                             │
└─────────────────────────────────────┘
    │                    │
   YES                  NO
    │                    │
    ↓                    ↓
Show success toast  Revert toggle
Update UI          Show error message
    ↓
If disabled:
- Future photos won't include GPS data
- Existing photos unaffected
```

### 8.4 Update Privacy Consents

```
User updates consent toggles:
- Allow Anonymous Sharing
- Allow Research Data
    ↓
Call updatePrivacySettings(userId, {
  allow_anonymous_sharing: value
  allow_research_data: value
})
    ↓
Update Supabase database
    ↓
Show confirmation message
```

---

## 9. Data Synchronization Workflow

### 9.1 Local-First Architecture

**Data Storage Priority:**
1. **Local Storage (localStorage)**: Immediate, offline-first
2. **Supabase Database**: Cloud sync when online

**Trip Saving:**
```
Trip ends
    ↓
Try Supabase first:
  Call createTrip(tripData)
    ↓
  ┌───────────────────────────────┐
  │ Success?                       │
  └───────────────────────────────┘
    │              │
   YES            NO
    │              │
    ↓              ↓
  Upload photos  Save locally
  to Storage     only
    ↓
Always save to localStorage
(backup/offline support)
```

### 9.2 Data Merging Strategy

**Home Page Trip Loading:**
```
Page loads
    ↓
1. Load local trips (getLocalTrips)
    ↓
2. Load remote trips (getTrips from Supabase)
    ↓
3. Merge strategy:
   - Start with remote trips array
   - For each local trip:
     * Check if exists in remote (by ID)
     * If not found, add to merged array
   - Sort by created_at DESC
    ↓
4. Display merged trips
```

**Journal Page Trip Loading:**
```
Page loads
    ↓
1. Load local trips
    ↓
2. Load remote trips
    ↓
3. Merge and deduplicate:
   - Use trip ID as key
   - Prefer remote version if both exist
   - Add local-only trips
    ↓
4. For each trip:
   - If Supabase trip: Load photos from database
   - If local trip: Use embedded photos
    ↓
5. Display trips with photos
```

### 9.3 Offline Support

**When Offline:**
- All data saved to localStorage
- Photos stored as objectUrl (blob URLs)
- Trip data includes full checkpoint and photo data
- User can view all local trips

**When Back Online:**
- Future trips sync automatically
- Manual sync option (future feature):
  - Scan localStorage for unsynced trips
  - Upload to Supabase
  - Upload photos to Storage
  - Mark as synced

### 9.4 Photo Synchronization

**Upload Flow:**
```
Photo captured during trip
    ↓
Stored locally (objectUrl)
File reference kept in memory
    ↓
Trip ends
    ↓
For each photo:
  ┌───────────────────────────────┐
  │ Online?                        │
  └───────────────────────────────┘
    │              │
   YES            NO
    │              │
    ↓              ↓
  Upload to     Store in trip
  Supabase      data (localStorage)
  Storage
    ↓
  Create photo
  record in DB
    ↓
  Replace objectUrl
  with public URL
```

**Download Flow:**
```
Load trip from Supabase
    ↓
Get photo list (getTripPhotosList)
    ↓
For each photo:
  - Get storage_path
  - Convert to public URL (getPhotoPublicUrl)
  - Load image
    ↓
Display photos in UI
```

---

## 10. Error Handling & Edge Cases

### 10.1 GPS Errors

**Permission Denied:**
- Show error message
- Provide instructions to enable location
- Disable tracking features

**Location Unavailable:**
- Show "Location unavailable" message
- Allow manual location entry (future)
- Continue with limited features

**Poor Accuracy:**
- Discard locations with accuracy > 50m
- Show warning if many locations discarded
- Suggest moving to open area

### 10.2 Network Errors

**Supabase Connection Failed:**
- Fall back to localStorage
- Show "Offline mode" indicator
- Queue sync when online

**Photo Upload Failed:**
- Store photo locally
- Retry upload on next trip save
- Show warning message

### 10.3 AI Service Errors

**Gemini API Error:**
- Show error message
- Suggest checking API key
- Allow retry

**Geocoding Failure:**
- Show warning for unmapped checkpoints
- Allow manual location entry
- Continue with available checkpoints

### 10.4 Data Validation

**Invalid Trip Data:**
- Validate required fields
- Set defaults for missing data
- Show validation errors

**Photo File Errors:**
- Validate file type
- Check file size (<50MB)
- Show error for invalid files

---

## 11. Performance Optimizations

### 11.1 Lazy Loading

**Photos:**
- Load photos on-demand when trip selected
- Use thumbnails for initial display
- Full resolution on click

**Trips:**
- Paginate trip list (future)
- Virtual scrolling for large lists

### 11.2 Caching

**Trip Data:**
- Cache loaded trips in component state
- Invalidate cache on new trip save

**Photos:**
- Cache public URLs
- Use browser image caching

### 11.3 GPS Optimization

**Battery Efficiency:**
- Only track when trip active
- Use accuracy threshold to reduce updates
- Stop tracking when trip paused

**Update Frequency:**
- Maximum age: 3000ms
- Timeout: 5000ms
- High accuracy mode only when needed

---

## 12. User Journey Examples

### Example 1: Complete Trip Flow

```
1. User signs up → Onboarding → Home
2. User clicks "AI Trip Planner"
3. Enters: "Coffee walk in Indiranagar", selects 1hr
4. AI generates plan with 4 checkpoints
5. User clicks "Simulate Trip"
6. Map opens with checkpoints
7. User starts simulation
8. Simulation reaches each checkpoint
9. User adds photos at each checkpoint
10. User ends trip
11. Trip saved to Supabase + localStorage
12. User views trip in Journal
13. User generates AI journal entry
14. User views photos in grid
```

### Example 2: Real GPS Trip

```
1. User navigates to Map
2. User clicks "Start Trip"
3. GPS tracking begins
4. User walks around city
5. User clicks "Add Checkpoint" at interesting location
6. User adds photos with captions
7. User continues walking
8. User clicks "End Trip"
9. Trip data calculated (distance, duration)
10. Trip saved with route coordinates
11. Photos uploaded to Supabase Storage
12. Trip appears in Journal
13. User views trip on map with route
```

### Example 3: Privacy-First Usage

```
1. User signs up with privacy consents disabled
2. User navigates to Settings
3. User enables GPS tracking
4. User enables photo geotagging
5. User starts trip
6. Trip tracked with GPS
7. Photos geotagged
8. User disables GPS tracking
9. Future trips not tracked
10. User exports data
11. User reviews exported JSON
12. User can delete account (future)
```

---

## Summary

This workflow documentation covers all major processes in the CalmTrip application:

1. **Authentication**: Secure signup/login with privacy consent
2. **Dashboard**: Trip overview with AI planning
3. **AI Planning**: Natural language trip generation
4. **GPS Tracking**: Real-time location tracking with battery optimization
5. **Photo Management**: Capture, geotag, and organize photos
6. **Journal**: View trips and generate AI narratives
7. **Analytics**: Travel insights and statistics
8. **Privacy**: Granular control over data collection
9. **Sync**: Local-first with cloud backup

The system prioritizes user privacy, offline functionality, and seamless AI integration for an enhanced travel diary experience.
