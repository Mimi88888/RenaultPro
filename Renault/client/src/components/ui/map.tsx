import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Garage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Ensure Leaflet default marker icon works
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Import marker icons directly
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export type MapProps = {
  garages?: Garage[];
  onMarkerClick?: (garage: Garage) => void;
  onMyLocationClick?: (lat: number, lng: number) => void;
  className?: string;
  showCurrentLocation?: boolean;
};

export function Map({
  garages = [],
  onMarkerClick,
  onMyLocationClick,
  className,
  showCurrentLocation = true,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map once container is ready
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Center the map on France (Renault HQ)
      const map = L.map(mapContainerRef.current).setView([48.8566, 2.3522], 6);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      
      mapRef.current = map;
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Handle user location
  useEffect(() => {
    if (showCurrentLocation && mapRef.current) {
      const locateUser = () => {
        setIsLocating(true);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
            
            if (mapRef.current) {
              mapRef.current.setView([latitude, longitude], 14);
              
              // Create or update user marker
              if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([latitude, longitude]);
              } else {
                const customIcon = L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div style="background-color: #1e40af; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; padding: 8px; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 30px; height: 30px;">
                      <span style="font-size: 10px;">You</span>
                    </div>
                  `,
                  iconSize: [30, 30],
                  iconAnchor: [15, 15],
                });
                
                userMarkerRef.current = L.marker([latitude, longitude], { icon: customIcon })
                  .addTo(mapRef.current)
                  .bindPopup("Your Location");
              }
            }
            
            if (onMyLocationClick) {
              onMyLocationClick(latitude, longitude);
            }
            
            setIsLocating(false);
          },
          (error) => {
            console.error("Error getting location:", error);
            setIsLocating(false);
          },
          { enableHighAccuracy: true }
        );
      };
      
      locateUser();
    }
  }, [showCurrentLocation, onMyLocationClick]);

  // Add garage markers
  useEffect(() => {
    if (mapRef.current) {
      // Clear old markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Add new markers for each garage
      garages.forEach(garage => {
        const { latitude, longitude, name, rating, isOpen } = garage;
        
        // Create custom Renault-themed marker
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div style="background-color: ${isOpen ? '#001E50' : '#777777'}; color: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1L15 8L8 15L1 8L8 1Z" fill="${isOpen ? '#FFFFFF' : '#DDDDDD'}" />
                <path d="M5.5 5H8.5C9.33 5 10 5.67 10 6.5C10 7.33 9.33 8 8.5 8H6.5L8.5 11H7L5 8V5H5.5Z" fill="${isOpen ? '#001E50' : '#777777'}" />
              </svg>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        
        const marker = L.marker([latitude, longitude], { icon: customIcon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div style="font-weight: 600; margin-bottom: 4px; color: #001E50; font-size: 14px;">${name}</div>
            <div style="color: #f59e0b; display: flex; align-items: center; margin-bottom: 2px;">
              <span style="display: inline-block; margin-right: 2px;">★</span> 
              <span>${rating ?? 'N/A'}</span>
            </div>
            <div style="color: ${isOpen ? '#22c55e' : '#f59e0b'}; margin-bottom: 3px;">${isOpen ? 'Open' : 'Closed'}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 3px;">
              ${garage.services.slice(0, 3).join(' • ')}
            </div>
            <div style="font-size: 12px; color: #001E50;">
              <strong>Renault Authorized Service Center</strong>
            </div>
          `);
        
        marker.on('click', () => {
          if (onMarkerClick) onMarkerClick(garage);
        });
        
        markersRef.current.push(marker);
      });
      
      // Center and zoom map to show all markers if there are any
      if (garages.length > 0 && !userLocation) {
        const group = new L.FeatureGroup(markersRef.current);
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [garages, userLocation, onMarkerClick]);

  return (
    <div className={`relative ${className || 'h-full w-full'}`}>
      <div ref={mapContainerRef} className="h-full w-full rounded-md" />
      
      {/* Location button */}
      {showCurrentLocation && (
        <Button 
          onClick={() => {
            if (mapRef.current && userLocation) {
              mapRef.current.setView(userLocation, 14);
            } else if (mapRef.current) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords;
                  setUserLocation([latitude, longitude]);
                  mapRef.current?.setView([latitude, longitude], 14);
                  
                  if (onMyLocationClick) {
                    onMyLocationClick(latitude, longitude);
                  }
                },
                (error) => {
                  console.error("Error getting location:", error);
                }
              );
            }
          }}
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 bg-white shadow-md z-[5]"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </Button>
      )}
    </div>
  );
}
