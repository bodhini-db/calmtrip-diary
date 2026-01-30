import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoViewerProps {
  photos: Array<{ id: string; url: string; caption?: string; emoji?: string }>;
  initialIndex?: number;
  onClose: () => void;
  onSaveCaption?: (photoId: string, caption: string, emoji?: string) => void;
  onDelete?: (photoId: string) => void;
}

export const PhotoViewer = ({
  photos,
  initialIndex = 0,
  onClose,
  onSaveCaption,
  onDelete,
}: PhotoViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(photos[currentIndex]?.caption || "");
  const [emoji, setEmoji] = useState(photos[currentIndex]?.emoji || "");
  const imgRef = useRef<HTMLImageElement>(null);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    setCaption(currentPhoto?.caption || "");
    setEmoji(currentPhoto?.emoji || "");
    setZoom(1);
  }, [currentIndex, currentPhoto]);

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSaveCaption = () => {
    if (onSaveCaption) {
      onSaveCaption(currentPhoto.id, caption, emoji);
    }
    setIsEditing(false);
  };

  const emojiOptions = ["😍", "🥰", "😎", "🤩", "😋", "😌", "🥳", "😊", "🌟", "✨", "💚", "🗺️"];

  return (
    <motion.div
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-black/50 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
        <span className="text-white text-sm">
          {currentIndex + 1} / {photos.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (onDelete) {
              onDelete(currentPhoto.id);
              if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
            }
          }}
          className="text-red-400 hover:bg-red-400/10"
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Image Display */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <motion.img
          key={currentPhoto.id}
          src={currentPhoto.url}
          alt="Photo"
          className="max-w-full max-h-full object-contain cursor-move"
          style={{
            scale: zoom,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          ref={imgRef}
        />

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="absolute left-4 text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            {currentIndex < photos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 text-white hover:bg-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-4 space-y-4 bg-black/50 backdrop-blur">
        {/* Caption Display/Edit */}
        {!isEditing ? (
          <motion.div
            className="bg-white/10 rounded-lg p-4 cursor-pointer"
            onClick={() => setIsEditing(true)}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            {caption || emoji ? (
              <div className="space-y-2">
                {emoji && <div className="text-4xl">{emoji}</div>}
                <p className="text-white text-sm">{caption || "Add a caption..."}</p>
              </div>
            ) : (
              <p className="text-white/50 text-sm">Add caption and mood...</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3 bg-white/10 rounded-lg p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your thoughts..."
              className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
            />

            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(emoji === e ? "" : e)}
                  className={`text-2xl p-2 rounded transition-all ${
                    emoji === e ? "bg-emerald-500/30 scale-110" : "hover:bg-white/10"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="calm"
                size="sm"
                className="flex-1"
                onClick={handleSaveCaption}
              >
                Save
              </Button>
            </div>
          </motion.div>
        )}

        {/* Zoom Controls */}
        <div className="flex gap-2 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(1, zoom - 0.25))}
            className="text-white hover:bg-white/10"
            disabled={zoom <= 1}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white text-xs px-2 py-1">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="text-white hover:bg-white/10"
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
