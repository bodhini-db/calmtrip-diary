import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export interface FeedCardEntry {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  created_at: string;
  location?: string | null;
  distance_km?: number | null;
  duration_minutes?: number | null;
  cover_image_url?: string | null;
  profiles?: Array<{
    username: string;
    avatar_url?: string | null;
  }> | null;
}

interface FeedCardProps {
  entry: FeedCardEntry;
}

export function FeedCard({ entry }: FeedCardProps) {
  const navigate = useNavigate();
  const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);

  useEffect(() => {
    const storedLiked = window.localStorage.getItem(`feed-liked-${entry.id}`);
    const storedLikes = window.localStorage.getItem(`feed-likes-${entry.id}`);
    const storedComments = window.localStorage.getItem(`feed-comments-${entry.id}`);
    if (storedLiked) setLiked(storedLiked === 'true');
    if (storedLikes) setLikes(Number(storedLikes));
    if (storedComments) setComments(Number(storedComments));
  }, [entry.id]);

  const openTrip = () => {
    navigate(`/journal/${entry.user_id}/${entry.id}`);
  };

  const handleLike = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const nextLiked = !liked;
    const nextLikes = nextLiked ? likes + 1 : Math.max(0, likes - 1);
    setLiked(nextLiked);
    setLikes(nextLikes);
    window.localStorage.setItem(`feed-liked-${entry.id}`, String(nextLiked));
    window.localStorage.setItem(`feed-likes-${entry.id}`, String(nextLikes));
  };

  const handleComment = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const comment = window.prompt('Add a comment to this trip');
    if (comment && comment.trim()) {
      const next = comments + 1;
      setComments(next);
      window.localStorage.setItem(`feed-comments-${entry.id}`, String(next));
    }
  };

  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const shareUrl = `${window.location.origin}/journal/${entry.user_id}/${entry.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: entry.title, text: entry.description || '', url: shareUrl });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    window.alert('Journal link copied to clipboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden shadow-soft border border-border cursor-pointer" onClick={openTrip}>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar>
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.username} />
                ) : (
                  <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() ?? 'T'}</AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{profile?.username || 'Traveler'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Journal</span>
          </div>
        </CardHeader>

        {entry.cover_image_url && (
          <div className="px-4 -mt-1 pb-3">
            <div className="relative w-full overflow-hidden rounded-2xl bg-muted aspect-[16/10]">
              <img
                src={entry.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}

        <CardContent className="space-y-4 p-4 pt-0">
          <CardTitle className="text-lg">{entry.title || 'Untitled journey'}</CardTitle>

          {entry.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{entry.location}</span>
            </div>
          )}

          <CardDescription className="text-sm text-muted-foreground">
            {entry.description || 'No journal text available.'}
          </CardDescription>

          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="rounded-2xl bg-muted p-2">
              <p className="font-medium text-foreground">Distance</p>
              <p>{entry.distance_km ? `${entry.distance_km.toFixed(1)} km` : '—'}</p>
            </div>
            <div className="rounded-2xl bg-muted p-2">
              <p className="font-medium text-foreground">Duration</p>
              <p>{entry.duration_minutes ? `${entry.duration_minutes} min` : '—'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/70">
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              type="button"
              onClick={handleLike}
            >
              <Heart className="w-4 h-4" />
              <span>{liked ? 'Liked' : 'Like'}{likes > 0 ? ` · ${likes}` : ''}</span>
            </button>
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              type="button"
              onClick={handleComment}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Comment{comments > 0 ? ` · ${comments}` : ''}</span>
            </button>
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              type="button"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
