import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Truck, Users, Map, Calendar, Cloud,
  Fuel, Wrench, TrendingUp, Activity, Plus, ArrowRight,
  Car, UserCheck, AlertTriangle, CheckCircle, Clock,
  Battery, Thermometer, Gauge, Route, Navigation, Eye,
  BarChart3, Award, Target, Zap, Shield, Coffee
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import WeatherWidget from "@/components/weather/WeatherWidget";
import CalendarWidget from "@/components/calendar/CalendarWidget";
import StatCardSTAXX from "@/components/ui/StatCardSTAXX";
import MentorCard from "@/components/ui/MentorCard";
import api from "@/api/apiClient";
import { useAppSettings } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { format, formatDistanceToNow, isToday, isThisWeek, isValid } from "date-fns";
import { pl } from "date-fns/locale";

const serviceTypeLabels = {
  oil_change: "Wymiana oleju",
  tires: "Wymiana opon",
  brakes: "Hamulce",
  repair: "Naprawa",
  inspection: "Przegląd",
  other: "Inne",
};

const statusColors = {
  available: "text-green-400 bg-green-400/10",
  in_use: "text-blue-400 bg-blue-400/10",
  maintenance: "text-yellow-400 bg-yellow-400/10",
  unavailable: "text-red-400 bg-red-400/10",
};

const statusLabels = {
  available: "Dostępny",
  in_use: "W użyciu",
  maintenance: "Serwis",
  unavailable: "Niedostępny",
};

const tripStatusColors = {
  in_progress: "text-blue-400 bg-blue-400/10",
  completed: "text-green-400 bg-green-400/10",
  cancelled: "text-red-400 bg-red-400/10",
};

const tripStatusLabels = {
  in_progress: "W trakcie",
  completed: "Zakończona",
  cancelled: "Anulowana",
};

