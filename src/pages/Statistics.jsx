import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  BarChart3,
  Car,
  Route,
  Fuel,
  Wrench,
  TrendingUp,
  DollarSign,
  Gauge,
  Download,
  Filter,
  Calendar,
  User,
  PieChart
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import api from "@/api/apiClient";

const COLORS = ['#6366f1', '#22d3ee', '#a855f7', '#f59e0b', '#10b981', '#ef4444'];

export default function Statistics() {
  const [selectedVehicle, setSelectedVehicle] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [chartType, setChartType] = useState("overview");

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.getVehicles,
    refetchOnMount: true
  });

  // 🔧 Transformacja kierowców – dodajemy pole `name` z firstName + lastName
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: api.getDrivers,
    refetchOnMount: true,
    select: (data) => data.map(driver => ({
      ...driver,
      name: `${driver.firstName} ${driver.lastName}`.trim()
    }))
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: api.getTrips,
    refetchOnMount: true
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: api.getServices,
    refetchOnMount: true
  });

  // Filtrowanie danych
  const filterByDate = (items, dateField = 'date') => {
    if (dateRange === 'all') return items;
    
    const now = new Date();
    const filterDate = new Date();
    
    if (dateRange === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    } else if (dateRange === 'quarter') {
      filterDate.setMonth(now.getMonth() - 3);
    } else if (dateRange === 'year') {
      filterDate.setFullYear(now.getFullYear() - 1);
    }
    
    return items.filter(item => new Date(item[dateField]) >= filterDate);
  };

  const filterByVehicle = (items, vehicleField = 'vehicleId') => {
    if (selectedVehicle === 'all') return items;
    return items.filter(item => item[vehicleField] === selectedVehicle);
  };

  const filterByDriver = (items) => {
    if (selectedDriver === 'all') return items;
    return items.filter(trip => trip.driverId === selectedDriver);
  };

  const filteredTrips = filterByDate(filterByDriver(filterByVehicle(trips)), 'startDate');
  const filteredServices = filterByDate(filterByVehicle(services), 'date');

  // Obliczenia
  const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);
  const avgMileage = vehicles.length > 0 ? Math.round(totalMileage / vehicles.length) : 0;
  const totalServiceCost = filteredServices.reduce((sum, s) => sum + (s.cost || 0), 0);
  const completedTrips = filteredTrips.filter(t => t.status === 'completed').length;
  const totalTripDistance = filteredTrips.reduce((sum, t) => {
    if (t.endMileage && t.startMileage) {
      return sum + (t.endMileage - t.startMileage);
    }
    return sum;
  }, 0);

  // Status pojazdów
  const statusCounts = {
    available: vehicles.filter(v => v.status === 'available').length,
    in_use: vehicles.filter(v => v.status === 'in_use').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    unavailable: vehicles.filter(v => v.status === 'unavailable').length
  };

  const statusData = [
    { name: 'Dostępne', value: statusCounts.available, color: '#10b981' },
    { name: 'W użyciu', value: statusCounts.in_use, color: '#f59e0b' },
    { name: 'Serwis', value: statusCounts.maintenance, color: '#ef4444' },
    { name: 'Niedostępne', value: statusCounts.unavailable, color: '#64748b' }
  ].filter(d => d.value > 0);

  // Statystyki po pojazdach
  const vehicleStats = vehicles.map(vehicle => {
    const vehicleTrips = filteredTrips.filter(t => t.vehicleId === vehicle.id);
    const distance = vehicleTrips.reduce((sum, t) => 
      sum + ((t.endMileage || 0) - (t.startMileage || 0)), 0);
    const tripCount = vehicleTrips.length;
    
    return {
      id: vehicle.id,
      name: `${vehicle.make} ${vehicle.model}`,
      regNumber: vehicle.registrationNumber,
      distance,
      tripCount,
      avgDistance: tripCount > 0 ? Math.round(distance / tripCount) : 0
    };
  }).sort((a, b) => b.distance - a.distance);

  // Statystyki po kierowcach
  const driverStats = drivers.map(driver => {
    const driverTrips = filteredTrips.filter(t => t.driverId === driver.id);
    const distance = driverTrips.reduce((sum, t) => 
      sum + ((t.endMileage || 0) - (t.startMileage || 0)), 0);
    const tripCount = driverTrips.length;
    
    return {
      id: driver.id,
      name: driver.name,
      distance,
      tripCount,
      avgDistance: tripCount > 0 ? Math.round(distance / tripCount) : 0
    };
  }).sort((a, b) => b.distance - a.distance);

  // 🔧 Koszty serwisów – grupowanie po opisie (description) zamiast serviceType
  const serviceCostsByType = filteredServices.reduce((acc, s) => {
    const type = s.description?.trim() || 'inne';
    acc[type] = (acc[type] || 0) + (s.cost || 0);
    return acc;
  }, {});

  const serviceCostsData = Object.entries(serviceCostsByType).map(([type, cost]) => ({
    name: type,
    koszt: cost
  }));

  // Miesięczne statystyki
  const monthlyStats = filteredTrips.reduce((acc, trip) => {
    if (!trip.startDate) return acc;
    const month = format(new Date(trip.startDate), 'yyyy-MM');
    if (!acc[month]) {
      acc[month] = { month, distance: 0, trips: 0, services: 0 };
    }
    const distance = (trip.endMileage || 0) - (trip.startMileage || 0);
    if (distance > 0) {
      acc[month].distance += distance;
      acc[month].trips += 1;
    }
    return acc;
  }, {});

  const monthlyData = Object.values(monthlyStats).map(item => ({
    ...item,
    month: format(new Date(item.month + '-01'), 'MMM yyyy', { locale: pl })
  }));

  // Eksport statystyk do CSV
  const exportStatistics = () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        period: dateRange === 'all' ? 'cały okres' : 
                dateRange === 'month' ? 'ostatni miesiąc' :
                dateRange === 'quarter' ? 'ostatni kwartał' : 'ostatni rok',
        totals: {
          vehicles: vehicles.length,
          drivers: drivers.length,
          trips: filteredTrips.length,
          completedTrips,
          totalDistance: totalTripDistance,
          totalServiceCost
        },
        vehicleStats,
        driverStats,
        monthlyData
      };

      const csvRows = [];
      
      // Nagłówki
      csvRows.push('=== RAPORT STATYSTYCZNY ===');
      csvRows.push(`Data eksportu: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: pl })}`);
      csvRows.push(`Okres: ${data.period}`);
      csvRows.push('');
      
      // Podsumowanie
      csvRows.push('PODSUMOWANIE');
      csvRows.push(`Pojazdy,${data.totals.vehicles}`);
      csvRows.push(`Kierowcy,${data.totals.drivers}`);
      csvRows.push(`Wszystkie trasy,${data.totals.trips}`);
      csvRows.push(`Ukończone trasy,${data.totals.completedTrips}`);
      csvRows.push(`Łączny dystans,${data.totals.totalDistance} km`);
      csvRows.push(`Koszty serwisów,${data.totals.totalServiceCost} PLN`);
      csvRows.push('');
      
      // Statystyki pojazdów
      csvRows.push('STATYSTYKI POJAZDÓW');
      csvRows.push('Pojazd,Rejestracja,Liczba tras,Łączny dystans (km),Średni dystans (km)');
      vehicleStats.forEach(v => {
        csvRows.push(`${v.name},${v.regNumber},${v.tripCount},${v.distance},${v.avgDistance}`);
      });
      csvRows.push('');
      
      // Statystyki kierowców
      csvRows.push('STATYSTYKI KIEROWCÓW');
      csvRows.push('Kierowca,Liczba tras,Łączny dystans (km),Średni dystans (km)');
      driverStats.forEach(d => {
        csvRows.push(`${d.name},${d.tripCount},${d.distance},${d.avgDistance}`);
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statystyki-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Raport wyeksportowany pomyślnie');
    } catch (error) {
      toast.error('Błąd podczas eksportu: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statystyki"
        subtitle="Analiza i raporty floty"
        icon={BarChart3}
        action={
          <Button
            onClick={exportStatistics}
            className="bg-gradient-primary hover:opacity-90 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Eksportuj raport
          </Button>
        }
      />

      {/* Filtry */}
      <GlassCard className="p-4" delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-theme-white-secondary text-xs mb-1">Pojazd</Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <Car className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Wszystkie pojazdy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie pojazdy</SelectItem>
                {vehicles.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.registrationNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-theme-white-secondary text-xs mb-1">Kierowca</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <User className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Wszyscy kierowcy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy kierowcy</SelectItem>
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-theme-white-secondary text-xs mb-1">Okres</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Cały okres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cały okres</SelectItem>
                <SelectItem value="month">Ostatni miesiąc</SelectItem>
                <SelectItem value="quarter">Ostatni kwartał</SelectItem>
                <SelectItem value="year">Ostatni rok</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Karty statystyk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Łączny przebieg"
          value={`${(totalMileage / 1000).toFixed(0)}k km`}
          subtitle={`Śr. ${avgMileage.toLocaleString()} km/pojazd`}
          icon={Gauge}
          gradient="from-indigo-500 to-purple-500"
          delay={0}
        />
        <StatCard
          title="Ukończone trasy"
          value={completedTrips}
          subtitle={`${totalTripDistance.toLocaleString()} km przejechane`}
          icon={Route}
          gradient="from-emerald-500 to-teal-500"
          delay={0.1}
        />
        <StatCard
          title="Koszty serwisów"
          value={`${(totalServiceCost / 1000).toFixed(1)}k PLN`}
          subtitle={`${filteredServices.length} serwisów`}
          icon={Wrench}
          gradient="from-amber-500 to-orange-500"
          delay={0.2}
        />
        <StatCard
          title="Flota"
          value={vehicles.length}
          subtitle={`${statusCounts.available} dostępnych`}
          icon={Car}
          gradient="from-rose-500 to-pink-500"
          delay={0.3}
        />
      </div>

      {/* Wykresy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status pojazdów */}
        <GlassCard className="p-6" delay={0.4}>
          <h3 className="text-lg font-semibold text-white mb-6">Status pojazdów</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Legend 
                  formatter={(value) => <span className="text-slate-300">{value}</span>}
                />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Brak danych
            </div>
          )}
        </GlassCard>

        {/* Statystyki miesięczne */}
        <GlassCard className="p-6" delay={0.5}>
          <h3 className="text-lg font-semibold text-white mb-6">Dystans w czasie</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="distance" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Brak danych
            </div>
          )}
        </GlassCard>

        {/* Koszty serwisów – teraz grupujemy po opisie */}
        <GlassCard className="p-6" delay={0.6}>
          <h3 className="text-lg font-semibold text-white mb-6">Koszty serwisów wg opisu</h3>
          {serviceCostsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceCostsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value) => [`${value.toLocaleString()} PLN`, 'Koszt']}
                />
                <Bar dataKey="koszt" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Brak danych o serwisach
            </div>
          )}
        </GlassCard>

        {/* Top pojazdy */}
        <GlassCard className="p-6" delay={0.7}>
          <h3 className="text-lg font-semibold text-white mb-6">Top 5 pojazdów wg przebiegu</h3>
          {vehicleStats.slice(0, 5).length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleStats.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value) => [`${value.toLocaleString()} km`, 'Przebieg']}
                />
                <Bar dataKey="distance" fill="url(#barGradient2)" radius={[0, 4, 4, 0]} />
                <defs>
                  <linearGradient id="barGradient2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">
              Brak danych o pojazdach
            </div>
          )}
        </GlassCard>
      </div>

      {/* Tabela statystyk kierowców */}
      {driverStats.length > 0 && (
        <GlassCard className="p-6" delay={0.8}>
          <h3 className="text-lg font-semibold text-white mb-6">Statystyki kierowców</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400 font-medium">Kierowca</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Liczba tras</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Łączny dystans</th>
                  <th className="text-right py-3 text-slate-400 font-medium">Średni dystans</th>
                 </tr>
              </thead>
              <tbody>
                {driverStats.map((driver, index) => (
                  <tr key={driver.id} className="border-b border-slate-700/50">
                    <td className="py-3 text-white">{driver.name}</td>
                    <td className="py-3 text-slate-300 text-right">{driver.tripCount}</td>
                    <td className="py-3 text-slate-300 text-right">{driver.distance.toLocaleString()} km</td>
                    <td className="py-3 text-slate-300 text-right">{driver.avgDistance.toLocaleString()} km</td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}