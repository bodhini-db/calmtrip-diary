import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FloatingCard } from "@/components/ui/floating-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Share2, MapPin, Image as ImageIcon, Clock, Navigation, Camera } from "lucide-react";
import { toast } from "sonner";
import { getTrips, getTripPhotosList, getPhotoPublicUrl } from "@/lib/api";
import { useIsFollowing } from "@/hooks/useFollow";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AiJournalWriter } from "@/components/AiJournalWriter";
import { getLocalTrips } from "@/lib/localTrips";
import { PhotoViewer } from "@/components/PhotoViewer";

const Journal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const targetUserId = params.userId ?? user?.id;
  const targetTripId = params.tripId;
  const isOwnJournal = !params.userId || params.userId === user?.id;
  const { data: isFollowing = false, isLoading: isFollowingLoading } = useIsFollowing(targetUserId || '');
  const { data: profile, isLoading: profileLoading } = useUserProfile(targetUserId);
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [viewerPhotos, setViewerPhotos] = useState<any[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; author: string; text: string; created_at: string }>>([]);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const hydrateTrip = async (trip: any) => {
    if (!trip || trip._local || trip._photosLoaded) return trip;
    setLoadingPhotos(true);

    try {
      const photos = await getTripPhotosList(trip.id);
      const byCheckpoint = new Map<string, any[]>();
      for (const p of photos) {
        const key = p.checkpoint_id || '__uncategorized__';
        if (!byCheckpoint.has(key)) byCheckpoint.set(key, []);
        byCheckpoint.get(key)!.push({
          id: p.id,
          objectUrl: getPhotoPublicUrl(p.storage_path),
          caption: p.caption,
          timestamp: new Date(p.taken_at).getTime(),
        });
      }

      const enrichedCheckpoints = (trip.checkpoints || []).map((cp: any) => ({
        ...cp,
        photos: byCheckpoint.get(cp.id) || [],
      }));

      const enriched = { ...trip, _checkpoints: enrichedCheckpoints, _photosLoaded: true };
      setTrips(prev => prev.map((t: any) => t.id === trip.id ? enriched : t));
      return enriched;
    } catch {
      return trip;
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
      return;
    }

    if (!user || !targetUserId) return;

    if (isOwnJournal || isFollowing) {
      loadTrips(targetUserId);
    } else if (!isFollowingLoading) {
      setTrips([]);
      setSelectedTrip(null);
    }
  }, [user, loading, targetUserId, isOwnJournal, isFollowing, isFollowingLoading, navigate]);

  useEffect(() => {
    if (!selectedTrip) {
      setComments([]);
      return;
    }

    const stored = window.localStorage.getItem(`journal-comments-${selectedTrip.id}`);
    if (stored) {
      try {
        setComments(JSON.parse(stored));
      } catch {
        setComments([]);
      }
    } else {
      setComments([]);
    }
  }, [selectedTrip?.id]);

  const persistComments = (tripId: string, nextComments: Array<{ id: string; author: string; text: string; created_at: string }>) => {
    window.localStorage.setItem(`journal-comments-${tripId}`, JSON.stringify(nextComments));
  };

  const handleAddComment = async () => {
    if (!selectedTrip || !commentText.trim()) return;
    setCommentSubmitting(true);
    const nextComment = {
      id: `${Date.now()}`,
      author: user?.user_metadata?.full_name || user?.email || 'You',
      text: commentText.trim(),
      created_at: new Date().toISOString(),
    };
    const nextComments = [...comments, nextComment];
    setComments(nextComments);
    persistComments(selectedTrip.id, nextComments);
    setCommentText('');
    setCommentSubmitting(false);
  };

  const loadTrips = async (ownerId: string) => {
    if (!user) return;

    let supabaseTrips: any[] = [];
    try {
      const raw = await getTrips(ownerId);
      // Mark as Supabase trips; photos loaded on demand
      supabaseTrips = raw.map(t => ({
        ...t,
        _local: false,
        _checkpoints: (t.checkpoints || []).map((cp: any) => ({
          ...cp,
          photos: [], // populated lazily when trip is opened
        })),
        _photosLoaded: false,
      }));
    } catch {
      // Supabase unavailable — fall back to local only
    }

    if (supabaseTrips.length > 0) {
      const previewPhotos = await Promise.all(
        supabaseTrips.map(async (trip) => {
          try {
            const photos = await getTripPhotosList(trip.id);
            return {
              tripId: trip.id,
              previewPhotoUrl: photos.length > 0 ? getPhotoPublicUrl(photos[0].storage_path) : null,
            };
          } catch {
            return { tripId: trip.id, previewPhotoUrl: null };
          }
        })
      );
      supabaseTrips = supabaseTrips.map((trip) => {
        const preview = previewPhotos.find((record) => record.tripId === trip.id);
        return { ...trip, _previewPhotoUrl: preview?.previewPhotoUrl ?? null };
      });
    }

    const localTrips = getLocalTrips(user.id).map(lt => {
      const firstLocalPhoto = lt.checkpoints
        .flatMap((cp: any) => cp.photos || [])
        .find((photo: any) => photo.objectUrl)?.objectUrl;

      return {
        ...lt,
        _local: true,
        _checkpoints: lt.checkpoints,
        _photosLoaded: true,
        _previewPhotoUrl: firstLocalPhoto ?? null,
      };
    });

    // Merge: Supabase is source of truth; local fills gaps
    const merged = [...supabaseTrips];
    for (const lt of localTrips) {
      if (!merged.some(t => t.id === lt.id)) merged.push(lt);
    }
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setTrips(merged);
    if (targetTripId) {
      const selected = merged.find((trip) => trip.id === targetTripId);
      if (selected) {
        const hydrated = await hydrateTrip(selected);
        setSelectedTrip(hydrated);
      }
    }
  };

  /**
   * When a Supabase trip is selected, load its photos from the photos table,
   * convert storage_path → public URL, and reconstruct checkpoint photo arrays.
   */
  const handleSelectTrip = async (trip: any) => {
    const hydrated = await hydrateTrip(trip);
    setSelectedTrip(hydrated);
  };

  const getTripPhotos = (trip: any) => {
    if (!trip._checkpoints) return [];
    return trip._checkpoints.flatMap((cp: any) =>
      (cp.photos || []).map((p: any) => ({
        id: p.id,
        url: p.objectUrl,
        caption: p.caption || cp.name,
        checkpointName: cp.name,
      }))
    );
  };

  const getTripCheckpoints = (trip: any): any[] => trip._checkpoints || [];

  const getTotalPhotos = (trip: any) =>
    (trip._checkpoints || []).reduce((sum: number, cp: any) => sum + (cp.photos?.length || 0), 0);

  const handleShareTrip = async (trip: any) => {
    const checkpoints = getTripCheckpoints(trip);
    const totalPhotos = getTotalPhotos(trip);
    const date = new Date(trip.start_time || trip.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
    const text = [
      `My CalmTrip Journey`,
      `${trip.destination || trip.origin || "Trip"} - ${date}`,
      `${trip.distance_km?.toFixed(1) || 0}km traveled`,
      `${checkpoints.length} stops | ${totalPhotos} photos`,
      trip.duration_minutes ? `Duration: ${trip.duration_minutes} min` : "",
      "",
      "Tracked with CalmTrip - mindful travel journaling",
    ].filter(Boolean).join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "My CalmTrip Journey", text });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Trip summary copied to clipboard!");
  };

  const openPhotoViewer = (trip: any, photoIndex: number) => {
    const photos = getTripPhotos(trip);
    setViewerPhotos(photos);
    setSelectedPhotoIndex(photoIndex);
    setShowViewer(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading diary...</p>
      </div>
    );
  }

  if (!isOwnJournal && params.userId && !isFollowing && !isFollowingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
          <h1 className="text-2xl font-semibold text-foreground mb-3">Journal locked</h1>
          <p className="text-sm text-muted-foreground">
            Follow this traveler to read their journal entries.
          </p>
        </div>
      </div>
    );
  }

  // ── Trip detail (timeline) view ──────────────────────────────
  if (selectedTrip) {
    const checkpoints = getTripCheckpoints(selectedTrip);
    const allPhotos = getTripPhotos(selectedTrip);
    const totalPhotos = getTotalPhotos(selectedTrip);

    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Trip Header */}
        <header className="safe-top px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <Button variant="icon" size="icon" onClick={() => setSelectedTrip(null)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display font-bold text-foreground">
              {selectedTrip.destination || selectedTrip.origin || "Trip"}
            </h1>
            <Button variant="icon" size="icon" onClick={() => handleShareTrip(selectedTrip)}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center text-3xl shadow-md">
              🗺️
            </div>
            <h2 className="font-display font-bold text-xl text-foreground">
              {selectedTrip.destination || selectedTrip.origin}
            </h2>
            <p className="text-sm text-emerald-600 font-medium mt-1">
              {new Date(selectedTrip.start_time || selectedTrip.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            <div className="flex justify-center gap-3 mt-3">
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200">
                {checkpoints.length} Stops
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200">
                {totalPhotos} Photos
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200">
                {selectedTrip.distance_km?.toFixed(1)}km
              </span>
            </div>
          </motion.div>
        </header>

        {/* Loading photos indicator */}
        {loadingPhotos && (
          <div className="px-4 mb-4">
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-600 animate-pulse">Loading photos...</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <main className="px-4">
          {checkpoints.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-400 via-emerald-300 to-emerald-100" />

              <div className="space-y-0">
                {checkpoints.map((cp: any, idx: number) => {
                  const cpPhotos = cp.photos || [];
                  const time = cp.timestamp
                    ? new Date(cp.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    : "";

                  return (
                    <motion.div
                      key={cp.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.15 }}
                      className="relative pl-12 pb-8"
                    >
                      <div className="absolute left-2.5 top-1 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-white shadow-sm z-10" />

                      {time && (
                        <p className="text-xs font-semibold text-emerald-600 mb-1">{time}</p>
                      )}

                      <h3 className="font-display font-bold text-foreground text-base mb-1">
                        Arrived at {cp.name}
                      </h3>

                      {cp.description && (
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          {cp.description}
                        </p>
                      )}

                      {cpPhotos.length > 0 && (
                        <div className={`mt-2 ${cpPhotos.length === 1 ? "" : "grid grid-cols-2 gap-2"}`}>
                          {cpPhotos.map((photo: any, pIdx: number) => {
                            const globalIdx = allPhotos.findIndex((p: any) => p.id === photo.id);
                            return (
                              <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.15 + pIdx * 0.05 }}
                                onClick={() => openPhotoViewer(selectedTrip, globalIdx >= 0 ? globalIdx : 0)}
                                className={`relative rounded-xl overflow-hidden cursor-pointer group shadow-sm ${
                                  cpPhotos.length === 1 ? "aspect-[16/10]" : "aspect-square"
                                }`}
                              >
                                <img
                                  src={photo.objectUrl}
                                  alt={photo.caption || cp.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {cpPhotos.length === 0 && idx < checkpoints.length - 1 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Navigation className="w-3 h-3" />
                          <span>Continuing journey...</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: checkpoints.length * 0.15 }}
                  className="relative pl-12 pb-4"
                >
                  <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-emerald-100 border-[3px] border-emerald-500 z-10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-600">Trip completed</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTrip.distance_km?.toFixed(1)}km traveled
                    {selectedTrip.duration_minutes ? ` in ${selectedTrip.duration_minutes} min` : ""}
                  </p>
                </motion.div>
              </div>
            </div>
          ) : (
            <FloatingCard className="text-center py-8">
              <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No checkpoints recorded for this trip</p>
            </FloatingCard>
          )}
        </main>

        <Card className="mx-4 mt-6 p-4 border border-border bg-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Comments</p>
              <p className="text-xs text-muted-foreground">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">Share your thoughts on this trip</p>
            </div>
          </div>

          <Textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Write a comment..."
            rows={4}
          />

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleAddComment}
              disabled={!commentText.trim() || commentSubmitting}
            >
              Comment
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet — be the first to add one.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-3xl border border-border bg-background p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{comment.author.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate">{comment.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* AI Journal Writer */}
        {isOwnJournal && <AiJournalWriter trip={selectedTrip} />}

        {showViewer && (
          <PhotoViewer
            photos={viewerPhotos}
            initialIndex={selectedPhotoIndex}
            onClose={() => setShowViewer(false)}
          />
        )}
      </div>
    );
  }

  // ── Trip list view ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="safe-top px-4 py-6">
        <h1 className="font-display font-bold text-2xl text-foreground mb-1">
          {isOwnJournal ? 'Travel Diary' : `${profile?.full_name || profile?.username}'s Journal`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isOwnJournal
            ? 'Your journey moments, preserved'
            : 'Travel stories from someone you follow'}
        </p>

        {!isOwnJournal && profile && (
          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.username} />
              ) : (
                <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-foreground">{profile.full_name || profile.username}</p>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
            </div>
          </div>
        )}
      </header>

      <main className="px-4 space-y-3">
        {trips.length > 0 ? (
          trips.map((trip: any, idx: number) => {
            const checkpoints = getTripCheckpoints(trip);
            const totalPhotos = getTotalPhotos(trip);
            const firstPhoto = checkpoints.find((cp: any) => cp.photos?.length > 0)?.photos?.[0];
            const previewPhoto = trip._previewPhotoUrl || firstPhoto?.objectUrl;

            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => handleSelectTrip(trip)}
                className="bg-card rounded-2xl overflow-hidden shadow-soft cursor-pointer active:scale-[0.98] transition-transform border border-border/50"
              >
                {previewPhoto ? (
                  <div className="relative h-36">
                    <img
                      src={previewPhoto}
                      alt={trip.destination}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-display font-bold text-white text-lg leading-tight">
                        {trip.destination || trip.origin || "Trip"}
                      </h3>
                      <p className="text-white/80 text-xs mt-0.5">
                        {new Date(trip.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-28 bg-gradient-to-br from-emerald-50 to-blue-50">
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                      🗺️
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-display font-bold text-foreground text-lg leading-tight">
                        {trip.destination || trip.origin || "Trip"}
                      </h3>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {new Date(trip.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-3">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-emerald-500" />
                      {trip.distance_km?.toFixed(1)}km
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      {trip.duration_minutes || 0}min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      {checkpoints.length} stops
                    </span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-emerald-500" />
                      {totalPhotos}
                    </span>
                  </div>

                  {checkpoints.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {checkpoints.map((cp: any, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium"
                        >
                          {cp.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <FloatingCard className="text-center py-16">
            <div className="text-6xl mb-4">📔</div>
            <h3 className="font-display font-semibold text-foreground mb-2">No trips yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start a journey to fill your travel diary
            </p>
            <Button variant="calm" onClick={() => navigate("/map")}>
              <MapPin className="w-4 h-4 mr-2" />
              Start Trip
            </Button>
          </FloatingCard>
        )}
      </main>
    </div>
  );
};

export default Journal;
