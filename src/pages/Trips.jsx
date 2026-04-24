import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  Route,
  Search,
  MapPin,
  Calendar,
  Gauge,
  MoreVertical,
  Trash2,
  Play,
  CheckCircle,
  Clock,
  Car,
  User,
  Flag,
  StopCircle,
  Eye,
  Printer,
  X,
  AlertTriangle,
  Edit,
  Download,
  Filter,
  ArrowUpDown,
  CalendarDays,
  CheckSquare,
  Square,
  Key
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import ConfirmModal from "@/components/ConfirmModal.jsx";
import KartaDrogowa from "@/components/print/KartaDrogowa.jsx";
import { useKeyBlocker } from '@/hooks/useKeyBlocker';
import api from "@/api/apiClient";

const statusConfig = {
  in_progress: { label: 'W trakcie', color: 'bg-amber-500', icon: Play },
  completed: { label: 'Zakończona', color: 'bg-emerald-500', icon: CheckCircle },
  cancelled: { label: 'Anulowana', color: 'bg-red-500', icon: Trash2 }
};

const sortOptions = [
  { value: 'date_desc', label: 'Najnowsze' },
  { value: 'date_asc', label: 'Najstarsze' },
  { value: 'distance_desc', label: 'Najdłuższy dystans' },
  { value: 'distance_asc', label: 'Najkrótszy dystans' },
  { value: 'card_desc', label: 'Nr karty (malejąco)' },
  { value: 'card_asc', label: 'Nr karty (rosnąco)' }
];

const dateRangeOptions = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'today', label: 'Dzisiaj' },
  { value: 'week', label: 'Ostatnie 7 dni' },
  { value: 'month', label: 'Ostatnie 30 dni' },
  { value: 'custom', label: 'Własny zakres' }
];

