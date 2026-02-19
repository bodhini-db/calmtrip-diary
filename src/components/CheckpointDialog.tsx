import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Play, ImagePlus } from "lucide-react";
import { Checkpoint, CheckpointPhoto } from "@/lib/supabase";

interface CheckpointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkpoint: Checkpoint | null;
  isSimPaused?: boolean;
  onUpdateName: (name: string) => void;
  /** Called once per selected file. `file` is the raw File for Supabase upload. */
  onAddPhoto: (photo: CheckpointPhoto, file: File) => void;
  onResume: () => void;
}

export function CheckpointDialog({
  open,
  onOpenChange,
  checkpoint,
  isSimPaused,
  onUpdateName,
  onAddPhoto,
  onResume,
}: CheckpointDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");

  // Sync name when checkpoint changes
  useEffect(() => {
    if (checkpoint) {
      setName(checkpoint.name);
    }
  }, [checkpoint?.id]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !checkpoint) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      const photo: CheckpointPhoto = {
        id: crypto.randomUUID(),
        objectUrl,
        caption: caption || undefined,
        timestamp: Date.now(),
      };
      onAddPhoto(photo, file);
    }

    setCaption("");
    e.target.value = "";
  };

  const handleResume = () => {
    if (name && checkpoint && name !== checkpoint.name) {
      onUpdateName(name);
    }
    onResume();
    onOpenChange(false);
  };

  const handleDone = () => {
    if (name && checkpoint && name !== checkpoint.name) {
      onUpdateName(name);
    }
    onOpenChange(false);
  };

  if (!checkpoint) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Prevent accidental close when sim is paused — must use Resume button
      if (!isOpen && isSimPaused) return;
      if (!isOpen) handleDone();
    }}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl" onPointerDownOutside={(e) => {
        if (isSimPaused) e.preventDefault();
      }}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isSimPaused ? "You've arrived!" : "Checkpoint"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-left">
            {isSimPaused
              ? "Take your time! Add photos and a caption before continuing."
              : (checkpoint.description || "Add details and photos for this stop")}
          </DialogDescription>
        </DialogHeader>

        {/* Name input */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name && name !== checkpoint.name) onUpdateName(name);
            }}
            placeholder="Name this checkpoint..."
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Caption + Add Photo */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Caption</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's happening here..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Button
              variant="calm"
              size="icon"
              className="shrink-0 w-10 h-10"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Type a caption, then tap the + to pick photos</p>
        </div>

        {/* Photo gallery */}
        {(checkpoint.photos?.length ?? 0) > 0 ? (
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
              Photos ({checkpoint.photos?.length ?? 0})
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(checkpoint.photos ?? []).map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden border-2 border-white shadow-sm">
                    <img
                      src={photo.objectUrl}
                      alt={photo.caption || "Photo"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {photo.caption && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate px-0.5">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-green-200 bg-green-50/50 rounded-xl p-5 text-center cursor-pointer hover:bg-green-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-8 h-8 mx-auto text-green-400 mb-2" />
            <p className="text-sm font-medium text-green-700">Tap to add photos</p>
            <p className="text-xs text-green-600/70 mt-0.5">Capture this moment</p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelected}
        />

        {/* Action buttons */}
        <div className="space-y-2 pt-1">
          {isSimPaused ? (
            <Button
              variant="calm"
              className="w-full h-12 text-base font-semibold"
              onClick={handleResume}
            >
              <Play className="w-5 h-5 mr-2" />
              Resume Trip
            </Button>
          ) : (
            <Button
              variant="calm"
              className="w-full"
              onClick={handleDone}
            >
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
