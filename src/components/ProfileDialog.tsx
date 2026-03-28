import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { updateProfile, uploadAvatar, getProfileFromUser } from "@/lib/api";
import { toast } from "sonner";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  onProfileUpdated: () => void;
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  onProfileUpdated,
}: ProfileDialogProps) {
  const queryClient = useQueryClient();
  const profile = getProfileFromUser(user);
  const [username, setUsername] = useState(profile.full_name || user.email?.split("@")[0] || "Traveler");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when dialog opens
  useEffect(() => {
    if (open) {
      const p = getProfileFromUser(user);
      setUsername(p.full_name || user.email?.split("@")[0] || "Traveler");
      setAvatarUrl(p.avatar_url || "");
    }
  }, [open, user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      setAvatarUrl(url);
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Photo uploaded");
    } catch (error) {
      console.error("Avatar upload failed:", error);
      const msg =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: string }).message)
          : "Failed to upload photo.";
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: username.trim() || undefined,
        avatar_url: avatarUrl || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      onProfileUpdated();
      onOpenChange(false);
      toast.success("Profile updated");
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={uploading}
              className="relative group"
            >
              <Avatar className="h-24 w-24 border-4 border-emerald-100">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Profile" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-forest to-sage text-2xl text-white">
                  {username.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">Tap to change photo</p>
          </div>

          {/* Username */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Email (read-only) */}
          {user.email && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Email</label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="calm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