export default function Trips() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedTrips, setSelectedTrips] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTrip, setPreviewTrip] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const now = new Date();
  const todayDate = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

  const [startFormData, setStartFormData] = useState({
    vehicleId: '',
    driverId: '',
    orderedBy: '',
    purpose: '',
    startLocation: '',
    endLocation: '',
    departureDate: todayDate,
    departureTime: currentTime,
  });
  const [endFormData, setEndFormData] = useState({
    endOdometer: 0,
    fuelAdded: 0,
    fuelCost: 0,
    fuelReceiptNumber: '',
    fuelStation: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const { data: tripsRaw = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => api.getTrips().catch(() => []),
    refetchOnMount: true,
    select: (data) => data.map(trip => ({ 
      ...trip, 
      id: String(trip.id), 
      vehicleId: String(trip.vehicleId), 
      driverId: String(trip.driverId) 
    }))
  });
  const trips = tripsRaw;

  const { data: vehiclesRaw = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.getVehicles().catch(() => []),
    refetchOnMount: true,
    select: (data) => data.map(v => ({ ...v, id: String(v.id) }))
  });
  const vehicles = vehiclesRaw;

  const { data: driversRaw = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => api.getDrivers().catch(() => []),
    refetchOnMount: true,
    select: (data) => data.map(driver => ({
      ...driver,
      id: String(driver.id),
      name: `${driver.firstName} ${driver.lastName}`.trim()
    }))
  });
  const drivers = driversRaw;

  const { data: companySettings = {} } = useQuery({
    queryKey: ['companySettings'],
    queryFn: () => api.getCompanySettings().catch(() => ({})),
    refetchOnMount: true,
  });

  const settings = companySettings && !Array.isArray(companySettings)
    ? companySettings
    : (Array.isArray(companySettings) && companySettings[0]) || {};

  // ✅ ODWRÓCONA LOGIKA - pobieramy pojazdy z WYDANYMI kluczykami (DOZWOLONE)
  const { 
    requireKeyForTrip, 
    issuedVehicleIds,        // ID pojazdów z WYDANYMI kluczykami (DOZWOLONE)
    issuedVehicles,          // Lista pojazdów z wydanymi kluczykami
    isVehicleKeyIssued       // Funkcja sprawdzająca czy kluczyk jest wydany
  } = useKeyBlocker() || {};

  // Sprawdź, czy wybrany pojazd ma wydany kluczyk (DOZWOLONY)
  const hasKeyForSelectedVehicle = startFormData.vehicleId 
    ? issuedVehicleIds?.includes(String(startFormData.vehicleId)) 
    : false;

  // Czy wybrany pojazd jest ZABLOKOWANY (brak wydanego kluczyka)
  const isSelectedVehicleBlocked = requireKeyForTrip && startFormData.vehicleId && !hasKeyForSelectedVehicle;

  // Czy są jakiekolwiek pojazdy z wydanymi kluczykami
  const hasAnyIssuedKeys = issuedVehicles?.length > 0;

  console.log('🔑 Trips - DIAGNOSTYKA (ODWRÓCONA LOGIKA):');
  console.log('  - requireKeyForTrip:', requireKeyForTrip);
  console.log('  - issuedVehicleIds (DOZWOLONE):', issuedVehicleIds);
  console.log('  - issuedVehicles count:', issuedVehicles?.length);
  console.log('  - startFormData.vehicleId:', startFormData.vehicleId);
  console.log('  - hasKeyForSelectedVehicle:', hasKeyForSelectedVehicle);
  console.log('  - isSelectedVehicleBlocked:', isSelectedVehicleBlocked);

  const getVehicle = (id) => vehicles.find(v => v.id === id);
  const getDriver = (id) => drivers.find(d => d.id === id);

  const selectedVehicle = selectedTrip ? getVehicle(selectedTrip.vehicleId) : null;
  const distance = selectedTrip && endFormData.endOdometer ? endFormData.endOdometer - selectedTrip.startOdometer : 0;
  const fuelConsumptionNorm = selectedVehicle?.fuelConsumption || 7.5;
  const fuelUsedNorm = distance > 0 ? (distance / 100) * fuelConsumptionNorm : 0;

  const automaticallyCalculatedEndFuel = selectedTrip && distance > 0
    ? Math.max(0, (selectedTrip.startFuel || 0) + endFormData.fuelAdded - fuelUsedNorm)
    : (selectedTrip?.startFuel || 0);

  const predictedFuelUsed = distance > 0 ? fuelUsedNorm : 0;

  const filteredAndSortedTrips = useMemo(() => {
    let filtered = [...trips];

    if (searchTerm) {
      filtered = filtered.filter(trip => {
        const vehicle = getVehicle(trip.vehicleId);
        const driver = getDriver(trip.driverId);
        return (
          trip.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.startLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.endLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle?.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    const nowFilter = new Date();
    if (dateRange === 'today') {
      const today = format(nowFilter, 'yyyy-MM-dd');
      filtered = filtered.filter(trip => {
        const d = trip.startDate || trip.startTime;
        if (!d) return false;
        return format(new Date(d), 'yyyy-MM-dd') === today;
      });
    } else if (dateRange === 'week') {
      const weekAgo = new Date(nowFilter.setDate(nowFilter.getDate() - 7));
      filtered = filtered.filter(trip => {
        const d = trip.startDate || trip.startTime;
        if (!d) return false;
        return new Date(d) >= weekAgo;
      });
    } else if (dateRange === 'month') {
      const monthAgo = new Date(nowFilter.setMonth(nowFilter.getMonth() - 1));
      filtered = filtered.filter(trip => {
        const d = trip.startDate || trip.startTime;
        if (!d) return false;
        return new Date(d) >= monthAgo;
      });
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter(trip => {
        const d = trip.startDate || trip.startTime;
        if (!d) return false;
        const tripDate = new Date(d);
        return tripDate >= start && tripDate <= end;
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.startDate || b.startTime) - new Date(a.startDate || a.startTime);
        case 'date_asc':
          return new Date(a.startDate || a.startTime) - new Date(b.startDate || b.startTime);
        case 'distance_desc':
          return (b.distance || 0) - (a.distance || 0);
        case 'distance_asc':
          return (a.distance || 0) - (b.distance || 0);
        case 'card_desc':
          return (b.cardNumber || '').localeCompare(a.cardNumber || '');
        case 'card_asc':
          return (a.cardNumber || '').localeCompare(b.cardNumber || '');
        default:
          return new Date(b.startDate || b.startTime) - new Date(a.startDate || a.startTime);
      }
    });
    return filtered;
  }, [trips, searchTerm, statusFilter, sortBy, dateRange, customStartDate, customEndDate]);

  const handleSelectTrip = (tripId) => {
    const newSelected = new Set(selectedTrips);
    if (newSelected.has(tripId)) {
      newSelected.delete(tripId);
    } else {
      newSelected.add(tripId);
    }
    setSelectedTrips(newSelected);
    setSelectAll(newSelected.size === filteredAndSortedTrips.length && filteredAndSortedTrips.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTrips(new Set());
      setSelectAll(false);
    } else {
      const allIds = filteredAndSortedTrips.map(t => t.id);
      setSelectedTrips(new Set(allIds));
      setSelectAll(true);
    }
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedTrips).map(id => Number(id));
      await Promise.all(ids.map(id => api.deleteTrip(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setSelectedTrips(new Set());
      setSelectAll(false);
      setShowBulkDeleteConfirm(false);
    }
  });

  const startTripMutation = useMutation({
    mutationFn: async (data) => {
      const vehicle = getVehicle(data.vehicleId);

      const startTime = data.departureDate && data.departureTime
        ? new Date(`${data.departureDate}T${data.departureTime}:00`).toISOString()
        : new Date().toISOString();

      const tripData = {
        ...data,
        startTime,
        startDate: startTime,
        startOdometer: vehicle?.mileage || 0,
        startFuel: vehicle?.fuelLevel || 0,
        status: 'in_progress'
      };
      console.log('🚀 Rozpoczynam trasę z datą:', tripData.startTime);
      console.log('📋 Dane trasy:', tripData);
      await api.updateVehicle(Number(data.vehicleId), { status: 'in_use' });
      return api.createTrip(tripData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
      setIsStartDialogOpen(false);
      resetStartForm();
    }
  });

  const endTripMutation = useMutation({
    mutationFn: async ({ trip, endData }) => {
      const vehicle = getVehicle(trip.vehicleId);
      const distance = endData.endOdometer - trip.startOdometer;
      const fuelConsumption = vehicle?.fuelConsumption || 7.5;

      const fuelUsedNorm = (distance / 100) * fuelConsumption;
      const automaticallyCalculatedEndFuel = Math.max(0, (trip.startFuel || 0) + endData.fuelAdded - fuelUsedNorm);

      const updatedTrip = {
        ...trip,
        endDate: new Date().toISOString(),
        endTime: new Date().toISOString(),
        endOdometer: endData.endOdometer,
        endFuel: automaticallyCalculatedEndFuel,
        fuelAdded: endData.fuelAdded,
        fuelCost: endData.fuelCost,
        fuelReceiptNumber: endData.fuelReceiptNumber,
        fuelStation: endData.fuelStation,
        notes: endData.notes,
        status: 'completed',
        distance,
        fuelUsedNorm,
        fuelUsedActual: fuelUsedNorm,
      };

      await api.updateVehicle(Number(trip.vehicleId), {
        mileage: endData.endOdometer,
        fuelLevel: automaticallyCalculatedEndFuel,
        status: 'available'
      });

      const result = await api.updateTrip(Number(trip.id), updatedTrip);

      if (endData.fuelAdded > 0) {
        await api.createRefuel({
          vehicleId: Number(trip.vehicleId),
          date: new Date().toISOString().split('T')[0],
          liters: endData.fuelAdded,
          cost: endData.fuelCost || 0,
          mileage: endData.endOdometer,
          invoiceNumber: endData.fuelReceiptNumber || '',
          notes: endData.fuelStation ? `Stacja: ${endData.fuelStation}` : '',
          fullTank: false,
          tripId: Number(trip.id),
        });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['refuels'] });
      setIsEndDialogOpen(false);
      setSelectedTrip(null);
      resetEndForm();
    },
    onError: (error) => {
      console.error('❌ Błąd mutacji:', error);
      alert(`Nie udało się zakończyć trasy: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (tripId) => {
      const trip = trips.find(t => t.id === tripId);
      if (trip) {
        const vehicle = getVehicle(trip.vehicleId);
        if (vehicle && trip.status === 'in_progress') {
          await api.updateVehicle(Number(vehicle.id), {
            status: 'available',
            mileage: trip.startOdometer || vehicle.mileage,
            fuelLevel: trip.startFuel || vehicle.fuelLevel,
          });
        }
      }
      return api.deleteTrip(Number(tripId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setItemToDelete(null);
    }
  });

  const confirmDelete = () => {
    if (itemToDelete) deleteMutation.mutate(itemToDelete);
  };

  const handlePreview = (trip) => {
    setPreviewTrip(trip);
    setShowPreviewModal(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Blokada wyskakujących okien uniemożliwia drukowanie.'); return; }
    const element = document.getElementById('karta-drogowa-preview');
    if (!element) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Karta drogowa</title>
      <style>body{font-family:Arial,sans-serif;margin:0;padding:20px;background:white;}</style>
      </head><body>${element.outerHTML}
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const resetStartForm = () => {
    const n = new Date();
    setStartFormData({
      vehicleId: '',
      driverId: '',
      orderedBy: '',
      purpose: '',
      startLocation: '',
      endLocation: '',
      departureDate: n.toISOString().split('T')[0],
      departureTime: n.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const resetEndForm = () => {
    setEndFormData({
      endOdometer: 0,
      fuelAdded: 0,
      fuelCost: 0,
      fuelReceiptNumber: '',
      fuelStation: '',
      notes: ''
    });
  };

  const handleStartTripClick = () => {
    resetStartForm();
    setIsStartDialogOpen(true);
  };

  // ✅ ODWRÓCONA LOGIKA - sprawdzanie blokady (brak kluczyka = blokada)
  const handleStartTrip = (e) => {
    e.preventDefault();
    
    // Sprawdź, czy wymagane są kluczyki i czy wybrany pojazd NIE ma wydanego kluczyka
    if (requireKeyForTrip && startFormData.vehicleId && !hasKeyForSelectedVehicle) {
      alert(`❌ Nie można rozpocząć trasy!\n\nBrak wydanego kluczyka dla tego pojazdu.\n\nNajpierw pobierz kluczyk w module "Kluczyki".`);
      return;
    }
    
    // Jeśli nie wybrano pojazdu
    if (requireKeyForTrip && !startFormData.vehicleId) {
      alert(`❌ Wybierz pojazd z wydanym kluczykiem.`);
      return;
    }
    
    startTripMutation.mutate(startFormData);
  };

  const handleEndTrip = async (e) => {
    e.preventDefault();
    try {
      if (endFormData.endOdometer <= selectedTrip.startOdometer) {
        alert('Nowy stan licznika musi być większy niż początkowy!');
        return;
      }
      await endTripMutation.mutateAsync({ trip: selectedTrip, endData: endFormData });
    } catch (error) {
      console.error('❌ Błąd zakończenia trasy:', error);
    }
  };

  const openEndTripDialog = (trip) => {
    setSelectedTrip(trip);
    setEndFormData({
      endOdometer: trip.startOdometer || 0,
      fuelAdded: 0,
      fuelCost: 0,
      fuelReceiptNumber: '',
      fuelStation: '',
      notes: ''
    });
    setIsEndDialogOpen(true);
  };

  const activeTrips = trips.filter(t => t.status === 'in_progress');

  const stats = useMemo(() => {
    const completed = trips.filter(t => t.status === 'completed');
    const totalDistance = completed.reduce((sum, t) => sum + (t.distance || 0), 0);
    return {
      total: trips.length,
      inProgress: activeTrips.length,
      completed: completed.length,
      totalDistance
    };
  }, [trips]);

  const exportToCSV = () => {
    const headers = ['Nr karty', 'Data', 'Pojazd', 'Kierowca', 'Trasa', 'Dystans (km)', 'Status'];
    const rows = filteredAndSortedTrips.map(trip => {
      const vehicle = getVehicle(trip.vehicleId);
      const driver = getDriver(trip.driverId);
      const d = trip.startDate || trip.startTime;
      return [
        trip.cardNumber || '-',
        d ? format(new Date(d), 'dd.MM.yyyy HH:mm') : '-',
        vehicle ? `${vehicle.make} ${vehicle.model}` : '-',
        driver ? driver.name : '-',
        `${trip.startLocation || '?'} → ${trip.endLocation || '?'}`,
        trip.distance || 0,
        statusConfig[trip.status]?.label || trip.status
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `przejazdy_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Potwierdź usunięcie"
        message="Czy na pewno chcesz usunąć ten przejazd?"
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={() => bulkDeleteMutation.mutate()}
        title="Masowe usuwanie"
        message={`Czy na pewno chcesz usunąć ${selectedTrips.size} wybranych przejazdów? Tej operacji nie można cofnąć.`}
      />

      {showPreviewModal && previewTrip && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={handlePrint}
                className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-lg"
                title="Drukuj"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                title="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-full overflow-auto p-8">
              <div id="karta-drogowa-preview">
                <KartaDrogowa
                  trip={previewTrip}
                  vehicle={getVehicle(previewTrip.vehicleId)}
                  driver={getDriver(previewTrip.driverId)}
                  company={settings}
                  endMileage={previewTrip.endOdometer}
                  endFuel={previewTrip.endFuel}
                  fuelAdded={previewTrip.fuelAdded}
                  format="A4"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Podróże"
        subtitle={`${stats.total} tras • ${stats.inProgress} w trakcie • ${stats.totalDistance.toLocaleString()} km łącznie`}
        icon={Route}
        action={
          <div className="flex gap-2">
            {selectedTrips.size > 0 && (
              <Button
                onClick={() => setShowBulkDeleteConfirm(true)}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń ({selectedTrips.size})
              </Button>
            )}
            <Button
              onClick={handleStartTripClick}
              className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Rozpocznij trasę
            </Button>
          </div>
        }
      />

      {/* ✅ Informacja o dostępnych pojazdach z kluczykami */}
      {requireKeyForTrip && (
        <GlassCard className={`p-4 border-l-4 ${hasAnyIssuedKeys ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`} delay={0.15}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasAnyIssuedKeys ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {hasAnyIssuedKeys ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">
                {hasAnyIssuedKeys 
                  ? `✅ Dostępne pojazdy z kluczykami: ${issuedVehicles?.length || 0}`
                  : '❌ Brak wydanych kluczyków'}
              </p>
              <p className="text-slate-400 text-sm">
                {hasAnyIssuedKeys 
                  ? 'Możesz rozpocząć trasę tylko dla pojazdów z wydanymi kluczykami.'
                  : 'Aby rozpocząć trasę, najpierw wydaj kluczyk w module "Kluczyki".'}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {activeTrips.length > 0 && (
        <GlassCard className="p-4 border-l-4 border-amber-500" delay={0.1}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-white font-medium">Trasy w trakcie: {activeTrips.length}</p>
              <p className="text-slate-400 text-sm">Zakończ aktywne trasy, aby wygenerować karty drogowe</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Filtry i sortowanie */}
      <GlassCard className="p-4" delay={0.2}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Szukaj po nr karty, trasie, celu, rejestracji lub kierowcy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-40 bg-slate-700/50 border-slate-600 text-white">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="in_progress">W trakcie</SelectItem>
              <SelectItem value="completed">Zakończone</SelectItem>
              <SelectItem value="cancelled">Anulowane</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-44 bg-slate-700/50 border-slate-600 text-white">
              <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Sortuj" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700">
                <CalendarDays className="w-4 h-4 mr-2" />
                {dateRange === 'custom' ? 'Wybrany zakres' : dateRangeOptions.find(o => o.value === dateRange)?.label || 'Data'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700">
              {dateRangeOptions.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => {
                    setDateRange(opt.value);
                    setShowDatePicker(opt.value === 'custom');
                  }}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={exportToCSV}
            variant="outline"
            className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Eksport CSV
          </Button>
        </div>

        {showDatePicker && dateRange === 'custom' && (
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Label className="text-slate-300 text-sm">Od daty</Label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex-1">
              <Label className="text-slate-300 text-sm">Do daty</Label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
        )}
      </GlassCard>

      {/* Lista przejazdów */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredAndSortedTrips.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Route className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Brak tras</h3>
          <p className="text-slate-400 mb-4">
            {searchTerm || statusFilter !== 'all' || dateRange !== 'all'
              ? "Nie znaleziono tras spełniających kryteria"
              : "Rozpocznij pierwszą trasę"}
          </p>
          {!searchTerm && statusFilter === 'all' && dateRange === 'all' && (
            <Button
              onClick={handleStartTripClick}
              className="bg-gradient-to-r from-indigo-500 to-cyan-500"
            >
              <Play className="w-4 h-4 mr-2" />
              Rozpocznij trasę
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-slate-400 hover:text-white"
            >
              {selectAll ? <CheckSquare className="w-4 h-4 mr-1" /> : <Square className="w-4 h-4 mr-1" />}
              {selectAll ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
            </Button>
            <span className="text-xs text-slate-500">
              {selectedTrips.size} z {filteredAndSortedTrips.length} zaznaczonych
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredAndSortedTrips.map((trip, index) => {
              const StatusIcon = statusConfig[trip.status]?.icon || Clock;
              const vehicle = getVehicle(trip.vehicleId);
              const driver = getDriver(trip.driverId);
              const distance = (trip.endOdometer || 0) - (trip.startOdometer || 0);
              const isSelected = selectedTrips.has(trip.id);
              const tripDisplayDate = trip.startDate || trip.startTime;

              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <GlassCard className={`p-6 transition-all ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : ''}`} hover={true} animate={false}>
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleSelectTrip(trip.id)}
                          className="p-1 hover:bg-slate-700 rounded"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={`${statusConfig[trip.status]?.color || 'bg-slate-500'} text-white border-0`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[trip.status]?.label || trip.status}
                          </Badge>
                          <span className="text-slate-400 text-sm font-mono">
                            {trip.cardNumber || `#${String(trip.id).slice(-6)}`}
                          </span>
                          {tripDisplayDate && (
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(tripDisplayDate), 'dd.MM.yyyy HH:mm', { locale: pl })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2 text-white">
                            <MapPin className="w-4 h-4 text-indigo-400" />
                            <span className="font-medium">{trip.startLocation || 'Start'}</span>
                          </div>
                          <div className="flex-1 h-px bg-gradient-to-r from-indigo-500 to-cyan-500 max-w-[100px]" />
                          <div className="flex items-center gap-2 text-white">
                            <span className="font-medium">{trip.endLocation || 'Cel'}</span>
                            <Flag className="w-4 h-4 text-cyan-400" />
                          </div>
                        </div>

                        {trip.purpose && (
                          <p className="text-slate-300 mb-3">{trip.purpose}</p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                          {vehicle && (
                            <div className="flex items-center gap-1">
                              <Car className="w-4 h-4" />
                              {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})
                            </div>
                          )}
                          {driver && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {driver.name}
                            </div>
                          )}
                          {trip.status === 'completed' && distance > 0 && (
                            <div className="flex items-center gap-1">
                              <Gauge className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">{distance} km</span>
                            </div>
                          )}
                          {trip.status === 'in_progress' && trip.startOdometer > 0 && (
                            <div className="flex items-center gap-1">
                              <Gauge className="w-4 h-4 text-amber-400" />
                              <span className="text-amber-400 font-medium">Start: {trip.startOdometer} km</span>
                            </div>
                          )}
                        </div>

                        {trip.orderedBy && (
                          <div className="mt-3 text-sm text-slate-400">
                            Zlecił: <span className="text-slate-300">{trip.orderedBy}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {trip.status === 'in_progress' && (
                          <Button
                            onClick={() => openEndTripDialog(trip)}
                            size="sm"
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                          >
                            <StopCircle className="w-4 h-4 mr-2" />
                            Zakończ trasę
                          </Button>
                        )}

                        <Button
                          onClick={() => handlePreview(trip)}
                          size="icon"
                          className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500 hover:text-white hover:border-indigo-400 w-8 h-8 transition-all"
                          title="Podgląd karty drogowej"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Link
                          to={`/trips/${trip.id}`}
                          className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-medium rounded-lg hover:bg-indigo-500/30 transition-colors"
                        >
                          Szczegóły
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white w-8 h-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              onClick={() => handlePreview(trip)}
                              className="text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Podgląd
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                window.location.href = `/trips/${trip.id}?edit=true`;
                              }}
                              className="text-slate-300 hover:text-white hover:bg-slate-700"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                              onClick={() => setItemToDelete(trip.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Start Trip Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />
              Rozpocznij trasę
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStartTrip} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pojazd *</Label>
                <Select
                  value={startFormData.vehicleId}
                  onValueChange={(v) => setStartFormData({...startFormData, vehicleId: v})}
                  required
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Wybierz pojazd" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.filter(v => v.status === 'available').map(v => {
                      // ✅ Pojazd DOZWOLONY tylko jeśli ma wydany kluczyk (lub kluczyki nie są wymagane)
                      const hasKey = issuedVehicleIds?.includes(String(v.id));
                      const isDisabled = requireKeyForTrip && !hasKey;
                      
                      return (
                        <SelectItem 
                          key={v.id} 
                          value={v.id}
                          disabled={isDisabled}
                          className={isDisabled ? 'opacity-50' : ''}
                        >
                          {v.make} {v.model} ({v.registrationNumber}) - {v.mileage} km
                          {requireKeyForTrip && !hasKey && ' 🔒 (brak kluczyka)'}
                          {requireKeyForTrip && hasKey && ' ✅ (kluczyk wydany)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kierowca *</Label>
                <Select
                  value={startFormData.driverId}
                  onValueChange={(v) => setStartFormData({...startFormData, driverId: v})}
                  required
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Wybierz kierowcę" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.filter(d => d.status === 'active').map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ✅ Ostrzeżenie o braku kluczyka */}
            {startFormData.vehicleId && requireKeyForTrip && !hasKeyForSelectedVehicle && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Brak wydanego kluczyka dla tego pojazdu! Najpierw pobierz kluczyk w module "Kluczyki".
                </p>
              </div>
            )}

            {/* ✅ Potwierdzenie wydanego kluczyka */}
            {startFormData.vehicleId && requireKeyForTrip && hasKeyForSelectedVehicle && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Kluczyk wydany - możesz rozpocząć trasę.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data rozpoczęcia przejazdu *</Label>
                <Input
                  type="date"
                  value={startFormData.departureDate}
                  onChange={(e) => setStartFormData({...startFormData, departureDate: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Godzina rozpoczęcia *</Label>
                <Input
                  type="time"
                  value={startFormData.departureTime}
                  onChange={(e) => setStartFormData({...startFormData, departureTime: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kto zlecił przejazd? *</Label>
              <Input
                value={startFormData.orderedBy}
                onChange={(e) => setStartFormData({...startFormData, orderedBy: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="Imię i nazwisko zlecającego"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Skąd</Label>
                <Input
                  value={startFormData.startLocation}
                  onChange={(e) => setStartFormData({...startFormData, startLocation: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Miejsce startu"
                />
              </div>
              <div className="space-y-2">
                <Label>Dokąd</Label>
                <Input
                  value={startFormData.endLocation}
                  onChange={(e) => setStartFormData({...startFormData, endLocation: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Miejsce docelowe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cel podróży</Label>
              <Input
                value={startFormData.purpose}
                onChange={(e) => setStartFormData({...startFormData, purpose: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="np. Wyjazd służbowy"
              />
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
              <p className="text-sm text-indigo-400 mb-1">Informacja - automatycznie zapisane:</p>
              <p className="text-xs text-slate-400">
                • Aktualny przebieg pojazdu
                <br />
                • Stan paliwa
                <br />
                • Numer karty drogowej (zgodny z ustawieniami)
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStartDialogOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                disabled={startTripMutation.isPending || (requireKeyForTrip && startFormData.vehicleId && !hasKeyForSelectedVehicle)}
              >
                <Play className="w-4 h-4 mr-2" />
                Rozpocznij
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* End Trip Dialog */}
      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
<DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md max-h-[90vh] overflow-y-auto">          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <StopCircle className="w-5 h-5 text-red-400" />
              Zakończ trasę
            </DialogTitle>
          </DialogHeader>

          {selectedTrip && (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-400 mb-2">Dane rozpoczęcia trasy:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Przebieg początkowy:</span>
                  <div className="text-white font-bold text-lg">{selectedTrip.startOdometer} km</div>
                </div>
                <div>
                  <span className="text-slate-400">Stan paliwa początkowy:</span>
                  <div className="text-white font-bold text-lg">{(selectedTrip.startFuel || 0).toFixed(2)} L</div>
                </div>
              </div>
              {selectedTrip.cardNumber && (
                <p className="text-xs text-slate-500 mt-2">
                  Nr karty: {selectedTrip.cardNumber}
                </p>
              )}
              {(selectedTrip.startDate || selectedTrip.startTime) && (
                <p className="text-xs text-slate-500">
                  Rozpoczęto: {format(new Date(selectedTrip.startDate || selectedTrip.startTime), 'dd MMM yyyy, HH:mm', { locale: pl })}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleEndTrip} className="space-y-4">
            <div className="space-y-2">
              <Label>Nowy stan licznika (km) *</Label>
              <Input
                type="number"
                value={endFormData.endOdometer}
                onChange={(e) => {
                  const newOdometer = parseInt(e.target.value) || 0;
                  setEndFormData({...endFormData, endOdometer: newOdometer});
                }}
                className="bg-slate-800 border-slate-700 text-lg font-semibold"
                min={selectedTrip?.startOdometer || 0}
                required
              />
              {selectedTrip && distance > 0 && (
                <div className="mt-2 p-2 bg-emerald-500/20 rounded-lg">
                  <p className="text-emerald-400 text-sm font-semibold">
                    Przejechany dystans: <span className="text-xl">{distance} km</span>
                  </p>
                  <p className="text-slate-400 text-xs">
                    = {endFormData.endOdometer} km - {selectedTrip.startOdometer} km
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Dolano paliwa (L) – opcjonalnie</Label>
              <Input
                type="number"
                step="0.1"
                value={endFormData.fuelAdded}
                onChange={(e) => setEndFormData({...endFormData, fuelAdded: parseFloat(e.target.value) || 0})}
                className="bg-slate-800 border-slate-700"
                placeholder="Ilość paliwa zatankowanego podczas trasy"
              />
            </div>

            {distance > 0 && (
              <div className="bg-gradient-to-r from-indigo-900/50 to-cyan-900/50 rounded-lg p-4 border border-indigo-500/30">
                <h4 className="text-indigo-300 font-semibold mb-3 text-sm uppercase tracking-wide">
                  Automatyczne wyliczenia
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Średnie spalanie normatywne:</span>
                    <div className="text-cyan-400 font-bold text-lg">{fuelConsumptionNorm} L/100km</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Przewidywane zużycie:</span>
                    <div className="text-orange-400 font-bold text-lg">{predictedFuelUsed.toFixed(2)} L</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">AUTOMATYCZNY NOWY STAN PALIWA:</span>
                    <div className="text-green-400 font-bold text-2xl mt-1">
                      {automaticallyCalculatedEndFuel.toFixed(2)} L
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      = {selectedTrip?.startFuel || 0} L (start) + {endFormData.fuelAdded} L (dolane) - {predictedFuelUsed.toFixed(2)} L (zużycie)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gdzie zatankowano</Label>
                <Input
                  type="text"
                  value={endFormData.fuelStation}
                  onChange={(e) => setEndFormData({...endFormData, fuelStation: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="np. Orlen"
                />
              </div>
              <div className="space-y-2">
                <Label>Nr kwitu paliwowego</Label>
                <Input
                  type="text"
                  value={endFormData.fuelReceiptNumber}
                  onChange={(e) => setEndFormData({...endFormData, fuelReceiptNumber: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Koszt tankowania (zł)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={endFormData.fuelCost}
                onChange={(e) => setEndFormData({...endFormData, fuelCost: parseFloat(e.target.value) || 0})}
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <div className="space-y-2">
              <Label>Uwagi (opcjonalnie)</Label>
              <Textarea
                value={endFormData.notes}
                onChange={(e) => setEndFormData({...endFormData, notes: e.target.value})}
                className="bg-slate-800 border-slate-700"
                rows={3}
                placeholder="Dodatkowe informacje o trasie..."
              />
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-sm text-emerald-400">Po zakończeniu:</p>
              <ul className="text-xs text-emerald-300/80 mt-1 space-y-1">
                <li>• Stan paliwa zostanie automatycznie obliczony</li>
                <li>• Przebieg pojazdu zostanie zaktualizowany</li>
                <li>• Karta drogowa będzie dostępna do podglądu</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEndDialogOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                disabled={endTripMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Zakończ i generuj kartę
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}