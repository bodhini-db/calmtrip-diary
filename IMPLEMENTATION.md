# CalmTrip - Mindful Travel Diary 🧳

A privacy-first travel tracking and journaling app built with React, TypeScript, and Supabase.

## ✨ Features Implemented

### 🔐 **Authentication & Onboarding**
- Email signup/login with Supabase Auth
- Interactive onboarding with privacy consent screens
- Gentle animations and calm UI design
- Session persistence and automatic logout

### 📍 **Smart Trip Detection**
- Background GPS tracking with intelligent trip detection
- Automatic start/end detection based on movement and time thresholds
- Distance calculation using Haversine formula
- Battery-optimized location tracking

### 🗺️ **Map Integration**
- Full Mapbox integration with pastel green route visualization
- Real-time trip route display on interactive map
- Smooth camera transitions
- Trip stats display (distance, duration, photo count)

### 📸 **Photo Management**
- Geo-tagged photo capture during trips
- Auto-geolocation using device GPS
- Photos stored in Supabase Storage
- Metadata (location, time, caption, mood) in PostgreSQL

### 🎬 **Instagram-Style Photo Viewer**
- Full-screen image viewer with swipe navigation
- Zoom support (1x to 3x)
- Caption and mood emoji editor
- Photo deletion with confirmation
- Smooth transitions and animations

### 📖 **Travel Diary**
- Chronological timeline of trips
- Photos grouped by trip
- Grid view for quick browsing
- Trip filtering and selection
- Lazy loading for performance

### 📊 **Analytics & Insights**
- Total distance traveled
- Most visited locations
- Travel frequency classification
- Weekly and monthly statistics
- Friendly, encouraging messages
- Rule-based insights (no paid AI)

### 🔒 **Privacy & Data Control**
- Toggle GPS tracking on/off
- Photo geotagging control
- Opt-in anonymized data sharing for research
- Data export functionality (JSON format)
- Full transparency on data usage

### 🎨 **UI/UX**
- Soft, calming design with pastel colors
- Framer Motion animations throughout
- Responsive mobile-first layout
- Floating cards and gentle interactions
- Dark mode ready

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Animations**: Framer Motion
- **Backend/Auth**: Supabase (PostgreSQL + Auth)
- **Maps**: Mapbox GL
- **State Management**: React Query
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun
- Supabase account
- Mapbox account (free tier)

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_TOKEN=your_mapbox_public_token
```

### Database Setup

Create these tables in your Supabase database:

```sql
-- Privacy Settings
CREATE TABLE privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  gps_tracking_enabled BOOLEAN DEFAULT true,
  photo_geotagging_enabled BOOLEAN DEFAULT true,
  allow_anonymous_sharing BOOLEAN DEFAULT false,
  allow_research_data BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT now()
);

-- Trips
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  origin TEXT,
  destination TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  distance_km FLOAT NOT NULL,
  duration_minutes INT NOT NULL,
  route_coordinates JSONB,
  purpose TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Photos
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  storage_path TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  caption TEXT,
  emoji_mood TEXT,
  taken_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

### Storage Setup

Create a storage bucket in Supabase:
- Bucket name: `photos`
- Make it public for easy access

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
src/
├── pages/
│   ├── Onboarding.tsx       # Auth & consent screens
│   ├── Home.tsx              # Dashboard with today's journey
│   ├── MapView.tsx           # Interactive map with trip tracking
│   ├── Journal.tsx           # Travel diary with photo timeline
│   ├── Stats.tsx             # Analytics and insights
│   └── Settings.tsx          # User preferences and privacy
├── components/
│   ├── auth/
│   │   └── OnboardingAuth.tsx
│   ├── PhotoViewer.tsx       # Full-screen photo viewer
│   ├── layout/
│   └── ui/                   # Shadcn components
├── hooks/
│   ├── useAuth.ts            # Authentication state
│   ├── useTripDetector.ts    # GPS tracking logic
│   └── use-toast.ts
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── api.ts                # Database operations
│   └── insights.ts           # Analytics calculations
└── assets/                   # Images & static files
```

## 🔄 Data Flow

1. **User Registration** → Supabase Auth → Privacy settings created
2. **Trip Start** → GPS tracking begins → Location points stored in memory
3. **Trip End** → Trip data saved to DB → Photos synced
4. **Photo Upload** → File stored in Supabase Storage → Metadata in DB
5. **Dashboard** → Queries trips/photos → Calculates insights → Displays stats

## 🎯 Core Algorithms

### Trip Detection
- Movement threshold: 100m triggers trip start
- Inactivity timeout: 1 minute of no movement ends trip
- Accuracy requirement: GPS accuracy < 50m

### Distance Calculation
- Haversine formula for great-circle distance
- Earth radius: 6,371 km
- Per-point accuracy within 50m

### Insights
- Weekly/monthly aggregation with date filtering
- Location frequency for "most visited" calculation
- Travel frequency classification:
  - 20+ days: Adventure Seeker
  - 10-19 days: Active Traveler
  - 5-9 days: Regular Wanderer
  - <5 days: Relaxed Explorer

## 🔒 Privacy Features

- ✅ All user data stays on Supabase servers (user's own database)
- ✅ GPS tracking can be disabled anytime
- ✅ No third-party tracking or analytics
- ✅ Optional anonymized research data sharing
- ✅ One-click data export
- ✅ Clear privacy disclosures

## 🚧 Future Enhancements

- **Destination Suggestions**: POI discovery along routes
- **Social Features**: Trip sharing with friends
- **ML Insights**: Pattern detection (commute vs. leisure)
- **Offline Support**: Service workers for offline mode
- **Real-time Sync**: WebSocket updates for multi-device
- **Advanced Exports**: GPX, KML formats
- **Notifications**: Travel reminders and achievements

## 📱 Platform Support

- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Desktop browsers
- ✅ PWA-ready (can be installed as app)

## 🧪 Testing

```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
npm run lint        # ESLint check
```

## 📦 Deployment

### Build for Production
```bash
npm run build
npm run preview
```

### Deploy to Vercel
```bash
vercel
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir=dist
```

## 📄 License

MIT - Free to use and modify

## 🙏 Acknowledgments

- Built for SDG 9 (Industry, Innovation, Infrastructure)
- Inspired by mindful travel practices
- Thanks to the open-source community

## 💚 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

**Version**: 1.0.0
**Last Updated**: January 29, 2026
**Status**: Fully Functional ✨
