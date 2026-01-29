import { motion } from "framer-motion";
import { Bell, Navigation, MapPin, ChevronRight, Sun, Cloud, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingCard } from "@/components/ui/floating-card";
import { StatCard } from "@/components/ui/stat-card";
import { Link } from "react-router-dom";
import mapPreview from "@/assets/map-preview.jpg";
import diaryEntry1 from "@/assets/diary-entry-1.jpg";
import diaryEntry2 from "@/assets/diary-entry-2.jpg";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="safe-top px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest to-sage flex items-center justify-center text-white font-bold">
            A
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Welcome back</p>
            <h1 className="font-display font-bold text-foreground">Good morning, Alex</h1>
          </div>
        </div>
        <Button variant="icon" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="px-4 space-y-6 pb-8">
        {/* Map Preview Card */}
        <FloatingCard className="p-0 overflow-hidden">
          <div className="relative h-48">
            <img
              src={mapPreview}
              alt="Today's journey map"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Active Tracking Badge */}
            <motion.div
              className="absolute top-3 left-3 flex items-center gap-2 bg-forest text-white px-3 py-1.5 rounded-full text-xs font-medium"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              ACTIVE TRACK
            </motion.div>

            {/* Location Label */}
            <div className="absolute bottom-3 left-3 text-white">
              <p className="text-sm opacity-80">San Francisco</p>
            </div>
          </div>

          {/* Journey Info */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Ongoing Discovery</p>
                <h2 className="font-display font-bold text-lg text-foreground">Today's Journey</h2>
                <p className="text-sm text-muted-foreground">Exploring the Marina District</p>
              </div>
              <Link to="/map">
                <Button variant="calm" size="sm">
                  View Map
                  <Navigation className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </FloatingCard>

        {/* Weekly Insights */}
        <section>
          <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-forest" />
            Weekly Insights
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Footprints className="w-4 h-4" />}
              label="Distance"
              value="42.5 km"
              trend="+15%"
              trendUp
            />
            <StatCard
              icon={<MapPin className="w-4 h-4" />}
              label="Adventures"
              value="12"
              trend="+2 trips"
              trendUp
            />
          </div>
        </section>

        {/* Recent Diary Entries */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-forest" />
              Recent Diary Entries
            </h3>
            <Link to="/journal" className="text-sm text-forest font-medium flex items-center gap-1">
              See all
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            <DiaryEntryCard
              image={diaryEntry1}
              title="Golden Gate Park"
              time="2:30 PM"
              duration="2.5 hours"
              weather="Sunny"
            />
            <DiaryEntryCard
              image={diaryEntry2}
              title="Lands End Lookout"
              time="Yesterday"
              duration="1.2 hours"
              weather="Windy"
            />
          </div>
        </section>

        {/* Add Entry FAB */}
        <motion.div
          className="fixed right-4 bottom-24 z-40"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="calm"
            size="icon-lg"
            className="w-14 h-14 rounded-full shadow-float"
          >
            <span className="text-2xl">+</span>
          </Button>
        </motion.div>
      </main>
    </div>
  );
}

interface DiaryEntryCardProps {
  image: string;
  title: string;
  time: string;
  duration: string;
  weather: string;
}

function DiaryEntryCard({ image, title, time, duration, weather }: DiaryEntryCardProps) {
  return (
    <motion.div
      className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-soft"
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <img
        src={image}
        alt={title}
        className="w-14 h-14 rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">{title}</h4>
        <p className="text-sm text-muted-foreground">
          {time} • {duration} • {weather === "Sunny" ? "☀️" : "💨"} {weather}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </motion.div>
  );
}
