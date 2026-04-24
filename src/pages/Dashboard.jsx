import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Gauge,
  Car,
  UserCheck,
  ArrowRight,
  Fuel,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Navigation,
  CalendarDays,
  Plus,
  Award,
  BarChart3,
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
import { format, formatDistanceToNow, isValid } from "date-fns";
import { pl } from "date-fns/locale";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api.getVehicles().catch(() => []),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => api.getDrivers().catch(() => []),
  });

  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: () => api.getTrips().catch(() => []),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.getServices().catch(() => []),
  });

  const { data: refuelings = [] } = useQuery({
    queryKey: ["refuelings"],
    queryFn: () => api.getRefuels().catch(() => []),
  });

  const stats = useMemo(() => {
    const availableVehicles = vehicles.filter((v) => v.status === "available").length;
    const inUseVehicles = vehicles.filter((v) => v.status === "in_use").length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === "maintenance").length;
    const activeTrips = trips.filter((t) => t.status === "in_progress").length;
    const completedTrips = trips.filter((t) => t.status === "completed").length;
    const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);
    const totalServiceCost = services.reduce((sum, s) => sum + (s.cost || 0), 0);
    const totalFuelCost = refuelings.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgFuelConsumption =
      vehicles.reduce((sum, v) => sum + (v.fuelConsumption || 7.5), 0) / (vehicles.length || 1);

    return {
      totalVehicles: vehicles.length,
      availableVehicles,
      inUseVehicles,
      maintenanceVehicles,
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter((d) => d.status === "active").length,
      activeTrips,
      completedTrips,
      totalMileage,
      totalServiceCost,
      totalFuelCost,
      totalTrips: trips.length,
      avgFuelConsumption,
    };
  }, [vehicles, drivers, trips, services, refuelings]);

  const activeDrivers = drivers.filter((d) => d.status === "active").slice(0, 4);

  // Dane dla pasków postępu "My Progress"
  const vehiclesUsagePercent = stats.totalVehicles > 0 ? (stats.availableVehicles / stats.totalVehicles) * 100 : 0;
  const tripsCompletedPercent = stats.totalTrips > 0 ? (stats.completedTrips / stats.totalTrips) * 100 : 0;
  const fuelEfficiencyPercent = (stats.avgFuelConsumption / 7.5) * 100;

  return (
    <div className="space-y-6">
      {/* Hello Alexander! - nagłówek jak w STAXX */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Hello {user?.name || "Administrator"}!</h1>
        <p className="text-slate-400 mt-1">Have a nice day</p>
      </div>

      {/* Karty statystyk - górny rząd */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSTAXX
          title="Pojazdy"
          value={stats.totalVehicles}
          subtitle={`${stats.availableVehicles} dostępnych`}
          icon={Truck}
          onClick={() => navigate("/vehicles")}
        />
        <StatCardSTAXX
          title="Kierowcy"
          value={stats.totalDrivers}
          subtitle={`${stats.activeDrivers} aktywnych`}
          icon={Users}
          onClick={() => navigate("/drivers")}
        />
        <StatCardSTAXX
          title="Aktywne trasy"
          value={stats.activeTrips}
          subtitle={`${stats.completedTrips} zakończonych`}
          icon={Route}
          onClick={() => navigate("/trips")}
        />
        <StatCardSTAXX
          title="Przejechane km"
          value={`${(stats.totalMileage / 1000).toFixed(0)}k`}
          subtitle={`${stats.totalTrips} tras łącznie`}
          icon={Gauge}
          onClick={() => navigate("/trips")}
        />
      </div>

      {/* My Progress - paski postępu jak w STAXX */}
      <GlassCard className="p-4">
        <h3 className="text-white font-semibold text-sm mb-3">My Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Vehicles Usage</span>
              <span className="text-white">{stats.availableVehicles}/{stats.totalVehicles}</span>
            </div>
            <Progress value={vehiclesUsagePercent} className="h-2 bg-slate-700" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Trips Completed</span>
              <span className="text-white">{stats.completedTrips}/{stats.totalTrips}</span>
            </div>
            <Progress value={tripsCompletedPercent} className="h-2 bg-slate-700" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Fuel Efficiency</span>
              <span className="text-white">{stats.avgFuelConsumption.toFixed(1)}/7.5 L/100km</span>
            </div>
            <Progress value={fuelEfficiencyPercent} className="h-2 bg-slate-700" />
          </div>
        </div>
      </GlassCard>

      {/* Dwie kolumny: Kalendarz + Statystyki boczne (jak w STAXX) */}
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

        {/* Prawa kolumna - Statistics jak w STAXX */}
        <div className="space-y-4">
          <GlassCard className="p-4">
            <h3 className="text-white font-semibold text-sm mb-3">Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Cost</span>
                <span className="text-white font-bold">{(stats.totalServiceCost + stats.totalFuelCost).toFixed(0)} zł</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Services</span>
                <span className="text-white font-bold">{stats.totalServiceCost.toFixed(0)} zł</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Refueling</span>
                <span className="text-white font-bold">{stats.totalFuelCost.toFixed(0)} zł</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Avg Fuel</span>
                <span className="text-white font-bold">{stats.avgFuelConsumption.toFixed(1)} L/100km</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                <span className="text-slate-400 text-sm">Fuel Saved</span>
                <span className="text-green-400 font-bold">
                  {services.reduce((sum, s) => sum + (s.fuelSavings || 0), 0).toFixed(1)} L
                </span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Lista kierowców (mentorzy) - jak w STAXX */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Mentor
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-indigo-400 hover:text-indigo-300"
            onClick={() => navigate("/drivers")}
          >
            View all
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {activeDrivers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No active drivers</p>
            <Button
              className="mt-3 bg-gradient-primary text-sm"
              onClick={() => navigate("/drivers")}
            >
              <Plus className="w-4 h-4 mr-2" /> Add driver
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
    </div>
  );
}