const safeFormatDistanceToNow = (date) => {
  if (!date) return "data nieznana";
  const parsedDate = new Date(date);
  if (!isValid(parsedDate)) return "nieprawidłowa data";
  return formatDistanceToNow(parsedDate, { addSuffix: true, locale: pl });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [modulesSettings, setModulesSettings] = useState({
    weather: true,
    fuelPrices: true,
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api.getVehicles().catch(() => []),
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => api.getDrivers().catch(() => []),
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => api.getTrips().catch(() => []),
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.getServices().catch(() => []),
  });

  const { data: refuelings = [], isLoading: refuelingsLoading } = useQuery({
    queryKey: ["refuelings"],
    queryFn: () => api.getRefuels().catch(() => []),
  });

  const { data: companySettings = {} } = useQuery({
    queryKey: ["companySettings"],
    queryFn: () => api.getCompanySettings().catch(() => ({})),
  });

  const [apiSettings, setApiSettings] = useState({
    openWeatherApiKey: "",
    collectApiKey: "",
  });

  // Wczytaj ustawienia modułów i API z localStorage
  useEffect(() => {
    const loadSettings = () => {
      const savedApi = localStorage.getItem("api_settings");
      if (savedApi) {
        try { setApiSettings(JSON.parse(savedApi)); } catch (e) {}
      }
      const savedModules = localStorage.getItem("modules_settings");
      if (savedModules) {
        try { setModulesSettings(JSON.parse(savedModules)); } catch (e) {}
      }
    };
    loadSettings();
    window.addEventListener("modulesSettingsChanged", loadSettings);
    window.addEventListener("storage", loadSettings);
    return () => {
      window.removeEventListener("modulesSettingsChanged", loadSettings);
      window.removeEventListener("storage", loadSettings);
    };
  }, []);

  // Statystyki
  const stats = useMemo(() => {
    const availableVehicles = vehicles.filter((v) => v.status === "available").length;
    const inUseVehicles = vehicles.filter((v) => v.status === "in_use").length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length;
    const activeTrips = trips.filter((t) => t.status === "in_progress").length;
    const completedTrips = trips.filter((t) => t.status === "completed").length;
    const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);
    const totalServiceCost = services.reduce((sum, s) => sum + (s.cost || 0), 0);
    const totalFuelCost = refuelings.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgFuelConsumption = vehicles.reduce((sum, v) => sum + (v.fuelConsumption || 7.5), 0) / (vehicles.length || 1);

    return {
      availableVehicles,
      inUseVehicles,
      maintenanceVehicles,
      activeTrips,
      completedTrips,
      totalMileage,
      totalServiceCost,
      totalFuelCost,
      totalTrips: trips.length,
      avgFuelConsumption,
    };
  }, [vehicles, trips, services, refuelings]);

  const recentTrips = useMemo(() =>
    [...trips]
      .filter((t) => t.startDate && isValid(new Date(t.startDate)))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      .slice(0, 5),
    [trips]
  );

  const upcomingServices = useMemo(() => {
    const now = new Date();
    return [...services]
      .filter((s) => s.date && isValid(new Date(s.date)) && new Date(s.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  }, [services]);

  const recentRefuelings = useMemo(() =>
    [...refuelings]
      .filter((r) => r.date && isValid(new Date(r.date)))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3),
    [refuelings]
  );

  const lowFuelVehicles = useMemo(
    () => vehicles.filter((v) => (v.fuelLevel || 0) < 20),
    [vehicles]
  );

  const activeTripsList = useMemo(
    () => trips.filter((t) => t.status === "in_progress"),
    [trips]
  );

  const getVehicleName = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.name || v.make || "Pojazd"} ${v.licensePlate || v.registrationNumber || ""}`.trim() : "Nieznany";
  };

  const getDriverName = (id) => {
    const d = drivers.find((d) => d.id === id);
    if (!d) return "Nieznany";
    return d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Nieznany";
  };

  const formatDate = (date) => {
    if (!date) return "---";
    const p = new Date(date);
    return isValid(p) ? format(p, "dd MMM yyyy, HH:mm", { locale: pl }) : "---";
  };

  const formatDistance = (km) => {
    if (!km && km !== 0) return "0 km";
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const isLoading = vehiclesLoading || driversLoading || tripsLoading || servicesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Lokalizacja do widgetu pogody
  const weatherLocation = companySettings?.city
    ? { city: companySettings.city }
    : null;

  // Aktywni kierowcy (do listy mentorów)
  const activeDrivers = drivers.filter(d => d.status === 'active').slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel główny"
        subtitle={`Witaj${user?.name ? `, ${user.name}` : ""}! Oto podsumowanie Twojej floty.`}
        icon={LayoutDashboard}
      />

      {/* Karty statystyk - nowy wygląd STAXX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSTAXX
          title="Pojazdy"
          value={vehicles.length}
          subtitle={`${stats.availableVehicles} dostępnych`}
          icon={Truck}
          trend="up"
          trendValue="+2"
          onClick={() => navigate("/vehicles")}
        />
        <StatCardSTAXX
          title="Kierowcy"
          value={drivers.length}
          subtitle={`${drivers.filter(d => d.status === 'active').length} aktywnych`}
          icon={Users}
          trend="up"
          trendValue="+1"
          onClick={() => navigate("/drivers")}
        />
        <StatCardSTAXX
          title="Aktywne trasy"
          value={stats.activeTrips}
          subtitle={`${stats.completedTrips} zakończonych`}
          icon={Route}
          trend={stats.activeTrips > 0 ? "up" : "down"}
          trendValue={stats.activeTrips > 0 ? "+" + stats.activeTrips : "0"}
          onClick={() => navigate("/trips")}
        />
        <StatCardSTAXX
          title="Przejechane km"
          value={`${(stats.totalMileage / 1000).toFixed(0)}k`}
          subtitle={`${stats.totalTrips} tras łącznie`}
          icon={Gauge}
          trend="up"
          trendValue="+12%"
          onClick={() => navigate("/trips")}
        />
      </div>

      {/* Dwie kolumny: Kalendarz + Statystyki boczne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lewa kolumna - Kalendarz */}
        <div className="lg:col-span-2">
          <CalendarWidget
            trips={trips}
            services={services}
            refuelings={refuelings}
            vehicles={vehicles}
          />
        </div>

        {/* Prawa kolumna - Statystyki boczne (jak w STAXX) */}
        <div className="space-y-4">
          <GlassCard variant="stats" className="p-4">
            <h3 className="text-theme-white font-semibold text-sm mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Statystyki kosztów
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/30">
                <span className="text-slate-400 text-sm">Serwisy</span>
                <span className="text-white font-bold">{stats.totalServiceCost.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/30">
                <span className="text-slate-400 text-sm">Tankowania</span>
                <span className="text-white font-bold">{stats.totalFuelCost.toFixed(2)} zł</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <span className="text-white font-semibold text-sm">Łącznie</span>
                <span className="text-indigo-400 font-bold">{(stats.totalServiceCost + stats.totalFuelCost).toFixed(2)} zł</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="stats" className="p-4">
            <h3 className="text-theme-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Fuel className="w-4 h-4 text-green-400" />
              Średnie spalanie
            </h3>
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-white">{stats.avgFuelConsumption.toFixed(1)}</p>
              <p className="text-slate-400 text-sm">L/100km</p>
            </div>
            <Progress 
              value={(stats.avgFuelConsumption / 15) * 100} 
              className="h-2 bg-slate-700 mt-2"
            />
            <p className="text-xs text-slate-500 text-center mt-2">Norma flotowa: 7.5 L/100km</p>
          </GlassCard>

          <GlassCard variant="stats" className="p-4">
            <h3 className="text-theme-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              Oszczędności paliwa
            </h3>
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-green-400">
                {services.reduce((sum, s) => sum + (s.fuelSavings || 0), 0).toFixed(1)} L
              </p>
              <p className="text-slate-400 text-sm">zaoszczędzonego paliwa</p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Lista kierowców (mentorzy) */}
      <GlassCard variant="mentor" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-theme-white font-semibold flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Nasi kierowcy
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-indigo-400 hover:text-indigo-300"
            onClick={() => navigate("/drivers")}
          >
            Zobacz wszystkich
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        
        {activeDrivers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Brak aktywnych kierowców</p>
            <Button
              className="mt-3 bg-gradient-primary text-sm"
              onClick={() => navigate("/drivers")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj kierowcę
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeDrivers.map((driver, idx) => (
              <MentorCard
                key={driver.id}
                driver={driver}
                delay={idx * 0.05}
                onClick={() => navigate(`/drivers/${driver.id}`)}
              />
            ))}
          </div>
        )}
      </GlassCard>

      {/* Zakładki z danymi (pozostawiamy oryginalne, ale zaktualizowane) */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-slate-800/50 border border-slate-700 p-1 flex flex-wrap gap-1 h-auto">
          {[
            { id: "overview", label: "Przegląd", icon: LayoutDashboard },
            { id: "trips", label: "Trasy", icon: Route },
            { id: "services", label: "Serwisy", icon: Wrench },
            { id: "fuel", label: "Tankowania", icon: Fuel },
            { id: "fleet", label: "Flota", icon: Car },
          ].map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 flex items-center gap-1.5 text-xs"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* PRZEGLĄD */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ostatnie trasy */}
            <GlassCard className="p-4">
              <h3 className="text-theme-white font-semibold mb-3 flex items-center gap-2">
                <Route className="w-4 h-4 text-primary" />
                Ostatnie trasy
              </h3>
              {recentTrips.length === 0 ? (
                <div className="text-center py-4">
                  <Route className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Brak zarejestrowanych tras</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTrips.slice(0, 4).map((trip) => (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/trips/${trip.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-theme-white text-sm font-medium truncate">
                          {trip.startLocation || "Start"} → {trip.endLocation || "Cel"}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {getVehicleName(trip.vehicleId)} • {getDriverName(trip.driverId)}
                        </p>
                      </div>
                      <Badge className={`text-xs ${tripStatusColors[trip.status] || "bg-slate-500/20 text-slate-400"}`}>
                        {tripStatusLabels[trip.status] || trip.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full text-xs"
                onClick={() => navigate("/trips")}
              >
                Wszystkie trasy <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </GlassCard>

            {/* Nadchodzące serwisy i tankowania */}
            <div className="space-y-4">
              <GlassCard className="p-4">
                <h3 className="text-theme-white font-semibold mb-3 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-yellow-400" />
                  Nadchodzące serwisy
                </h3>
                {upcomingServices.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Brak zaplanowanych serwisów</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingServices.map((s) => (
                      <div key={s.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-800/30">
                        <div>
                          <p className="text-theme-white text-sm font-medium">
                            {serviceTypeLabels[s.serviceType] || s.name || "Serwis"}
                          </p>
                          <p className="text-slate-400 text-xs">{getVehicleName(s.vehicleId)}</p>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                          {s.date ? format(new Date(s.date), "dd MMM", { locale: pl }) : "---"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              <GlassCard className="p-4">
                <h3 className="text-theme-white font-semibold mb-3 flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-green-400" />
                  Ostatnie tankowania
                </h3>
                {recentRefuelings.length === 0 ? (
                  <div className="text-center py-4">
                    <Fuel className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Brak tankowań</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentRefuelings.map((r) => (
                      <div key={r.id} className="flex justify-between items-center p-2 rounded-lg bg-slate-800/30">
                        <div>
                          <p className="text-theme-white text-sm font-medium">{getVehicleName(r.vehicleId)}</p>
                          <p className="text-slate-400 text-xs">
                            {r.date ? format(new Date(r.date), "dd MMM yyyy", { locale: pl }) : "---"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">{r.liters || 0} L</p>
                          {r.cost && <p className="text-slate-400 text-xs">{r.cost} zł</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </TabsContent>

        {/* TRASY */}
        <TabsContent value="trips" className="mt-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-theme-white font-semibold flex items-center gap-2">
                <Route className="w-4 h-4 text-primary" />
                Historia tras
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/trips")}>
                <Plus className="w-4 h-4 mr-1" /> Nowa trasa
              </Button>
            </div>
            {recentTrips.length === 0 ? (
              <div className="text-center py-8">
                <Route className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-theme-white-secondary">Brak zarejestrowanych tras</p>
                <Button
                  className="mt-3 bg-gradient-primary"
                  size="sm"
                  onClick={() => navigate("/trips")}
                >
                  Dodaj pierwszą trasę
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
                    onClick={() => navigate(`/trips/${trip.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-theme-white font-medium text-sm truncate">
                        {trip.startLocation || "Start"} → {trip.endLocation || "Cel"}
                      </p>
                      <p className="text-theme-white-muted text-xs">
                        {getVehicleName(trip.vehicleId)} • {getDriverName(trip.driverId)}
                      </p>
                      <p className="text-theme-white-muted text-xs">
                        {formatDate(trip.startDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-3">
                      <Badge
                        className={`text-xs ${tripStatusColors[trip.status] || "text-slate-400 bg-slate-400/10"}`}
                      >
                        {tripStatusLabels[trip.status] || trip.status}
                      </Badge>
                      {trip.distance && (
                        <span className="text-xs text-theme-white-muted">
                          {formatDistance(trip.distance)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* SERWISY */}
        <TabsContent value="services" className="mt-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-theme-white font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4 text-yellow-400" />
                Serwisy
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/services")}>
                <Plus className="w-4 h-4 mr-1" /> Nowy serwis
              </Button>
            </div>
            {services.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-theme-white-secondary">Brak serwisów</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...services]
                  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                  .slice(0, 6)
                  .map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                      <div>
                        <p className="text-theme-white font-medium text-sm">
                          {serviceTypeLabels[s.serviceType] || s.name || "Serwis"}
                        </p>
                        <p className="text-theme-white-muted text-xs">
                          {getVehicleName(s.vehicleId)} •{" "}
                          {s.date ? format(new Date(s.date), "dd MMM yyyy", { locale: pl }) : "---"}
                        </p>
                      </div>
                      {s.cost && (
                        <span className="text-theme-white font-semibold text-sm">
                          {s.cost} zł
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* TANKOWANIA */}
        <TabsContent value="fuel" className="mt-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-theme-white font-semibold flex items-center gap-2">
                <Fuel className="w-4 h-4 text-green-400" />
                Ostatnie tankowania
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/refueling")}>
                <Plus className="w-4 h-4 mr-1" /> Nowe tankowanie
              </Button>
            </div>
            {recentRefuelings.length === 0 ? (
              <div className="text-center py-8">
                <Fuel className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-theme-white-secondary">Brak tankowań</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRefuelings.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div>
                      <p className="text-theme-white font-medium text-sm">
                        {getVehicleName(r.vehicleId)}
                      </p>
                      <p className="text-theme-white-muted text-xs">
                        {r.date ? format(new Date(r.date), "dd MMM yyyy", { locale: pl }) : "---"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-theme-white font-semibold text-sm">
                        {r.liters || 0} L
                      </p>
                      {r.cost && (
                        <p className="text-theme-white-muted text-xs">{r.cost} zł</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </TabsContent>

        {/* FLOTA */}
        <TabsContent value="fleet" className="mt-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-theme-white font-semibold flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-400" />
                Pojazdy floty
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate("/vehicles")}>
                Zarządzaj flotą
              </Button>
            </div>
            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-theme-white-secondary">Brak pojazdów</p>
                <Button
                  className="mt-3 bg-gradient-primary"
                  size="sm"
                  onClick={() => navigate("/vehicles")}
                >
                  Dodaj pojazd
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehicles.slice(0, 6).map((vehicle) => {
                  const fuelPercent = vehicle.tankCapacity
                    ? ((vehicle.fuelLevel || 0) / vehicle.tankCapacity) * 100
                    : 0;
                  const fuelColor =
                    fuelPercent < 20
                      ? "bg-red-500"
                      : fuelPercent < 40
                      ? "bg-yellow-500"
                      : "bg-green-500";
                  return (
                    <div
                      key={vehicle.id}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-theme-white font-medium text-sm">
                            {vehicle.name || vehicle.make || "Pojazd"}
                          </p>
                          <p className="text-xs text-theme-white-muted">
                            {vehicle.licensePlate || vehicle.registrationNumber}
                          </p>
                        </div>
                        <Badge
                          className={`text-xs ${statusColors[vehicle.status] || "text-slate-400 bg-slate-400/10"}`}
                        >
                          {statusLabels[vehicle.status] || vehicle.status || "---"}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-theme-white-muted mb-1">
                          <span>Paliwo</span>
                          <span>
                            {vehicle.fuelLevel || 0} / {vehicle.tankCapacity || 60} L (
                            {Math.round(Math.min(100, fuelPercent))}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${fuelColor} rounded-full transition-all`}
                            style={{ width: `${Math.min(100, fuelPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {vehicles.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full text-xs"
                onClick={() => navigate("/vehicles")}
              >
                Zobacz wszystkie pojazdy ({vehicles.length})
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
