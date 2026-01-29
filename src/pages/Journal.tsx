import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Calendar, Image as ImageIcon, Heart, MessageCircle, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import diaryEntry1 from "@/assets/diary-entry-1.jpg";
import diaryEntry2 from "@/assets/diary-entry-2.jpg";
import mapPreview from "@/assets/map-preview.jpg";

const tripData = {
  title: "San Francisco Exploration",
  location: "San Francisco, California",
  dates: "Jan 25 - Jan 29, 2026",
  stats: "14 Stops • 42 Photos",
  entries: [
    {
      id: 1,
      time: "09:30 AM",
      title: "Arrived at Golden Gate Park",
      description: "The morning sun filtering through the trees was absolutely breathtaking. The reflection on the water was perfectly still. It felt like a dream.",
      image: diaryEntry1,
      likes: 24,
      comments: 3,
    },
    {
      id: 2,
      time: "01:45 PM",
      title: "Lunch break at Ferry Building",
      description: "The queue was long but totally worth the wait. The broth was so rich and creamy!",
      image: null,
      likes: 17,
      comments: 5,
    },
    {
      id: 3,
      time: "05:20 PM",
      title: "Sunset at Lands End",
      description: "The sound of the bamboo stalks swaying in the wind is something I'll never forget. So peaceful.",
      image: diaryEntry2,
      likes: 45,
      comments: 8,
    },
  ],
};

export default function Journal() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Hero Image */}
      <div className="relative h-64">
        <img
          src={mapPreview}
          alt="Trip cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-0 left-0 right-0 safe-top px-4 py-3 flex items-center justify-between">
          <Link to="/home">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Share className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm opacity-90">{tripData.location}</span>
          </div>
          <h1 className="font-display font-bold text-2xl">{tripData.title}</h1>
          <p className="text-sm opacity-80 mt-1">{tripData.dates}</p>
          <p className="text-xs mt-2 opacity-70">{tripData.stats}</p>
        </div>
      </div>

      {/* Timeline */}
      <main className="px-4 py-6 space-y-6">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-forest via-sage to-mint" />

          {/* Entries */}
          <div className="space-y-6">
            {tripData.entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="relative flex gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Timeline Dot */}
                <div className="relative z-10 mt-1">
                  <div className="timeline-dot" />
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-card rounded-2xl shadow-soft overflow-hidden">
                  {/* Time Badge */}
                  <div className="px-4 pt-3">
                    <span className="text-xs font-medium text-forest bg-mint px-2 py-1 rounded-full">
                      {entry.time}
                    </span>
                  </div>

                  {/* Image */}
                  {entry.image && (
                    <div className="mt-3 mx-4">
                      <img
                        src={entry.image}
                        alt={entry.title}
                        className="w-full h-40 object-cover rounded-xl"
                      />
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="p-4">
                    <h3 className="font-display font-semibold text-foreground mb-2">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {entry.description}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-forest transition-colors">
                        <Heart className="w-4 h-4" />
                        <span className="text-xs font-medium">{entry.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-forest transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{entry.comments}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Add Entry Button */}
        <div className="pt-4">
          <Button variant="soft" className="w-full">
            <ImageIcon className="w-4 h-4" />
            Add Memory
          </Button>
        </div>
      </main>
    </div>
  );
}
