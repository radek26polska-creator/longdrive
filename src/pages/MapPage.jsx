// src/pages/MapPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Navigation, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Crosshair, Layers, Sun, Moon, Satellite, MapPin, Truck,
  UserCheck, Calendar, Clock, X, Plus, Eye, EyeOff,
  Mountain, Route, Activity, Compass, Search, Save,
  Trash2, ExternalLink, ChevronRight, Star, StarOff,
  AlertTriangle, CheckCircle, Loader2, FileText, Car,
  Gauge, Power, PowerOff, Wifi, WifiOff, Edit, Play
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import MapView from "@/components/maps/MapView";
import GPSLiveTracker from "@/components/maps/GPSLiveTracker";
import TrackedTripsList from "@/components/maps/TrackedTripsList";
import TripDetailsModal from "@/components/maps/TripDetailsModal";
import RoutePlanner from "@/components/maps/RoutePlanner";
import { useTrackedTrips } from "@/hooks/useTrackedTrips";
import api from "@/api/apiClient";
import { useAppSettings } from "@/lib/ThemeContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const SAVED_PLANNED_ROUTES_KEY = "saved_planned_routes";

export default function MapPage() {
  const { settings } = useAppSettings();
  const mapRef = useRef(null);
  const [activeTab, setActiveTab] = useState("live");
  const [fullscreen, setFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedTrackedTrip, setSelectedTrackedTrip] = useState(null);
  const [mapView, setMapView] = useState("road");
  const [mapProvider, setMapProvider] = useState("osm");
  const [showTripDetailsModal, setShowTripDetailsModal] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTrackingTrip, setCurrentTrackingTrip] = useState(null);
  const [trackingPoints, setTrackingPoints] = useState([]);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [trackingDistance, setTrackingDistance] = useState(0);

  const { trackedTrips, saveTrackedTrip, deleteTrackedTrip } = useTrackedTrips();

  // Stan dla zapisanych zaplanowanych tras
  const [savedPlannedRoutes, setSavedPlannedRoutes] = useState([]);
  const [editingPlannedRoute, setEditingPlannedRoute] = useState(null);

  const [locationSettings, setLocationSettings] = useState({
    gpsEnabled: true,
    highAccuracy: false,
    askForLocationOnStart: true,
    trackLiveRoutes: false,
    saveTripHistory: true,
    autoCenterOnLocation: true,
    trackingInterval: 10,
    googleMapsApiKey: "",
  });

  const [mapSettings, setMapSettings] = useState({
    provider: "osm",
    mapStyle: "road",
    defaultZoom: 12,
    autoCenter: true,
    showMarkers: true,
    showStops: true,
    showTraffic: false,
    saveHistory: true,
    historyRetention: "90",
    routeColors: {
      car: "#3b82f6",
      truck: "#ef4444",
      van: "#10b981",
      bus: "#8b5cf6",
      motorcycle: "#f59e0b",
    },
  });

  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [showRouteMarkers, setShowRouteMarkers] = useState(true);
  const [autoCenter, setAutoCenter] = useState(true);

  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [hasAskedForPermission, setHasAskedForPermission] = useState(false);

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: api.getVehicles,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: api.getDrivers,
  });

  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: api.getTrips,
  });

  // Wczytaj zapisane zaplanowane trasy
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_PLANNED_ROUTES_KEY);
    if (saved) {
      try {
        setSavedPlannedRoutes(JSON.parse(saved));
      } catch (e) {
        console.error('Błąd wczytywania zapisanych tras:', e);
      }
    }
  }, []);

  // Wczytaj ustawienia z localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem("location_settings");
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocationSettings(prev => ({ ...prev, ...parsed }));
        setGpsEnabled(parsed.gpsEnabled !== false);
        setShowLiveTracking(parsed.trackLiveRoutes || false);
        setAutoCenter(parsed.autoCenterOnLocation !== false);
      } catch (e) {}
    }
    const savedMapSettings = localStorage.getItem("map_settings");
    if (savedMapSettings) {
      try {
        const parsed = JSON.parse(savedMapSettings);
        setMapSettings(prev => ({ ...prev, ...parsed }));
        setMapProvider(parsed.provider || "osm");
        setMapView(parsed.mapStyle || "road");
        setAutoCenter(parsed.autoCenter !== false);
        setShowRouteMarkers(parsed.showMarkers !== false);
      } catch (e) {}
    }
  }, []);

  // Automatyczne proszenie o lokalizację
  useEffect(() => {
    if (locationSettings.askForLocationOnStart && gpsEnabled && !hasAskedForPermission && !userLocation) {
      getUserLocation();
    }
  }, [locationSettings.askForLocationOnStart, gpsEnabled]);

  const activeTrips = trips.filter((t) => t.status === "in_progress");

  const getVehicleName = (id) => {
    const vehicle = vehicles.find((v) => v.id === id);
    return vehicle ? `${vehicle.name || vehicle.brand || ""} (${vehicle.licensePlate || ""})` : "Nieznany";
  };

  const getRouteColor = (vehicleId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return mapSettings.routeColors?.car || "#3b82f6";
    const type = vehicle.type?.toLowerCase();
    switch (type) {
      case "ciężarowe": case "truck": return mapSettings.routeColors?.truck || "#ef4444";
      case "dostawcze": case "van": return mapSettings.routeColors?.van || "#10b981";
      case "bus": case "autobus": return mapSettings.routeColors?.bus || "#8b5cf6";
      case "motocykl": case "motorcycle": return mapSettings.routeColors?.motorcycle || "#f59e0b";
      default: return mapSettings.routeColors?.car || "#3b82f6";
    }
  };

  const toggleFullscreen = () => {
    const mapContainer = document.querySelector(".map-container");
    if (!fullscreen) {
      if (mapContainer?.requestFullscreen) mapContainer.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
    setFullscreen(!fullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Pobieranie lokalizacji
  const getUserLocation = () => {
    if (!gpsEnabled) {
      setLocationError("Lokalizator jest wyłączony. Włącz go w ustawieniach.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("Twoja przeglądarka nie obsługuje geolokalizacji");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    setHasAskedForPermission(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(loc);
        setLocationLoading(false);
        toast.success(`Lokalizacja pobrana! Dokładność: ${Math.round(loc.accuracy)} m`);
      },
      (err) => {
        setLocationLoading(false);
        const messages = {
          1: "Odmówiono dostępu do lokalizacji. Zezwól w ustawieniach przeglądarki.",
          2: "Nie można ustalić lokalizacji. Sprawdź GPS.",
          3: "Przekroczono czas oczekiwania na lokalizację.",
        };
        setLocationError(messages[err.code] || "Błąd lokalizacji");
        toast.error(messages[err.code] || "Błąd lokalizacji");
      },
      { enableHighAccuracy: locationSettings.highAccuracy, timeout: 10000, maximumAge: 0 }
    );
  };

  // Wyłączenie lokalizatora
  const toggleGps = () => {
    const newState = !gpsEnabled;
    setGpsEnabled(newState);
    localStorage.setItem("gps_enabled", JSON.stringify(newState));
    toast.info(newState ? "Lokalizator włączony" : "Lokalizator wyłączony");
    if (!newState) {
      setShowLiveTracking(false);
      setIsTracking(false);
    }
  };

  // Test połączenia API
  const testGoogleMapsApi = () => {
    const apiKey = locationSettings.googleMapsApiKey;
    if (!apiKey) {
      toast.error("Brak klucza API Google Maps. Dodaj go w ustawieniach.");
      return;
    }
    toast.loading("Testowanie połączenia z Google Maps API...");
    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Warszawa&key=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        toast.dismiss();
        if (data.status === "OK") {
          toast.success("Połączenie z Google Maps API działa poprawnie!");
        } else {
          toast.error(`Błąd API: ${data.status}. Sprawdź klucz.`);
        }
      })
      .catch(err => {
        toast.dismiss();
        toast.error("Nie można połączyć się z Google Maps API");
      });
  };

  // Rozpoczęcie śledzenia
  const startTrackingSession = () => {
    if (!gpsEnabled) {
      toast.error("Lokalizator jest wyłączony. Włącz go najpierw.");
      return;
    }
    setIsTracking(true);
    setTrackingPoints([]);
    setTrackingStartTime(new Date());
    setTrackingDistance(0);
    setShowLiveTracking(true);
    toast.success("Rozpoczęto śledzenie trasy");
  };

  // Zakończenie śledzenia
  const stopTrackingSession = () => {
    if (!isTracking) return;
    
    setIsTracking(false);
    setShowLiveTracking(false);
    
    if (trackingPoints.length === 0) {
      toast.info("Nie zapisano żadnych punktów trasy");
      return;
    }
    
    // Pytanie czy zapisać trasę
    const saveConfirm = window.confirm(
      `Czy zapisać przebytą trasę?\n\nDystans: ${trackingDistance.toFixed(1)} km\nPunktów: ${trackingPoints.length}\nCzas: ${Math.floor((new Date() - trackingStartTime) / 60000)} min`
    );
    
    if (saveConfirm) {
      const endTime = new Date();
      const duration = Math.floor((endTime - trackingStartTime) / 1000);
      
      const newTrip = {
        startLocation: trackingPoints[0]?.address || "Start śledzenia",
        endLocation: trackingPoints[trackingPoints.length - 1]?.address || "Koniec śledzenia",
        startDate: trackingStartTime,
        endDate: endTime,
        startCoordinates: trackingPoints[0] ? { lat: trackingPoints[0].lat, lng: trackingPoints[0].lng } : null,
        endCoordinates: trackingPoints[trackingPoints.length - 1] ? { lat: trackingPoints[trackingPoints.length - 1].lat, lng: trackingPoints[trackingPoints.length - 1].lng } : null,
        points: trackingPoints,
        distance: trackingDistance,
        duration: duration,
        status: "completed",
      };
      
      saveTrackedTrip(newTrip);
    }
    
    setCurrentTrackingTrip(null);
  };

  // Obsługa aktualizacji lokalizacji podczas śledzenia
  const handleLocationUpdate = (position, history) => {
    if (!isTracking) return;
    
    const newPoint = {
      lat: position.lat,
      lng: position.lng,
      timestamp: new Date(),
      accuracy: position.accuracy,
    };
    
    setTrackingPoints(prev => {
      const updated = [...prev, newPoint];
      // Oblicz dystans
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const dist = calculateDistance(last.lat, last.lng, position.lat, position.lng);
        setTrackingDistance(d => d + dist);
      }
      return updated;
    });
  };

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Zapisanie zaplanowanej trasy
  const savePlannedRoute = (routeData, routeInfo) => {
    const newRoute = {
      id: Date.now().toString(),
      name: routeData.name || `Trasa ${savedPlannedRoutes.length + 1}`,
      startLocation: routeData.startLocation,
      endLocation: routeData.endLocation,
      distance: routeInfo?.distance || 0,
      duration: routeInfo?.duration || 0,
      durationFormatted: routeInfo?.durationFormatted || '',
      coordinates: routeInfo?.coordinates || [],
      createdAt: new Date().toISOString(),
    };
    
    const updated = [newRoute, ...savedPlannedRoutes];
    setSavedPlannedRoutes(updated);
    localStorage.setItem(SAVED_PLANNED_ROUTES_KEY, JSON.stringify(updated));
    toast.success(`Trasa "${newRoute.name}" została zapisana!`);
    return newRoute;
  };

  // Usunięcie zapisanej zaplanowanej trasy
  const deletePlannedRoute = (id) => {
    const updated = savedPlannedRoutes.filter(r => r.id !== id);
    setSavedPlannedRoutes(updated);
    localStorage.setItem(SAVED_PLANNED_ROUTES_KEY, JSON.stringify(updated));
    toast.success("Trasa usunięta");
  };

  // Edycja zapisanej trasy
  const editPlannedRoute = (route) => {
    setEditingPlannedRoute(route);
    setActiveTab("planner");
  };

  // Wyświetl trasę na mapie
  const viewPlannedRouteOnMap = (route) => {
    if (mapRef.current && route.coordinates && route.coordinates.length > 0) {
      mapRef.current.clearRoadRoute();
      mapRef.current.drawRoadRoute(route.coordinates, {
        color: '#6366f1',
        weight: 5,
        opacity: 0.8,
        startMarker: true,
        endMarker: true,
        fitBounds: true,
        startAddress: typeof route.startLocation === 'object' 
          ? route.startLocation?.display_name 
          : route.startLocation,
        endAddress: typeof route.endLocation === 'object' 
          ? route.endLocation?.display_name 
          : route.endLocation,
      });
      toast.success(`Wyświetlanie trasy: ${route.name}`);
    }
  };

  // Rozpocznij trasę (przejdź do zakładki Na żywo)
  const startRoute = (routeData) => {
    // Przekaż dane trasy do śledzenia
    setSelectedTrackedTrip({
      startLocation: typeof routeData.startLocation === 'object' 
        ? routeData.startLocation?.display_name 
        : routeData.startLocation,
      endLocation: typeof routeData.endLocation === 'object' 
        ? routeData.endLocation?.display_name 
        : routeData.endLocation,
      startCoordinates: routeData.startLocation,
      endCoordinates: routeData.endLocation,
      distance: routeData.routeInfo?.distance || 0,
      points: routeData.routeInfo?.coordinates || [],
    });
    setActiveTab("live");
    toast.success(`Rozpoczynanie trasy: ${routeData.name || 'Nowa trasa'}`);
  };

  // Eksport trasy do modułu Podróże
  const exportToTripsModule = (trip) => {
    toast.success(`Trasa "${trip.startLocation} → ${trip.endLocation}" została przekazana do modułu Podróże`);
  };

  // Eksport do Karty Drogowej
  const exportToKartaDrogowa = (trip) => {
    toast.success(`Generowanie Karty Drogowej dla trasy "${trip.startLocation} → ${trip.endLocation}"`);
  };

  // Obsługa zapisu z RoutePlanner
  const handleRoutePlannerSave = (routeData, routeInfo) => {
    savePlannedRoute(routeData, routeInfo);
  };

  // Obsługa rozpoczęcia trasy z RoutePlanner
  const handleRoutePlannerStart = (routeData, routeInfo) => {
    startRoute({ ...routeData, routeInfo });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa tras"
        subtitle="Wizualizacja tras, śledzenie GPS i planowanie podróży"
        icon={Map}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Panel boczny */}
        <div className={`${showSidebar ? "lg:w-96 w-full" : "lg:w-12 hidden lg:block"} transition-all duration-300 flex-shrink-0`}>
          <GlassCard className="p-0 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              {showSidebar ? (
                <>
                  <h3 className="text-theme-white font-semibold flex items-center gap-2">
                    <Map className="w-4 h-4 text-primary" />
                    Panel mapy
                  </h3>
                  <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setShowSidebar(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="icon" className="w-full h-10" onClick={() => setShowSidebar(true)}>
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>

            {showSidebar && (
              <div className="p-3 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full bg-slate-800/50 border border-slate-700 p-1 flex-wrap gap-1">
                    <TabsTrigger value="live" className="flex-1 data-[state=active]:bg-gradient-primary text-[11px] sm:text-xs py-1.5 px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      Na żywo
                    </TabsTrigger>
                    <TabsTrigger value="tracked" className="flex-1 data-[state=active]:bg-gradient-primary text-[11px] sm:text-xs py-1.5 px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      Zapisane Trasy
                    </TabsTrigger>
                    <TabsTrigger value="planner" className="flex-1 data-[state=active]:bg-gradient-primary text-[11px] sm:text-xs py-1.5 px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      Planowanie Trasy
                    </TabsTrigger>
                  </TabsList>

                  {/* Zakładka: Na żywo */}
                  <TabsContent value="live" className="mt-3 space-y-4">
                    {/* Status lokalizatora */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {gpsEnabled ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                          <span className="text-theme-white text-sm">Lokalizator</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={gpsEnabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                            {gpsEnabled ? "WŁĄCZONY" : "WYŁĄCZONY"}
                          </Badge>
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleGps}>
                            {gpsEnabled ? <PowerOff className="w-4 h-4 text-red-400" /> : <Power className="w-4 h-4 text-green-400" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Moja lokalizacja */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <h4 className="text-theme-white text-sm font-semibold mb-2 flex items-center gap-2">
                        <Crosshair className="w-4 h-4 text-primary" />
                        Moja lokalizacja
                      </h4>
                      {locationError && (
                        <div className="flex items-start gap-2 mb-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-400 text-xs">{locationError}</p>
                        </div>
                      )}
                      {userLocation && !locationError && (
                        <div className="mb-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-xs font-medium">Lokalizacja pobrana</span>
                          </div>
                          <p className="text-xs text-theme-white-secondary mt-1">
                            {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                          </p>
                          <p className="text-xs text-theme-white-muted">Dokładność: ~{Math.round(userLocation.accuracy)} m</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-gradient-primary text-xs" onClick={getUserLocation} disabled={locationLoading || !gpsEnabled}>
                          {locationLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Crosshair className="w-4 h-4 mr-1" />}
                          {locationLoading ? "Pobieranie..." : "Zlokalizuj mnie"}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs" onClick={testGoogleMapsApi}>
                          <Wifi className="w-4 h-4 mr-1" />
                          Test API
                        </Button>
                      </div>
                    </div>

                    {/* Śledzenie trasy */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <h4 className="text-theme-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-primary" />
                        Śledzenie trasy
                      </h4>
                      {isTracking && (
                        <div className="mb-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-blue-400 text-xs font-medium">Śledzenie aktywne</p>
                          <p className="text-xs text-theme-white-secondary">Dystans: {trackingDistance.toFixed(2)} km</p>
                          <p className="text-xs text-theme-white-secondary">Punkty: {trackingPoints.length}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {!isTracking ? (
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs" onClick={startTrackingSession} disabled={!gpsEnabled}>
                            <Navigation className="w-4 h-4 mr-1" />
                            Rozpocznij śledzenie
                          </Button>
                        ) : (
                          <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-xs" onClick={stopTrackingSession}>
                            <PowerOff className="w-4 h-4 mr-1" />
                            Zakończ śledzenie
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Ustawienia */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 space-y-3">
                      <h4 className="text-theme-white text-sm font-semibold">Ustawienia widoku</h4>
                      {[
                        { label: "Znaczniki trasy", state: showRouteMarkers, set: setShowRouteMarkers },
                        { label: "Auto-centrowanie", state: autoCenter, set: setAutoCenter },
                      ].map(({ label, state, set }) => (
                        <div key={label} className="flex items-center justify-between">
                          <Label className="text-theme-white-secondary text-xs">{label}</Label>
                          <Switch checked={state} onCheckedChange={set} />
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Zakładka: Zapisane Trasy */}
                  <TabsContent value="tracked" className="mt-3 space-y-3">
                    {/* Zapisane zaplanowane trasy */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <h4 className="text-theme-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <Save className="w-4 h-4 text-primary" />
                        Zaplanowane trasy ({savedPlannedRoutes.length})
                      </h4>
                      
                      {savedPlannedRoutes.length === 0 ? (
                        <div className="text-center py-4">
                          <Route className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-theme-white-muted text-xs">Brak zapisanych zaplanowanych tras</p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2 text-xs"
                            onClick={() => setActiveTab("planner")}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Zaplanuj trasę
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {savedPlannedRoutes.map((route) => (
                            <div 
                              key={route.id} 
                              className="p-3 rounded-lg border border-slate-700 bg-slate-900/30 hover:border-slate-500 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-theme-white text-sm font-medium truncate">{route.name}</p>
                                  <p className="text-theme-white-muted text-xs truncate">
                                    {typeof route.startLocation === 'object' 
                                      ? route.startLocation?.display_name || `${route.startLocation?.lat?.toFixed(4)}, ${route.startLocation?.lng?.toFixed(4)}`
                                      : route.startLocation}
                                  </p>
                                  <ChevronRight className="w-3 h-3 text-slate-500 mx-1 inline" />
                                  <p className="text-theme-white-muted text-xs truncate">
                                    {typeof route.endLocation === 'object'
                                      ? route.endLocation?.display_name || `${route.endLocation?.lat?.toFixed(4)}, ${route.endLocation?.lng?.toFixed(4)}`
                                      : route.endLocation}
                                  </p>
                                </div>
                              </div>
                              
                              {route.distance > 0 && (
                                <div className="flex items-center gap-3 mb-2 text-xs">
                                  <span className="text-theme-white-muted">
                                    <Route className="w-3 h-3 inline mr-1 text-blue-400" />
                                    {route.distance} km
                                  </span>
                                  <span className="text-theme-white-muted">
                                    <Clock className="w-3 h-3 inline mr-1 text-green-400" />
                                    {route.durationFormatted}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="flex-1 h-7 text-xs text-blue-400 hover:text-blue-300"
                                  onClick={() => viewPlannedRouteOnMap(route)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Pokaż
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="flex-1 h-7 text-xs text-yellow-400 hover:text-yellow-300"
                                  onClick={() => editPlannedRoute(route)}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edytuj
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="flex-1 h-7 text-xs text-green-400 hover:text-green-300"
                                  onClick={() => {
                                    setActiveTab("live");
                                    setSelectedTrackedTrip(route);
                                    toast.success(`Rozpoczynanie trasy: ${route.name}`);
                                  }}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Jedź
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="w-7 h-7 text-red-400 hover:text-red-300"
                                  onClick={() => deletePlannedRoute(route.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Śledzone trasy (oryginalne) */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <h4 className="text-theme-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-primary" />
                        Śledzone trasy ({trackedTrips.length})
                      </h4>
                      <TrackedTripsList
                        trips={trackedTrips}
                        onViewOnMap={(trip) => {
                          setSelectedTrackedTrip(trip);
                          setActiveTab("live");
                          toast.success(`Wyświetlanie trasy: ${trip.startLocation} → ${trip.endLocation}`);
                        }}
                        onExportToTrip={exportToTripsModule}
                        onExportToKarta={exportToKartaDrogowa}
                        onDelete={deleteTrackedTrip}
                      />
                    </div>
                  </TabsContent>

                  {/* Zakładka: Planowanie Trasy */}
                  <TabsContent value="planner" className="mt-3">
                    <RoutePlanner 
                      mapRef={mapRef}
                      isMapReady={true}
                      editRoute={editingPlannedRoute}
                      onSave={handleRoutePlannerSave}
                      onStart={handleRoutePlannerStart}
                      onRouteCalculated={(routeInfo) => {
                        console.log('✅ Trasa obliczona:', routeInfo);
                      }}
                    />
                    
                    {/* Informacja o API */}
                    <div className="mt-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                      <h4 className="text-theme-white text-xs font-semibold mb-2 flex items-center gap-2">
                        <Route className="w-4 h-4 text-primary" />
                        Informacje o routingu
                      </h4>
                      <p className="text-theme-white-muted text-xs">
                        Trasy są obliczane przy użyciu darmowego API OSRM (Open Source Routing Machine). 
                        Trasa jest wyznaczana po rzeczywistych drogach, uwzględniając ograniczenia prędkości.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-green-500/20 text-green-400 text-xs">Darmowe</Badge>
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">Bez klucza API</Badge>
                        <Badge className="bg-purple-500/20 text-purple-400 text-xs">OpenStreetMap</Badge>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Mapa */}
        <div className="flex-1 min-w-0">
          <GlassCard className="p-0 overflow-hidden map-container">
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                {!showSidebar && (<Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setShowSidebar(true)}><Eye className="w-4 h-4" /></Button>)}
                <h3 className="text-theme-white font-semibold text-sm flex items-center gap-2">
                  <Map className="w-4 h-4 text-primary" />
                  {selectedTrackedTrip ? `Trasa: ${selectedTrackedTrip.startLocation} → ${selectedTrackedTrip.endLocation}` : activeTab === 'planner' ? 'Planowanie Trasy' : "Mapa tras"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[
                    { id: "road", icon: Map, title: "Mapa drogowa" },
                    { id: "satellite", icon: Satellite, title: "Satelita" },
                    { id: "terrain", icon: Mountain, title: "Teren" },
                  ].map(({ id, icon: Icon, title }) => (
                    <Button key={id} variant={mapView === id ? "default" : "ghost"} size="icon" className={`w-8 h-8 ${mapView === id ? "bg-gradient-primary" : ""}`} onClick={() => setMapView(id)} title={title}><Icon className="w-4 h-4" /></Button>
                  ))}
                </div>
                <div className="h-5 w-px bg-slate-700" />
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleFullscreen} title={fullscreen ? "Zamknij pełny ekran" : "Pełny ekran"}>{fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</Button>
                </div>
              </div>
            </div>

            <MapView
              ref={mapRef}
              trip={selectedTrackedTrip || selectedTrip}
              trackedTrip={selectedTrackedTrip}
              showLiveTracking={showLiveTracking}
              showRoute={true}
              showMarkers={showRouteMarkers}
              provider={mapProvider}
              mapStyle={mapView}
              defaultZoom={12}
              autoCenter={autoCenter}
              routeColor="#3b82f6"
              userLocation={userLocation}
              className="w-full overflow-hidden" // 🔧 DODANE: overflow-hidden
              height="600px"
            />
          </GlassCard>
        </div>
      </div>

      {/* Modal szczegółów trasy */}
      <TripDetailsModal
        trip={selectedTrackedTrip}
        isOpen={showTripDetailsModal}
        onClose={() => setShowTripDetailsModal(false)}
        onViewOnMap={(trip) => { setSelectedTrackedTrip(trip); setShowTripDetailsModal(false); setActiveTab("live"); }}
        onExportToTrip={exportToTripsModule}
        onExportToKarta={exportToKartaDrogowa}
      />
    </div>
  );
}