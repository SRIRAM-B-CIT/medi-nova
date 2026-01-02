import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Hospital {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceKm: number;
}

export default function NearbyHospitals() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    document.title = "Nearby Hospitals | MediNova";
  }, []);

  useEffect(() => {
    const getLocation = () => {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lon: longitude });
          setError("");
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
          setError("Location permission denied. Showing limited results.");
          // Fallback: center of a major city to avoid empty map
          setCoords({ lat: 40.7128, lon: -74.006 }); // NYC fallback
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    getLocation();
  }, []);

  useEffect(() => {
    if (!coords) return;

    const fetchHospitals = async () => {
      try {
        // Overpass API (OpenStreetMap) – no key required
        const query = `
          [out:json][timeout:25];
          (
            node["amenity"="hospital"](around:3000,${coords.lat},${coords.lon});
            way["amenity"="hospital"](around:3000,${coords.lat},${coords.lon});
            relation["amenity"="hospital"](around:3000,${coords.lat},${coords.lon});
          );
          out center;
        `;

        const res = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          body: new URLSearchParams({ data: query }).toString(),
        });
        const data = await res.json();

        const toRad = (d: number) => (d * Math.PI) / 180;
        const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371; // km
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

        const items: Hospital[] = (data.elements || [])
          .map((el: any) => {
            const lat = el.lat ?? el.center?.lat;
            const lon = el.lon ?? el.center?.lon;
            if (!lat || !lon) return null;
            const name = el.tags?.name || "Unnamed Hospital";
            return {
              id: `${el.type}-${el.id}`,
              name,
              lat,
              lon,
              distanceKm: haversine(coords.lat, coords.lon, lat, lon),
            } as Hospital;
          })
          .filter(Boolean)
          .sort((a: Hospital, b: Hospital) => a.distanceKm - b.distanceKm)
          .slice(0, 10);

        setHospitals(items);
      } catch (e) {
        console.error(e);
        setError("Could not load nearby hospitals. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, [coords?.lat, coords?.lon]);

  const mapSrc = useMemo(() => {
    if (!coords) return "";
    // Google Maps embed without API key – searches hospitals near coordinates
    return `https://www.google.com/maps?q=hospital&ll=${coords.lat},${coords.lon}&z=14&output=embed`;
  }, [coords]);

  return (
    <div className="p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Nearby Hospitals</h1>
        <p className="text-muted-foreground text-sm">Find hospitals close to your current location.</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Map and Results</CardTitle>
          <div className="flex items-center gap-2">
            {coords && (
              <Badge variant="secondary" className="text-xs">{coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}</Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => {
              // re-trigger geolocation
              setCoords(null);
              setHospitals([]);
              setLoading(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  setCoords({ lat: latitude, lon: longitude });
                  setError("");
                },
                () => setError("Unable to refresh location."),
                { enableHighAccuracy: true, timeout: 10000 }
              );
            }}>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {mapSrc ? (
              <iframe
                title="Nearby Hospitals Map"
                src={mapSrc}
                loading="lazy"
                className="w-full aspect-video rounded-lg border border-border/30"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="text-sm text-muted-foreground">Fetching your location…</div>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Hospitals Nearby</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading hospitals…</p>
            ) : hospitals.length ? (
              <ul className="space-y-2">
                {hospitals.map((h) => (
                  <li key={h.id} className="rounded-lg p-3 border border-border/30 hover:bg-muted/30 soft-transition">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{h.name}</span>
                      <span className="text-xs text-muted-foreground">{h.distanceKm.toFixed(2)} km</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Lat: {h.lat.toFixed(4)}, Lng: {h.lon.toFixed(4)}</div>
                    <div className="mt-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}&query_place_id=&query=${h.lat},${h.lon}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-xs underline"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hospitals found nearby.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
