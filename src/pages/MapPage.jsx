// src/pages/MapPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Navigation, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Crosshair, Layers, Sun, Moon, Satellite, MapPin, Truck,
  UserCheck, Calendar, Clock, X, Plus, Eye, EyeOff,
  Mountain, Route, Activity, Compass, Search, Save,
  Trash2, ExternalLink, ChevronRight, Star, StarOff,
  AlertTriangle, CheckCircle, Loader2, FileText, Car,
  Gauge, Power, PowerOff, Wifi, WifiOff, Edit, Play,
  Upload
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Funkcja pomocnicza do formatowania czasu
const formatDuration = (seconds) => {
  if (!seconds) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes} min`;
};

export default function MapPage() {
  const { settings } = useAppSettings();
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [liveRouteLayer, setLiveRouteLayer] = useState(null);
  const [showSavePanel, setShowSavePanel] = useState(false);

  // Stany dla dialogu eksportu
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportTripData, setExportTripData] = useState(null);
  const [selectedExportVehicleId, setSelectedExportVehicleId] = useState('');
  const [selectedExportDriverId, setSelectedExportDriverId] = useState('');
  const [exportOrderedBy, setExportOrderedBy] = useState('');
  const [exportPurpose, setExportPurpose] = useState('');
  const [exportDepartureDate, setExportDepartureDate] = useState('');
  const [exportDepartureTime, setExportDepartureTime] = useState('');
  const [exportReturnDate, setExportReturnDate] = useState('');
  const [exportReturnTime, setExportReturnTime] = useState('');
  
  // Dodatkowe dane pojazdu do podglądu
  const [selectedVehicleInfo, setSelectedVehicleInfo] = useState(null);
  const [calculatedEndOdometer, setCalculatedEndOdometer] = useState(0);
  const [calculatedEndFuel, setCalculatedEndFuel] = useState(0);

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

  // Aktualizacja informacji o pojeździe po zmianie wyboru
  useEffect(() => {
    if (selectedExportVehicleId) {
      const vehicle = vehicles.find(v => v.id === selectedExportVehicleId);
      setSelectedVehicleInfo(vehicle || null);
      if (vehicle && exportTripData) {
        setCalculatedEndOdometer((vehicle.mileage || 0) + (exportTripData.distance || 0));
        // Przewidywane zużycie paliwa (średnio 7.5L/100km)
        const fuelConsumption = vehicle.fuelConsumption || 7.5;
        const fuelUsed = ((exportTripData.distance || 0) / 100) * fuelConsumption;
        setCalculatedEndFuel(Math.max(0, (vehicle.fuelLevel || 0) - fuelUsed));
      }
    }
  }, [selectedExportVehicleId, vehicles, exportTripData]);

  // Ustaw domyślne daty
  useEffect(() => {
    const now = new Date();
    const nowISO = now.toISOString().split('T')[0];
    const nowTime = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    setExportDepartureDate(nowISO);
    setExportDepartureTime(nowTime);
    setExportReturnDate(nowISO);
    setExportReturnTime(nowTime);
  }, []);

  // Mutacja do zapisu trasy przez API i aktualizacji pojazdu
  const createTripMutation = useMutation({
    mutationFn: async (tripData) => {
      // Najpierw utwórz trasę
      const newTrip = await api.createTrip(tripData);
      
      // Następnie zaktualizuj pojazd (przebieg i stan paliwa)
      if (tripData.vehicleId && tripData.endOdometer) {
        await api.updateVehicle(Number(tripData.vehicleId), {
          mileage: tripData.endOdometer,
          fuelLevel: tripData.endFuel,
          status: 'available'
        });
      }
      
      return newTrip;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(`✅ Trasa została dodana do modułu Podróże!`, {
        description: `Przebieg pojazdu i stan paliwa zostały zaktualizowane.`,
        duration: 3000,
      });
      setTimeout(() => {
        navigate('/trips');
      }, 2000);
    },
    onError: (error) => {
      console.error('Błąd zapisu trasy:', error);
      toast.error('Nie udało się dodać trasy: ' + (error.message || 'Błąd serwera'));
    }
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
    return vehicle ? `${vehicle.make || vehicle.brand || ""} ${vehicle.model || ""} (${vehicle.registrationNumber || vehicle.licensePlate || ""})` : "Nieznany";
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
    setShowSavePanel(false);
    setTrackingPoints([]);
    setTrackingStartTime(new Date());
    setTrackingDistance(0);
    setShowLiveTracking(true);
    setActiveTab("live");
    toast.success("Rozpoczęto śledzenie trasy");
  };

  // Zatrzymanie śledzenia
  const stopTrackingSession = () => {
    if (!isTracking) return;
    
    setIsTracking(false);
    setShowLiveTracking(false);
    
    if (trackingPoints.length === 0) {
      toast.info("Nie zapisano żadnych punktów trasy");
      setShowSavePanel(false);
      return;
    }
    
    setShowSavePanel(true);
    toast.info("Śledzenie zakończone. Możesz teraz zapisać trasę lub odrzucić.");
  };

  // Zapisanie trasy po śledzeniu (do localStorage - śledzone trasy)
  const saveCurrentTrackedTrip = () => {
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
    
    const savedTrip = saveTrackedTrip(newTrip);
    if (savedTrip) {
      toast.success("Trasa została zapisana! Znajdziesz ją w zakładce 'Zapisane Trasy'");
      setShowSavePanel(false);
      setTrackingPoints([]);
      setTrackingDistance(0);
      setTrackingStartTime(null);
      if (mapRef.current) {
        mapRef.current.clearRoadRoute();
      }
    }
  };

  // Odrzucenie trasy
  const discardTrackedTrip = () => {
    setShowSavePanel(false);
    setTrackingPoints([]);
    setTrackingDistance(0);
    setTrackingStartTime(null);
    if (mapRef.current) {
      mapRef.current.clearRoadRoute();
    }
    toast.info("Trasa została odrzucona");
  };

  // Obsługa aktualizacji lokalizacji podczas śledzenia
  const handleLocationUpdate = (position, history) => {
    if (!isTracking) return;
    
    const newPoint = {
      lat: position.lat,
      lng: position.lng,
      timestamp: new Date(),
      accuracy: position.accuracy,
      address: position.address || null,
    };
    
    setTrackingPoints(prev => {
      const updated = [...prev, newPoint];
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const dist = calculateDistance(last.lat, last.lng, position.lat, position.lng);
        setTrackingDistance(d => d + dist);
      }
      
      if (mapRef.current && updated.length > 1) {
        const coordinates = updated.map(p => ({ lat: p.lat, lng: p.lng }));
        mapRef.current.drawRoadRoute(coordinates, {
          color: '#6366f1',
          weight: 5,
          opacity: 0.8,
          startMarker: true,
          endMarker: false,
          fitBounds: false,
        });
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
    setActiveTab("tracked");
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

  // Rozpocznij trasę
  const startRoute = (routeData) => {
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

  // ✅ Eksport trasy - pokaż okno dialogowe z pełnymi danymi
  const exportTrackedTripToTrips = (trip) => {
    console.log('📦 Eksportuję trasę do modułu Podróże:', trip);
    
    // Resetuj formularz
    const now = new Date();
    const nowISO = now.toISOString().split('T')[0];
    const nowTime = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    setExportDepartureDate(nowISO);
    setExportDepartureTime(nowTime);
    setExportReturnDate(nowISO);
    setExportReturnTime(nowTime);
    setExportOrderedBy('');
    setExportPurpose('');
    
    // Zapisz dane trasy do stanu i pokaż dialog
    setExportTripData(trip);
    setSelectedExportVehicleId(vehicles.length > 0 ? vehicles[0]?.id : '');
    setSelectedExportDriverId(drivers.length > 0 ? drivers[0]?.id : '');
    setShowExportDialog(true);
  };

  // ✅ Funkcja potwierdzająca eksport z wszystkimi danymi i aktualizacją pojazdu
  const confirmExportToTrips = () => {
    if (!exportTripData) return;
    
    const vehicle = vehicles.find(v => v.id === selectedExportVehicleId);
    const driver = drivers.find(d => d.id === selectedExportDriverId);
    
    if (!vehicle || !driver) {
      toast.error('Wybierz pojazd i kierowcę');
      return;
    }
    
    // Przygotuj datę i godzinę rozpoczęcia i zakończenia
    const startDateTime = new Date(`${exportDepartureDate}T${exportDepartureTime}:00`);
    const endDateTime = new Date(`${exportReturnDate}T${exportReturnTime}:00`);
    const startDateTimeISO = startDateTime.toISOString();
    const endDateTimeISO = endDateTime.toISOString();
    
    const startLocationText = typeof exportTripData.startLocation === 'object' 
      ? (exportTripData.startLocation?.display_name || exportTripData.startLocation?.name || "Start")
      : (exportTripData.startLocation || "Start");
    
    const endLocationText = typeof exportTripData.endLocation === 'object'
      ? (exportTripData.endLocation?.display_name || exportTripData.endLocation?.name || "Cel")
      : (exportTripData.endLocation || "Cel");
    
    // Obliczenia paliwa
    const fuelConsumption = vehicle.fuelConsumption || 7.5;
    const distance = exportTripData.distance || 0;
    const fuelUsedNorm = (distance / 100) * fuelConsumption;
    const endFuelCalculated = Math.max(0, (vehicle.fuelLevel || 0) - fuelUsedNorm);
    
    const tripData = {
      vehicleId: vehicle.id,
      driverId: driver.id,
      startLocation: startLocationText,
      endLocation: endLocationText,
      distance: distance,
      duration: exportTripData.duration || 0,
      startDate: startDateTimeISO,
      startTime: startDateTimeISO,
      endDate: endDateTimeISO,
      endTime: endDateTimeISO,
      startOdometer: vehicle.mileage || 0,
      endOdometer: Math.round((vehicle.mileage || 0) + distance),
      startFuel: vehicle.fuelLevel || 0,
      endFuel: endFuelCalculated,
      fuelUsedNorm: fuelUsedNorm,
      fuelUsedActual: fuelUsedNorm,
      status: 'completed',
      purpose: exportPurpose || `Trasa z mapy: ${startLocationText} → ${endLocationText}`,
      orderedBy: exportOrderedBy || 'System',
      points: exportTripData.points || [],
      coordinates: exportTripData.coordinates || [],
    };
    
    console.log('📤 Wysyłam dane do API:', tripData);
    createTripMutation.mutate(tripData);
    setShowExportDialog(false);
    setExportTripData(null);
  };

  // Eksport do Karty Drogowej
  const exportToKartaDrogowa = (trip) => {
    console.log('📄 Generuję Kartę Drogową dla trasy:', trip);
    
    const startLoc = typeof trip.startLocation === 'object' 
      ? (trip.startLocation?.display_name || trip.startLocation?.name || "Start")
      : (trip.startLocation || "Start");
    const endLoc = typeof trip.endLocation === 'object'
      ? (trip.endLocation?.display_name || trip.endLocation?.name || "Cel")
      : (trip.endLocation || "Cel");
    
    toast.success(`📄 Karta drogowa`, {
      description: `${startLoc} → ${endLoc}\nDystans: ${(trip.distance || 0).toFixed(1)} km`,
      duration: 4000,
    });
  };

  // Zapisz zaplanowaną trasę (RoutePlanner)
  const handleRoutePlannerSave = (routeData, routeInfo) => {
    console.log('💾 Zapisywanie zaplanowanej trasy:', routeData);
    const result = savePlannedRoute(routeData, routeInfo);
    if (result) {
      toast.success(`✅ Trasa "${result.name}" została zapisana w zakładce "Zapisane Trasy"`, {
        description: `Dystans: ${result.distance} km | Czas: ${result.durationFormatted}`,
      });
    }
  };

  // Rozpocznij zaplanowaną trasę (RoutePlanner)
  const handleRoutePlannerStart = (routeData, routeInfo) => {
    console.log('🚀 Rozpoczynanie zaplanowanej trasy:', routeData);
    startRoute({ ...routeData, routeInfo });
    toast.success(`🚗 Rozpoczęto nawigację: ${routeData.name || 'Nowa trasa'}`);
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
        <div className={`${showSidebar ? "lg:w-96" : "lg:w-12"} transition-all duration-300 flex-shrink-0`}>
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
                  <TabsList className="w-full bg-slate-800/50 border border-slate-700 p-1">
                    <TabsTrigger value="live" className="flex-1 data-[state=active]:bg-gradient-primary text-xs">Na żywo</TabsTrigger>
                    <TabsTrigger value="tracked" className="flex-1 data-[state=active]:bg-gradient-primary text-xs">Zapisane Trasy</TabsTrigger>
                    <TabsTrigger value="planner" className="flex-1 data-[state=active]:bg-gradient-primary text-xs">Planowanie Trasy</TabsTrigger>
                  </TabsList>

                  {/* Zakładka: Na żywo */}
                  <TabsContent value="live" className="mt-3 space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {gpsEnabled ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                          <span className="text-theme-white text-sm">Lokalizator</span>
                        </div>
                        <div className="lex items-center gap-2">
                          <Badge className={gpsEnabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                            {gpsEnabled ? "WŁĄCZONY" : "WYŁĄCZONY"}
                          </Badge>
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={toggleGps}>
                            {gpsEnabled ? <PowerOff className="w-4 h-4 text-red-400" /> : <Power className="w-4 h-4 text-green-400" />}
                          </Button>
                        </div>
                      </div>
                    </div>

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

                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <h4 className="text-theme-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-primary" />
                        Śledzenie trasy
                      </h4>
                      
                      {isTracking && (
                        <div className="mb-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-blue-400 text-xs font-medium flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                              Śledzenie AKTYWNE
                            </p>
                            <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">
                              {trackingPoints.length} punktów
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-900/50 rounded-lg p-2">
                              <p className="text-theme-white-muted text-[10px]">Dystans</p>
                              <p className="text-theme-white font-bold text-sm">{trackingDistance.toFixed(1)} km</p>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2">
                              <p className="text-theme-white-muted text-[10px]">Czas</p>
                              <p className="text-theme-white font-bold text-sm">
                                {trackingStartTime ? Math.floor((new Date() - trackingStartTime) / 60000) : 0} min
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {showSavePanel && trackingPoints.length > 0 && (
                        <div className="mb-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <p className="text-yellow-400 text-xs font-medium">Śledzenie zakończone</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center mb-3">
                            <div className="bg-slate-900/50 rounded-lg p-2">
                              <p className="text-theme-white-muted text-[10px]">Dystans</p>
                              <p className="text-theme-white font-bold text-sm">{trackingDistance.toFixed(1)} km</p>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2">
                              <p className="text-theme-white-muted text-[10px]">Punkty GPS</p>
                              <p className="text-theme-white font-bold text-sm">{trackingPoints.length}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs" onClick={saveCurrentTrackedTrip}>
                              <Save className="w-3 h-3 mr-1" />
                              Zapisz tę trasę
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={discardTrackedTrip}>
                              <Trash2 className="w-3 h-3 mr-1" />
                              Odrzuć
                            </Button>
                          </div>
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
                          <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => setActiveTab("planner")}>
                            <Plus className="w-3 h-3 mr-1" />
                            Zaplanuj trasę
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {savedPlannedRoutes.map((route) => (
                            <div key={route.id} className="p-3 rounded-lg border border-slate-700 bg-slate-900/30 hover:border-slate-500 transition-all">
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
                                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs text-blue-400 hover:text-blue-300" onClick={() => viewPlannedRouteOnMap(route)}>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Pokaż
                                </Button>
                                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs text-yellow-400 hover:text-yellow-300" onClick={() => editPlannedRoute(route)}>
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edytuj
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="flex-1 h-7 text-xs text-green-400 hover:text-green-300"
                                  onClick={() => {
                                    const tripToExport = {
                                      startLocation: route.startLocation,
                                      endLocation: route.endLocation,
                                      distance: route.distance,
                                      duration: route.duration,
                                      points: route.coordinates || [],
                                    };
                                    exportTrackedTripToTrips(tripToExport);
                                  }}
                                >
                                  <Car className="w-3 h-3 mr-1" />
                                  Eksportuj
                                </Button>
                                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs text-green-400 hover:text-green-300" onClick={() => {
                                  setActiveTab("live");
                                  setSelectedTrackedTrip(route);
                                  toast.success(`Rozpoczynanie trasy: ${route.name}`);
                                }}>
                                  <Play className="w-3 h-3 mr-1" />
                                  Jedź
                                </Button>
                                <Button size="sm" variant="ghost" className="w-7 h-7 text-red-400 hover:text-red-300" onClick={() => deletePlannedRoute(route.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Śledzone trasy */}
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
                          if (mapRef.current && trip.points && trip.points.length > 0) {
                            setTimeout(() => {
                              mapRef.current.drawRoadRoute(trip.points, {
                                color: '#6366f1',
                                weight: 5,
                                opacity: 0.8,
                                startMarker: true,
                                endMarker: true,
                                fitBounds: true,
                                startAddress: trip.startLocation,
                                endAddress: trip.endLocation,
                              });
                            }, 100);
                          }
                          toast.success(`Wyświetlanie trasy: ${trip.startLocation} → ${trip.endLocation}`);
                        }}
                        onExportToTrip={(trip) => exportTrackedTripToTrips(trip)}
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
              className="w-full"
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
        onExportToTrip={exportTrackedTripToTrips}
        onExportToKarta={exportToKartaDrogowa}
      />

      {/* Dialog eksportu do modułu Podróże - ROZSZERZONY */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Car className="w-5 h-5 text-green-400" />
              Eksportuj do modułu Podróże
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Podgląd trasy */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-slate-400 text-sm mb-1">Trasa do wyeksportowania:</p>
              <p className="text-white font-medium">
                {exportTripData && (typeof exportTripData.startLocation === 'object' 
                  ? exportTripData.startLocation?.display_name 
                  : exportTripData.startLocation)} → {exportTripData && (typeof exportTripData.endLocation === 'object' 
                  ? exportTripData.endLocation?.display_name 
                  : exportTripData.endLocation)}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Dystans: {(exportTripData?.distance || 0).toFixed(1)} km
              </p>
            </div>
            
            {/* Wybór pojazdu z aktualnymi danymi */}
            <div className="space-y-2">
              <Label className="text-theme-white">Pojazd *</Label>
              <Select value={selectedExportVehicleId} onValueChange={setSelectedExportVehicleId}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Wybierz pojazd" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.registrationNumber}) - {v.mileage} km
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVehicleInfo && (
                <div className="text-xs text-slate-400 mt-1 p-2 bg-slate-800/30 rounded">
                  <div className="grid grid-cols-2 gap-1">
                    <span>📊 Aktualny przebieg:</span>
                    <span className="text-white font-semibold">{selectedVehicleInfo.mileage?.toLocaleString()} km</span>
                    <span>⛽ Stan paliwa:</span>
                    <span className="text-white font-semibold">{selectedVehicleInfo.fuelLevel?.toFixed(1)} L</span>
                    <span>📏 Pojemność baku:</span>
                    <span className="text-white font-semibold">{selectedVehicleInfo.tankSize} L</span>
                    <span>📈 Spalanie normatywne:</span>
                    <span className="text-white font-semibold">{selectedVehicleInfo.fuelConsumption || 7.5} L/100km</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Wybór kierowcy */}
            <div className="space-y-2">
              <Label className="text-theme-white">Kierowca *</Label>
              <Select value={selectedExportDriverId} onValueChange={setSelectedExportDriverId}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Wybierz kierowcę" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name || `${d.firstName} ${d.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data i godzina wyjazdu */}
            <div className="space-y-2">
              <Label className="text-theme-white">Data i godzina wyjazdu *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={exportDepartureDate}
                  onChange={(e) => setExportDepartureDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  type="time"
                  value={exportDepartureTime}
                  onChange={(e) => setExportDepartureTime(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Data i godzina przyjazdu */}
            <div className="space-y-2">
              <Label className="text-theme-white">Data i godzina przyjazdu *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={exportReturnDate}
                  onChange={(e) => setExportReturnDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  type="time"
                  value={exportReturnTime}
                  onChange={(e) => setExportReturnTime(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Podgląd obliczonych wartości końcowych */}
            {selectedVehicleInfo && exportTripData && (
              <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <p className="text-blue-400 text-xs font-semibold mb-2">📋 Automatyczne wyliczenia:</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-slate-400">Przebieg końcowy:</span>
                  <span className="text-white font-semibold">{calculatedEndOdometer.toLocaleString()} km</span>
                  <span className="text-slate-400">Stan paliwa końcowy:</span>
                  <span className="text-white font-semibold">{calculatedEndFuel.toFixed(1)} L</span>
                  <span className="text-slate-400">Przewidywane zużycie:</span>
                  <span className="text-white font-semibold">
                    {((exportTripData.distance || 0) / 100 * (selectedVehicleInfo.fuelConsumption || 7.5)).toFixed(1)} L
                  </span>
                </div>
              </div>
            )}

            {/* Kto zlecił */}
            <div className="space-y-2">
              <Label className="text-theme-white">Kto zlecił przejazd?</Label>
              <Input
                type="text"
                value={exportOrderedBy}
                onChange={(e) => setExportOrderedBy(e.target.value)}
                placeholder="Imię i nazwisko zlecającego"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Cel podróży */}
            <div className="space-y-2">
              <Label className="text-theme-white">Cel podróży</Label>
              <Input
                type="text"
                value={exportPurpose}
                onChange={(e) => setExportPurpose(e.target.value)}
                placeholder="np. Wyjazd służbowy, dostawa towaru"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowExportDialog(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Anuluj
              </Button>
              <Button
                onClick={confirmExportToTrips}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                disabled={createTripMutation.isPending}
              >
                {createTripMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Car className="w-4 h-4 mr-2" />}
                Eksportuj trasę
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}