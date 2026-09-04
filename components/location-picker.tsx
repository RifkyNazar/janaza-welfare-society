"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type Coordinates = { latitude: number; longitude: number };
type LocationPickerProps = {
  value: Coordinates | null;
  onChange: (coordinates: Coordinates) => void;
};

const KATTANKUDY_CENTER: [number, number] = [7.68049, 81.72897];

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState("Tap the map to select the service location.");

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    let active = true;
    void import("leaflet").then((L) => {
      if (!active || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(KATTANKUDY_CENTER, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      const icon = L.divIcon({
        className: "jws-map-marker-wrapper",
        html: '<span class="jws-map-marker" aria-hidden="true"><span></span></span>',
        iconSize: [32, 42],
        iconAnchor: [16, 40],
      });
      const select = (latitude: number, longitude: number) => {
        if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
        else markerRef.current = L.marker([latitude, longitude], { icon, keyboard: false }).addTo(map);
        onChangeRef.current({ latitude, longitude });
        setMessage("Location selected. You can tap elsewhere on the map to adjust it.");
      };
      map.on("click", (event: L.LeafletMouseEvent) => select(event.latlng.lat, event.latlng.lng));
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
    });
    return () => { active = false; mapRef.current?.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  useEffect(() => {
    if (!value || !mapRef.current) return;
    void import("leaflet").then((L) => {
      const icon = L.divIcon({ className: "jws-map-marker-wrapper", html: '<span class="jws-map-marker" aria-hidden="true"><span></span></span>', iconSize: [32, 42], iconAnchor: [16, 40] });
      if (markerRef.current) markerRef.current.setLatLng([value.latitude, value.longitude]);
      else markerRef.current = L.marker([value.latitude, value.longitude], { icon, keyboard: false }).addTo(mapRef.current!);
    });
  }, [value]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Current location is unavailable. Please select the location manually.");
      return;
    }
    setIsLocating(true);
    setMessage("Locating...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinates = { latitude: coords.latitude, longitude: coords.longitude };
        onChange(coordinates);
        mapRef.current?.setView([coordinates.latitude, coordinates.longitude], 17);
        setMessage("Location found. You can adjust the marker by tapping the map.");
        setIsLocating(false);
      },
      (error) => {
        setMessage(error.code === error.PERMISSION_DENIED ? "We couldn't access your current location. You can select the location manually on the map." : error.code === error.POSITION_UNAVAILABLE ? "Current location is unavailable. Please select the location manually." : "We couldn't determine your location in time. Please select it manually on the map.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  const mapsUrl = value ? `https://www.google.com/maps?q=${value.latitude},${value.longitude}` : null;

  return (
    <div className="sm:col-span-2 rounded-2xl border border-border bg-light-background/60 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-semibold text-foreground">Interactive Map</h3><p id="map-instructions" className="mt-1 text-sm leading-6 text-muted">{message}</p></div>
        <button type="button" onClick={useCurrentLocation} disabled={isLocating} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-primary bg-white px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.6" /><path d="M10 2v2m0 12v2M2 10h2m12 0h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          {isLocating ? "Locating..." : "Use My Current Location"}
        </button>
      </div>
      <div ref={containerRef} className="mt-5 h-72 w-full overflow-hidden rounded-xl border border-border bg-white sm:h-80" role="application" aria-label="Select service location on map" aria-describedby="map-instructions" />
      {value ? (
        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-primary/35 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-muted">Selected location</p><p className="mt-2 text-sm text-foreground">Latitude: <span className="font-semibold tabular-nums">{value.latitude.toFixed(6)}</span></p><p className="mt-1 text-sm text-foreground">Longitude: <span className="font-semibold tabular-nums">{value.longitude.toFixed(6)}</span></p></div>
          <a href={mapsUrl ?? undefined} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">Open Selected Location in Maps</a>
        </div>
      ) : <p className="mt-4 text-sm text-muted">No map location selected. You can still submit using Address and Area.</p>}
    </div>
  );
}
