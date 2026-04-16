import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  User,
  CreditCard,
  AlertCircle
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { toast } from "sonner";
import api from "@/api/apiClient";

const statusConfig = {
  active: { label: 'Aktywny', color: 'bg-emerald-500' },
  inactive: { label: 'Nieaktywny', color: 'bg-slate-500' },
  on_leave: { label: 'Urlop', color: 'bg-amber-500' }
};

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseExpiry: '',
    status: 'active'
  });

  const queryClient = useQueryClient();

  // Pobranie kierowców – surowe dane z backendu (firstName, lastName)
  const { data: rawDrivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: api.getDrivers,
    refetchOnMount: true
  });

  // Transformacja – dodajemy pole name do każdego kierowcy
  const drivers = rawDrivers.map(driver => ({
    ...driver,
    name: `${driver.firstName} ${driver.lastName}`
  }));

  // Funkcja sprawdzająca duplikat emaila
  const isEmailDuplicate = (email, currentDriverId = null) => {
    if (!email) return false;
    return drivers.some(driver => 
      driver.email?.toLowerCase() === email.toLowerCase() &&
      driver.id !== currentDriverId
    );
  };

  // 🔧 POPRAWIONA: Sprawdza duplikat numeru prawa jazdy (pomija puste wartości)
  const isLicenseNumberDuplicate = (licenseNumber, currentDriverId = null) => {
    // Jeśli numer jest pusty, nie sprawdzamy duplikatu
    if (!licenseNumber || licenseNumber.trim() === '') return false;
    
    return drivers.some(driver => 
      driver.licenseNumber && 
      driver.licenseNumber.toLowerCase() === licenseNumber.toLowerCase() &&
      driver.id !== currentDriverId
    );
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // 🔧 POPRAWA: Jeśli licenseNumber jest pusty, wyślij null zamiast pustego stringa
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        email: data.email || null,
        licenseNumber: data.licenseNumber && data.licenseNumber.trim() !== '' ? data.licenseNumber : null,
        licenseExpiry: data.licenseExpiry || null,
        status: data.status
      };
      return api.createDriver(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Kierowca został dodany pomyślnie');
    },
    onError: (error) => {
      console.error('Błąd dodawania kierowcy:', error);
      
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('numerem prawa jazdy już istnieje')) {
        toast.error('Podaj unikalny numer prawa jazdy lub pozostaw pole puste');
      } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        toast.error('Konflikt danych: kierowca o podanych danych już istnieje');
      } else if (errorMessage.includes('email już istnieje')) {
        toast.error('Kierowca z tym adresem email już istnieje w systemie');
      } else if (errorMessage.includes('400')) {
        toast.error('Nieprawidłowe dane kierowcy. Sprawdź poprawność wszystkich pól.');
      } else {
        toast.error(`Nie udało się dodać kierowcy: ${errorMessage || 'Błąd serwera'}`);
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // 🔧 POPRAWA: Jeśli licenseNumber jest pusty, wyślij null zamiast pustego stringa
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        email: data.email || null,
        licenseNumber: data.licenseNumber && data.licenseNumber.trim() !== '' ? data.licenseNumber : null,
        licenseExpiry: data.licenseExpiry || null,
        status: data.status
      };
      return api.updateDriver(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Dane kierowcy zostały zaktualizowane');
    },
    onError: (error) => {
      console.error('Błąd aktualizacji kierowcy:', error);
      
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('numerem prawa jazdy już istnieje')) {
        toast.error('Podaj unikalny numer prawa jazdy lub pozostaw pole puste');
      } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        toast.error('Konflikt danych: kierowca o podanych danych już istnieje');
      } else {
        toast.error(`Nie udało się zaktualizować danych: ${errorMessage || 'Błąd serwera'}`);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Kierowca został usunięty');
    },
    onError: (error) => {
      console.error('Błąd usuwania kierowcy:', error);
      toast.error('Nie udało się usunąć kierowcy. Sprawdź czy nie ma przypisanych tras.');
    }
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      licenseNumber: '',
      licenseExpiry: '',
      status: 'active'
    });
    setEditingDriver(null);
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      phone: driver.phone || '',
      email: driver.email || '',
      licenseNumber: driver.licenseNumber || '',
      licenseExpiry: driver.licenseExpiry || '',
      status: driver.status || 'active'
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Walidacja przed wysłaniem
    if (!formData.firstName.trim()) {
      toast.error('Imię jest wymagane');
      return;
    }
    
    if (!formData.lastName.trim()) {
      toast.error('Nazwisko jest wymagane');
      return;
    }
    
    // Sprawdź duplikat emaila przed wysłaniem (tylko jeśli email został podany)
    if (formData.email && isEmailDuplicate(formData.email, editingDriver?.id)) {
      toast.error('Kierowca z tym adresem email już istnieje w systemie');
      return;
    }
    
    // 🔧 POPRAWA: Sprawdź duplikat numeru prawa jazdy tylko jeśli został podany
    if (formData.licenseNumber && formData.licenseNumber.trim() !== '' && 
        isLicenseNumberDuplicate(formData.licenseNumber, editingDriver?.id)) {
      toast.error('Kierowca z tym numerem prawa jazdy już istnieje w systemie');
      return;
    }
    
    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           driver.phone?.includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kierowcy"
        subtitle={`${drivers.length} kierowców w systemie`}
        icon={Users}
        action={
          <Button 
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dodaj kierowcę
          </Button>
        }
      />

      {/* Search */}
      <GlassCard className="p-4" delay={0.1}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Szukaj kierowcy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>
      </GlassCard>

      {/* Drivers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredDrivers.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Brak kierowców</h3>
          <p className="text-slate-400 mb-4">
            {searchTerm 
              ? "Nie znaleziono kierowców spełniających kryteria"
              : "Dodaj pierwszego kierowcę do systemu"}
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-cyan-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Dodaj kierowcę
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDrivers.map((driver, index) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <GlassCard className="p-6" hover={true} animate={false}>
                  <div className="flex items-start justify-between mb-4">
                    <Avatar className="w-14 h-14 border-2 border-indigo-500/50">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-lg font-semibold">
                        {driver.firstName?.charAt(0)}{driver.lastName?.charAt(0) || 'K'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusConfig[driver.status]?.color || 'bg-slate-500'} text-white border-0`}>
                        {statusConfig[driver.status]?.label || driver.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(driver)}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Czy na pewno chcesz usunąć tego kierowcę?')) {
                                deleteMutation.mutate(driver.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">
                    {driver.firstName} {driver.lastName}
                  </h3>

                  <div className="space-y-2">
                    {driver.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone className="w-4 h-4" />
                        {driver.phone}
                      </div>
                    )}
                    {driver.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="w-4 h-4" />
                        {driver.email}
                      </div>
                    )}
                    {driver.licenseNumber && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <CreditCard className="w-4 h-4" />
                        {driver.licenseNumber}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingDriver ? 'Edytuj kierowcę' : 'Dodaj nowego kierowcę'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Imię *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nazwisko *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nr prawa jazdy</Label>
                <Input
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Opcjonalne - pozostaw puste jeśli brak"
                />
                <p className="text-xs text-slate-400">Pole opcjonalne - zostaw puste jeśli nie chcesz podawać</p>
              </div>
              <div className="space-y-2">
                <Label>Ważność prawa jazdy</Label>
                <Input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
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
                  <SelectItem value="active">Aktywny</SelectItem>
                  <SelectItem value="inactive">Nieaktywny</SelectItem>
                  <SelectItem value="on_leave">Urlop</SelectItem>
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
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingDriver ? 'Zapisywanie...' : 'Dodawanie...'}
                  </div>
                ) : (
                  editingDriver ? 'Zapisz zmiany' : 'Dodaj kierowcę'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}