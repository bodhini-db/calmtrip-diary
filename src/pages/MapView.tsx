import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTripDetector } from "@/hooks/useTripDetector";
import { getTrips, getPhotos, getPhotoUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Camera, Share2 } from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface PhotoMarker {
  id: string;
  lat: number;
  lng: number;
  url?: string;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || positions.length === 0) return;
    const bounds = L.latLngBounds(positions as any);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, positions]);
  return null;
}

const MapView = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { tripData, startTracking, stopTracking, startTrip, endTrip } = useTripDetector();
  const [photos, setPhotos] = useState<PhotoMarker[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/");
      return;
    }
  }, [user, loading, navigate]);

  // Load photos and convert storage path to public URL
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const trips = await getTrips(user.id);
        const all: PhotoMarker[] = [];
        for (const trip of trips) {
          const tripPhotos = await getPhotos(trip.id);
          for (const p of tripPhotos) {
            if (p.latitude && p.longitude) {
              let url = p.storage_path;
              try {
                url = (await getPhotoUrl(p.storage_path)) || url;
              } catch (e) {
                // ignore
              }
              all.push({ id: p.id, lat: p.latitude, lng: p.longitude, url });
            }
          }
        }
        setPhotos(all);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [user]);

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
      const finalData = endTrip();
      console.log("Trip ended:", finalData);
      setIsTracking(false);
    } else {
      startTracking();
      startTrip();
      setIsTracking(true);
    }
  };

  const handleAddPhoto = async () => {
    if (!user) return;
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        console.error("Camera error:", err);
      }
    }
  };

  const polyPositions: [number, number][] = tripData.locations.map((l) => [l.latitude, l.longitude]);

  const createPhotoIcon = (url?: string) => {
    const html = url
      ? `<div style="width:56px;height:56px;border-radius:12px;overflow:hidden;border:3px solid white;box-shadow:0 4px 8px rgba(0,0,0,0.15);background-image:url('${url}');background-size:cover;background-position:center"></div>`
      : `<div style="width:56px;height:56px;border-radius:12px;background:#e2e8f0;border:3px solid white"></div>`;
    return L.divIcon({ html, className: "photo-marker", iconSize: [56, 56], iconAnchor: [28, 28] });
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  const center: [number, number] = polyPositions.length > 0 ? polyPositions[Math.floor(polyPositions.length / 2)] : [37.7749, -122.4194];

  return (
    <div className="relative w-full h-screen flex flex-col">
      <MapContainer center={center} zoom={13} className="flex-1 h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {polyPositions.length > 0 && <Polyline positions={polyPositions} pathOptions={{ color: "#86efac", weight: 4, opacity: 0.9 }} />}
        {polyPositions.length > 0 && <FitBounds positions={polyPositions} />}

        {photos.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={createPhotoIcon(p.url)} eventHandlers={{ click: () => setSelectedPhoto(p.id) }}>
            <Popup>
              <div style={{ width: 160, height: 112, overflow: "hidden" }}>
                {p.url ? <img src={p.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="photo" /> : <div style={{ width: "100%", height: "100%", background: "#eee" }} />}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 safe-top px-4 py-3 flex items-center justify-between z-10">
        <Button variant="icon" size="icon" onClick={() => navigate(-1)} className="bg-white/80 backdrop-blur">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-foreground">Your Journey</h1>
        <div className="w-10" />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-6 space-y-3 z-10">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/90 backdrop-blur rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="font-bold text-foreground">{(tripData.distance / 1000).toFixed(2)}km</p>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-bold text-foreground">{Math.round((Date.now() - tripData.startTime) / 60000)}m</p>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Photos</p>
            <p className="font-bold text-foreground">{photos.length}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={handleAddPhoto}>
            <Camera className="w-4 h-4" />
            Photo
          </Button>
          <Button variant="outline" size="lg" className="flex-1">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant={isTracking ? "destructive" : "calm"} size="lg" className="flex-1" onClick={handleToggleTracking}>
            {isTracking ? "End Trip" : "Start Trip"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapView;

