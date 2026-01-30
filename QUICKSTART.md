# CalmTrip - Quick Start Guide

Welcome to CalmTrip! This guide will help you get up and running in 5 minutes.

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- Mapbox account (free tier available)
- Modern web browser with geolocation support

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone & Install (1 min)
```bash
npm install
```

### Step 2: Create Supabase Project (2 min)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project (free tier is fine)
3. In your Supabase dashboard, go to **SQL Editor**
4. Copy the entire SQL schema from `DATABASE_SCHEMA.md`
5. Paste it into the SQL Editor and run it

### Step 3: Create Storage Bucket (30 sec)

1. In Supabase, go to **Storage**
2. Create a new bucket named `photos`
3. Click on the bucket and set it to **Public** (optional, for direct image URLs)

### Step 4: Get Your Credentials (1 min)

**Supabase:**
- Go to **Project Settings** → **API**
- Copy your **Project URL** (VITE_SUPABASE_URL)
- Copy **anon public** key (VITE_SUPABASE_ANON_KEY)

**Mapbox:**
- Go to [mapbox.com](https://mapbox.com) and sign up
- In your **Account** page, copy your **public token** (VITE_MAPBOX_TOKEN)

### Step 5: Environment Setup (30 sec)

Create `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_MAPBOX_TOKEN=your-mapbox-token-here
```

### Step 6: Start Development (30 sec)

```bash
npm run dev
```

Open your browser to `http://localhost:5173` and enjoy! 🎉

## 🧭 First Steps

1. **Onboarding**: Create an account with email/password
2. **Grant Permissions**: Accept GPS tracking and research data sharing
3. **Home**: View your travel insights dashboard
4. **Map View**: Start a trip by clicking the Start button
5. **Journal**: Browse your trips and view photos
6. **Stats**: Check your travel analytics
7. **Settings**: Adjust privacy preferences

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.ts         # Supabase client & auth
│   ├── api.ts              # CRUD operations
│   └── insights.ts         # Analytics engine
├── hooks/
│   ├── useAuth.ts          # Auth state management
│   └── useTripDetector.ts  # GPS tracking & detection
├── pages/
│   ├── Onboarding.tsx      # Welcome + signup
│   ├── Home.tsx            # Dashboard
│   ├── MapView.tsx         # Trip mapping
│   ├── Journal.tsx         # Photo gallery
│   ├── Stats.tsx           # Analytics
│   └── Settings.tsx        # Preferences
└── components/
    ├── PhotoViewer.tsx     # Full-screen photo viewer
    └── layout/
        └── AppLayout.tsx   # Navigation wrapper
```

## 🎨 Features

- ✅ **User Authentication**: Secure Supabase auth with email/password
- ✅ **Trip Detection**: Automatic GPS tracking with 100m movement threshold
- ✅ **Live Mapping**: Real-time route visualization with Mapbox
- ✅ **Photo Management**: Capture, geotag, and organize travel photos
- ✅ **Travel Diary**: Browse trips and photos in timeline format
- ✅ **Analytics**: Personalized travel insights and statistics
- ✅ **Privacy Controls**: Full control over data collection and sharing
- ✅ **Offline Support**: Works with limited connectivity

## 🐛 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install
```

### "VITE_SUPABASE_URL is not defined"
- Check that `.env.local` exists
- Verify all three environment variables are set
- Restart the dev server with `Ctrl+C` then `npm run dev`

### Geolocation not working
- Check browser permissions (allow location access)
- HTTPS is required for production (dev server uses HTTP locally)
- Test on a real device with GPS capability

### Map not showing routes
- Verify Mapbox token is valid
- Check browser console for errors
- Ensure trips have GPS coordinates

### Storage errors when uploading photos
- Verify "photos" bucket exists in Supabase
- Check bucket permissions
- Ensure file size is under 5MB

## 📚 Documentation

- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Feature details, tech stack, algorithms
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - SQL schema, RLS policies, queries

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag & drop dist/ folder to Netlify
```

### Environment Variables for Production
Set these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPBOX_TOKEN`

## 💡 Tips

- **Save Data**: Turn off GPS tracking when not traveling to save battery
- **Privacy**: All data is stored locally first before syncing (when online)
- **Export**: Export your travel data as JSON from Stats page
- **Share**: Use the share button to send trip details with friends

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review [IMPLEMENTATION.md](./IMPLEMENTATION.md) for technical details
3. Check browser console for error messages
4. Visit [Supabase Docs](https://supabase.com/docs) for backend issues
5. Visit [Mapbox Docs](https://docs.mapbox.com) for mapping issues

## 🎯 Next Steps

- Implement smart destination suggestions (Task 6)
- Add offline support with Service Workers
- Add photo filters and effects
- Implement social sharing features
- Add friends/groups functionality

---

**Enjoy your CalmTrip adventure!** 🧳✨
