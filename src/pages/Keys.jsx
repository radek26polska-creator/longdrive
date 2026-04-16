import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Key,
  Plus,
  Search,
  Car,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
  RotateCcw
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
  DialogDescription,
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
import { useAppSettings } from '@/lib/ThemeContext';
import { toast } from "sonner";
import api from "@/api/apiClient";

export default function Keys() {
  const { settings } = useAppSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    action: 'issued',
    timestamp: new Date().toISOString().slice(0, 16),
    notes: '',
    issuedBy: ''
  });

  const queryClient = useQueryClient();

  const { data: keyLogs = [], isLoading } = useQuery({
    queryKey: ['keyLogs'],
    queryFn: api.getKeyLogs,
    refetchOnMount: true
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: api.getVehicles,
    refetchOnMount: true
  });

  const { data: driversRaw = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: api.getDrivers,
    refetchOnMount: true
  });

  const drivers = driversRaw.map(driver => ({
    ...driver,
    name: `${driver.firstName} ${driver.lastName}`
  }));

  // Mutacja do tworzenia nowego wpisu (wydania kluczyka)
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        vehicleId: Number(data.vehicleId),
        driverId: Number(data.driverId), // Teraz wymagane
        action: 'issued',
        timestamp: new Date(data.timestamp).toISOString(),
        notes: data.notes || '',
        issuedBy: data.issuedBy || ''
      };
      console.log('📤 Tworzenie wpisu kluczyka:', payload);
      return api.createKeyLog(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyLogs'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Kluczyk został wydany');
    },
    onError: (error) => {
      console.error('❌ Błąd tworzenia:', error);
      toast.error(`Nie udało się dodać wpisu: ${error.message}`);
    }
  });

  // Mutacja do zwrotu kluczyka - tworzy nowy wpis z akcją 'returned'
  const returnMutation = useMutation({
    mutationFn: async (log) => {
      const payload = {
        vehicleId: Number(log.vehicleId),
        driverId: Number(log.driverId),
        action: 'returned',
        timestamp: new Date().toISOString(),
        notes: log.notes || '',
        issuedBy: log.issuedBy || ''
      };
      console.log('📤 Zwrot kluczyka (nowy wpis):', payload);
      return api.createKeyLog(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyLogs'] });
      toast.success('Kluczyk został zwrócony');
    },
    onError: (error) => {
      console.error('❌ Błąd zwrotu:', error);
      toast.error(`Nie udało się zwrócić kluczyka: ${error.message}`);
    }
  });

  // Mutacja do edycji wpisu
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const payload = {
        vehicleId: Number(data.vehicleId),
        driverId: Number(data.driverId),
        action: data.action,
        timestamp: new Date(data.timestamp).toISOString(),
        notes: data.notes || '',
        issuedBy: data.issuedBy || ''
      };
      console.log('📤 Aktualizacja wpisu:', { id, payload });
      return api.updateKeyLog(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyLogs'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Wpis został zaktualizowany');
    },
    onError: (error) => {
      console.error('❌ Błąd aktualizacji:', error);
      toast.error(`Nie udało się zaktualizować wpisu: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteKeyLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyLogs'] });
      toast.success('Wpis został usunięty');
    },
    onError: (error) => {
      toast.error(`Nie udało się usunąć wpisu: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      driverId: '',
      action: 'issued',
      timestamp: new Date().toISOString().slice(0, 16),
      notes: '',
      issuedBy: ''
    });
    setEditingLog(null);
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      vehicleId: log.vehicleId ? String(log.vehicleId) : '',
      driverId: log.driverId ? String(log.driverId) : '',
      action: log.action || 'issued',
      timestamp: log.timestamp?.slice(0, 16) || new Date().toISOString().slice(0, 16),
      notes: log.notes || '',
      issuedBy: log.issuedBy || ''
    });
    setIsDialogOpen(true);
  };

  // Funkcja do szybkiego zwrotu kluczyka
  const handleQuickReturn = (log) => {
    returnMutation.mutate(log);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.vehicleId || !formData.driverId) {
      toast.error('Pojazd i kierowca są wymagane');
      return;
    }
    
    if (editingLog) {
      updateMutation.mutate({ id: editingLog.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getVehicleName = (id) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.make} ${v.model} (${v.registrationNumber})` : 'Nieznany';
  };

  const getDriverName = (id) => {
    if (!id) return null;
    const d = drivers.find(d => d.id === id);
    return d ? d.name : 'Nieznany';
  };

  // Pobierz ostatnią akcję dla każdego pojazdu
  const getLastActionPerVehicle = () => {
    const vehicleMap = new Map();
    
    keyLogs.forEach(log => {
      if (!log.vehicleId) return;
      const existing = vehicleMap.get(log.vehicleId);
      if (!existing || new Date(log.timestamp) > new Date(existing.timestamp)) {
        vehicleMap.set(log.vehicleId, log);
      }
    });
    
    return Array.from(vehicleMap.values());
  };

  // Aktywne wydania to te, gdzie ostatnia akcja to 'issued'
  const activeIssues = getLastActionPerVehicle().filter(log => log.action === 'issued');
  const hasActiveIssues = activeIssues.length > 0;

  const filteredLogs = keyLogs.filter(log => {
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    const driver = drivers.find(d => d.id === log.driverId);
    const searchLower = searchTerm.toLowerCase();
    return vehicle?.registrationNumber?.toLowerCase().includes(searchLower) ||
           vehicle?.make?.toLowerCase().includes(searchLower) ||
           driver?.name?.toLowerCase().includes(searchLower) ||
           log.notes?.toLowerCase().includes(searchLower);
  });

  // Sortowanie od najnowszych
  const sortedLogs = [...filteredLogs].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ewidencja kluczyków"
        subtitle={`${keyLogs.length} wpisów w rejestrze`}
        icon={Key}
        action={
          <Button 
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Wydaj kluczyk
          </Button>
        }
      />

      {settings.requireKeyForTrip && hasActiveIssues && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                ⚠️ UWAGA – wydane kluczyki blokują możliwość rozpoczęcia trasy!
              </h3>
              <p className="text-red-200 mb-4">
                Następujące kluczyki są aktualnie poza biurem. Aby odblokować możliwość rozpoczęcia trasy, 
                wszystkie muszą zostać zwrócone.
              </p>
              <div className="space-y-2">
                {activeIssues.map(issue => {
                  const vehicle = vehicles.find(v => v.id === issue.vehicleId);
                  const driver = drivers.find(d => d.id === issue.driverId);
                  return (
                    <div key={issue.id} className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">
                            {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'Nieznany pojazd'}
                          </p>
                          <p className="text-sm text-red-200">
                            Wydano: {driver?.name || 'Nieznany kierowca'} • {format(new Date(issue.timestamp), 'HH:mm, dd MMM', { locale: pl })}
                          </p>
                          {issue.notes && (
                            <p className="text-xs text-red-300 mt-1">Uwagi: {issue.notes}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-200 hover:bg-red-500/20"
                          onClick={() => handleQuickReturn(issue)}
                          disabled={returnMutation.isPending}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Zwróć
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-red-500/40 rounded-lg">
                <p className="text-white font-medium flex items-center gap-2">
                  <span className="text-lg">🔴</span>
                  Aby rozpocząć trasę, musisz najpierw zwrócić wszystkie kluczyki!
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <GlassCard className="p-4" delay={0.1}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Szukaj po pojeździe lub kierowcy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sortedLogs.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Key className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Brak wpisów</h3>
          <p className="text-slate-400 mb-4">
            {searchTerm 
              ? "Nie znaleziono wpisów spełniających kryteria"
              : "Dodaj pierwszy wpis do ewidencji"}
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-cyan-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Wydaj kluczyk
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                <GlassCard className="p-4" hover={true} animate={false}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      log.action === 'issued'
                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30' 
                        : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                    }`}>
                      {log.action === 'issued'
                        ? <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                        : <ArrowDownLeft className="w-5 h-5 text-amber-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${
                          log.action === 'issued' ? 'bg-emerald-500' : 'bg-amber-500'
                        } text-white border-0`}>
                          {log.action === 'issued' ? 'Wydano' : 'Zwrócono'}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {log.timestamp && format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm', { locale: pl })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1 text-white">
                          <Car className="w-4 h-4 text-indigo-400" />
                          {getVehicleName(log.vehicleId)}
                        </div>
                        {log.driverId && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <User className="w-4 h-4" />
                            {getDriverName(log.driverId)}
                          </div>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-slate-500 text-xs mt-1">{log.notes}</p>
                      )}
                      {log.issuedBy && (
                        <p className="text-slate-500 text-xs mt-1">
                          {log.action === 'issued' ? 'Wydał' : 'Przyjął'}: {log.issuedBy}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {log.action === 'issued' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/20"
                          onClick={() => handleQuickReturn(log)}
                          disabled={returnMutation.isPending}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Zwróć
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(log)}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteMutation.mutate(log.id)}
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
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingLog ? 'Edytuj wpis' : 'Wydaj kluczyk'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingLog ? 'Zmień dane istniejącego wpisu' : 'Zarejestruj wydanie kluczyka do pojazdu'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Pojazd *</Label>
              <Select 
                value={formData.vehicleId || undefined} 
                onValueChange={(v) => setFormData({...formData, vehicleId: v})}
                required
              >
                <SelectTrigger id="vehicle" className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Wybierz pojazd" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.make} {v.model} ({v.registrationNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver">Kierowca *</Label>
              <Select 
                value={formData.driverId || undefined}
                onValueChange={(v) => setFormData({...formData, driverId: v})}
                required
              >
                <SelectTrigger id="driver" className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Wybierz kierowcę" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {drivers.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Akcja *</Label>
              <Select 
                value={formData.action} 
                onValueChange={(v) => setFormData({...formData, action: v})}
                required
              >
                <SelectTrigger id="action" className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="issued">Wydanie</SelectItem>
                  <SelectItem value="returned">Zwrot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timestamp">Data i czas *</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => setFormData({...formData, timestamp: e.target.value})}
                className="bg-slate-800 border-slate-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuedBy">Wydający/Przyjmujący *</Label>
              <Input
                id="issuedBy"
                value={formData.issuedBy}
                onChange={(e) => setFormData({...formData, issuedBy: e.target.value})}
                className="bg-slate-800 border-slate-700"
                placeholder="Imię i nazwisko"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Uwagi</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-slate-800 border-slate-700"
                rows={3}
                placeholder="Dodatkowe informacje..."
              />
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
                {createMutation.isPending || updateMutation.isPending ? (
                  'Zapisywanie...'
                ) : editingLog ? (
                  'Zapisz zmiany'
                ) : (
                  'Wydaj kluczyk'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}