import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Plus,
  Search,
  Filter,
  Fuel,
  Gauge,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  X,
  AlertCircle
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import api from "@/api/apiClient";

const statusConfig = {
  available: { label: 'Dostępny', color: 'bg-emerald-500' },
  in_use: { label: 'W użyciu', color: 'bg-amber-500' },
  maintenance: { label: 'Serwis', color: 'bg-red-500' },
  unavailable: { label: 'Niedostępny', color: 'bg-slate-500' }
};

const fuelTypes = ['Benzyna', 'Diesel', 'LPG', 'Elektryczny', 'Hybryda'];
const vehicleTypes = ['Osobowe', 'BUS', 'Ciężarowe', 'Dostawcze'];

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    registrationNumber: '',
    mileage: 0,
    fuelLevel: 0,
    tankSize: 50,
    fuelConsumption: 7,
    status: 'available',
    vehicleType: 'Osobowe',
    fuelType: 'Benzyna',
    engineCapacity: 1600,
    bodyType: ''
  });

  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.getVehicles,
    refetchOnMount: true,
    select: (data) => data.map(v => ({ ...v, id: String(v.id) }))
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateVehicle(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteVehicle(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  });

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      registrationNumber: '',
      mileage: 0,
      fuelLevel: 0,
      tankSize: 50,
      fuelConsumption: 7,
      status: 'available',
      vehicleType: 'Osobowe',
      fuelType: 'Benzyna',
      engineCapacity: 1600,
      bodyType: ''
    });
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      registrationNumber: vehicle.registrationNumber || '',
      mileage: vehicle.mileage || 0,
      fuelLevel: vehicle.fuelLevel || 0,
      tankSize: vehicle.tankSize || 50,
      fuelConsumption: vehicle.fuelConsumption || 7,
      status: vehicle.status || 'available',
      vehicleType: vehicle.vehicleType || 'Osobowe',
      fuelType: vehicle.fuelType || 'Benzyna',
      engineCapacity: vehicle.engineCapacity || 1600,
      bodyType: vehicle.bodyType || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pojazdy"
        subtitle={`${vehicles.length} pojazdów w flocie`}
        icon={Car}
        action={
          <Button 
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj pojazd
          </Button>
        }
      />

      {/* Filters */}
      <GlassCard className="p-4" delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Szukaj pojazdu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-700/50 border-slate-600 text-white">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="available">Dostępne</SelectItem>
              <SelectItem value="in_use">W użyciu</SelectItem>
              <SelectItem value="maintenance">Serwis</SelectItem>
              <SelectItem value="unavailable">Niedostępne</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Vehicles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Car className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Brak pojazdów</h3>
          <p className="text-slate-400 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? "Nie znaleziono pojazdów spełniających kryteria"
              : "Dodaj pierwszy pojazd do swojej floty"}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-cyan-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj pojazd
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredVehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <GlassCard className="p-6 h-full" hover={true} animate={false}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                      <Car className="w-7 h-7 text-slate-300" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusConfig[vehicle.status]?.color || 'bg-slate-500'} text-white border-0`}>
                        {statusConfig[vehicle.status]?.label || vehicle.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(vehicle)}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(vehicle.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-indigo-400 font-mono text-sm mb-4">
                    {vehicle.registrationNumber}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Gauge className="w-4 h-4" />
                      {vehicle.mileage?.toLocaleString()} km
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4" />
                      {vehicle.year}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Fuel className="w-4 h-4" />
                        Paliwo
                      </span>
                      <span className="text-white">
                        {vehicle.fuelLevel?.toFixed(0)}L / {vehicle.tankSize}L
                      </span>
                    </div>
                    <Progress 
                      value={(vehicle.fuelLevel / vehicle.tankSize) * 100} 
                      className="h-2 bg-slate-700"
                    />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingVehicle ? 'Edytuj pojazd' : 'Dodaj nowy pojazd'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marka</Label>
                <Input
                  value={formData.make}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nr rejestracyjny</Label>
                <Input
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Rok produkcji</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Typ pojazdu</Label>
                <Select 
                  value={formData.vehicleType} 
                  onValueChange={(v) => setFormData({...formData, vehicleType: v})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rodzaj paliwa</Label>
                <Select 
                  value={formData.fuelType} 
                  onValueChange={(v) => setFormData({...formData, fuelType: v})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Przebieg (km)</Label>
                <Input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({...formData, mileage: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Zbiornik (L)</Label>
                <Input
                  type="number"
                  value={formData.tankSize}
                  onChange={(e) => setFormData({...formData, tankSize: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Poziom paliwa (L)</Label>
                <Input
                  type="number"
                  value={formData.fuelLevel}
                  onChange={(e) => setFormData({...formData, fuelLevel: parseInt(e.target.value)})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Średnie spalanie (l/100km)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={formData.fuelConsumption}
                onChange={(e) => setFormData({...formData, fuelConsumption: parseFloat(e.target.value)})}
                className="bg-slate-800 border-slate-700"
                placeholder="np. 7.5"
              />
              <p className="text-xs text-slate-500">Norma zużycia paliwa - używana do obliczeń</p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData({...formData, status: v})}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Dostępny</SelectItem>
                  <SelectItem value="in_use">W użyciu</SelectItem>
                  <SelectItem value="maintenance">Serwis</SelectItem>
                  <SelectItem value="unavailable">Niedostępny</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Anuluj
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-cyan-500"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingVehicle ? 'Zapisz zmiany' : 'Dodaj pojazd'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}