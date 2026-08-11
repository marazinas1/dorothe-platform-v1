import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { CARTO_LIGHT_STYLE, MARKER_COLOR } from "@/lib/maps/carto";

/**
 * Editable pin map for the admin. Same GDPR-friendly CARTO basemap as the
 * public site; the marker is draggable so an imprecise geocode can be corrected
 * by hand — which is also the fallback when the lookup service is unavailable.
 */
export default function PinMapCanvas({
  lat,
  lng,
  onMove,
}: {
  lat: number;
  lng: number;
  onMove: (lat: number, lng: number) => void;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    if (!holder.current || map.current) return;
    const instance = new maplibregl.Map({
      container: holder.current,
      style: CARTO_LIGHT_STYLE as never,
      center: [lng, lat],
      zoom: 15,
      attributionControl: { compact: true },
    });
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    const pin = new maplibregl.Marker({ color: MARKER_COLOR, draggable: true })
      .setLngLat([lng, lat])
      .addTo(instance);
    pin.on("dragend", () => {
      const position = pin.getLngLat();
      onMoveRef.current(Number(position.lat.toFixed(6)), Number(position.lng.toFixed(6)));
    });
    instance.on("click", (event) => {
      pin.setLngLat(event.lngLat);
      onMoveRef.current(
        Number(event.lngLat.lat.toFixed(6)),
        Number(event.lngLat.lng.toFixed(6)),
      );
    });

    map.current = instance;
    marker.current = pin;
    return () => {
      instance.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow coordinates that changed elsewhere (geocode result, manual input).
  useEffect(() => {
    if (!map.current || !marker.current) return;
    marker.current.setLngLat([lng, lat]);
    map.current.easeTo({ center: [lng, lat], duration: 400 });
  }, [lat, lng]);

  return <div ref={holder} className="aspect-[16/9] w-full" />;
}
