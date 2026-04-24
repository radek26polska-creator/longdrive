import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  X,
  Car,
  Wrench,
  Fuel,
  AlertTriangle,
  FileText,
  Trash2,
  Edit
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";

// STAXX: Angielskie nazwy dni
const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Typy wydarzeń z ikonami i kolorami
const eventTypes = {
  inspection: { label: "Przegląd", icon: Wrench, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", bg: "bg-yellow-500/10" },
  insurance: { label: "Ubezpieczenie", icon: FileText, color: "bg-blue-500/20 text-blue-400 border-blue-500/30", bg: "bg-blue-500/10" },
  service: { label: "Serwis", icon: Wrench, color: "bg-orange-500/20 text-orange-400 border-orange-500/30", bg: "bg-orange-500/10" },
  refueling: { label: "Tankowanie", icon: Fuel, color: "bg-green-500/20 text-green-400 border-green-500/30", bg: "bg-green-500/10" },
  trip: { label: "Przejazd", icon: Car, color: "bg-purple-500/20 text-purple-400 border-purple-500/30", bg: "bg-purple-500/10" },
  other: { label: "Inne", icon: CalendarIcon, color: "bg-slate-500/20 text-slate-400 border-slate-500/30", bg: "bg-slate-500/10" },
};

// Klucz do localStorage
const STORAGE_KEY = "calendar_events";

export default function CalendarWidget({ trips = [], services = [], refuelings = [], vehicles = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // Stan dla nowego wydarzenia
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "other",
    description: "",
    vehicleId: "",
    cost: "",
  });

  // Wczytaj zapisane wydarzenia z localStorage
  const [customEvents, setCustomEvents] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Zapisz wydarzenia do localStorage
  const saveCustomEvents = (events) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    setCustomEvents(events);
  };

  // Połącz wszystkie wydarzenia (z API + z localStorage)
  const allEvents = useMemo(() => {
    const events = [];

    // Wydarzenia z trips
    trips.forEach((trip) => {
      const date = trip.startDate || trip.startTime;
      if (date) {
        events.push({
          id: `trip-${trip.id}`,
          date: new Date(date),
          title: `Przejazd: ${trip.startLocation || "Start"} → ${trip.endLocation || "Cel"}`,
          type: "trip",
          data: trip,
          isCustom: false,
        });
      }
    });

    // Wydarzenia z services
    services.forEach((service) => {
      if (service.date) {
        events.push({
          id: `service-${service.id}`,
          date: new Date(service.date),
          title: service.name || "Serwis",
          type: "service",
          data: service,
          isCustom: false,
        });
      }
    });

    // Wydarzenia z refuelings
    refuelings.forEach((refuel) => {
      if (refuel.date) {
        events.push({
          id: `refuel-${refuel.id}`,
          date: new Date(refuel.date),
          title: `Tankowanie: ${refuel.liters || 0} L`,
          type: "refueling",
          data: refuel,
          isCustom: false,
        });
      }
    });

    // Wydarzenia z localStorage (customowe)
    customEvents.forEach((event) => {
      if (event.date) {
        events.push({
          ...event,
          date: new Date(event.date),
          isCustom: true,
        });
      }
    });

    return events;
  }, [trips, services, refuelings, customEvents]);

  // Grupowanie wydarzeń po dniu
  const eventsByDate = useMemo(() => {
    const map = new Map();
    allEvents.forEach((event) => {
      const dateKey = format(event.date, "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(event);
    });
    return map;
  }, [allEvents]);

  // Dni w miesiącu
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }); // Niedziela jako pierwszy dzień
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const hasEvents = (date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return eventsByDate.has(dateKey);
  };

  const getEventsForDate = (date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return eventsByDate.get(dateKey) || [];
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    if (!selectedDate) {
      toast.error("Najpierw wybierz dzień");
      return;
    }
    setEditingEvent(null);
    setNewEvent({
      title: "",
      type: "other",
      description: "",
      vehicleId: "",
      cost: "",
    });
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title || "",
      type: event.type || "other",
      description: event.description || "",
      vehicleId: event.vehicleId || "",
      cost: event.cost || "",
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title.trim()) {
      toast.error("Podaj tytuł wydarzenia");
      return;
    }

    const eventData = {
      id: editingEvent?.id || Date.now().toString(),
      date: selectedDate.toISOString(),
      title: newEvent.title,
      type: newEvent.type,
      description: newEvent.description,
      vehicleId: newEvent.vehicleId || null,
      cost: newEvent.cost || null,
      createdAt: new Date().toISOString(),
    };

    if (editingEvent) {
      // Aktualizacja istniejącego wydarzenia
      const updated = customEvents.map((e) => 
        e.id === editingEvent.id ? eventData : e
      );
      saveCustomEvents(updated);
      toast.success("Wydarzenie zaktualizowane");
    } else {
      // Dodanie nowego wydarzenia
      saveCustomEvents([...customEvents, eventData]);
      toast.success("Wydarzenie dodane");
    }

    setShowEventModal(false);
    setNewEvent({
      title: "",
      type: "other",
      description: "",
      vehicleId: "",
      cost: "",
    });
  };

  const handleDeleteEvent = (eventId) => {
    const updated = customEvents.filter((e) => e.id !== eventId);
    saveCustomEvents(updated);
    toast.success("Wydarzenie usunięte");
    setShowEventModal(false);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const eventTypeInfo = (type) => eventTypes[type] || eventTypes.other;

  const getVehicleName = (vehicleId) => {
    if (!vehicleId) return null;
    const vehicle = vehicles.find((v) => v.id == vehicleId);
    return vehicle ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || vehicle.name : null;
  };

  // Formatowanie daty na display
  const formatDate = (date) => {
    return format(date, "dd MMMM yyyy", { locale: pl });
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        {/* Nagłówek z miesiącem */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-8 h-8 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-white font-semibold text-lg">
            {format(currentMonth, "MMMM yyyy", { locale: pl })}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-8 h-8 text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* STAXX: Nagłówek "Date" */}
        <div className="mb-2">
          <p className="text-slate-400 text-xs uppercase tracking-wider">Date</p>
        </div>

        {/* Kalendarz - siatka 7 kolumn */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs text-slate-400 font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Dni miesiąca */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasEvent = hasEvents(day);
            const isTodayDate = isToday(day);

            return (
              <button
                key={idx}
                onClick={() => handleDateClick(day)}
                className={`
                  text-center py-2 text-sm rounded-lg transition-all relative
                  ${isCurrentMonth ? "text-white" : "text-slate-600"}
                  ${isSelected ? "bg-gradient-primary text-white shadow-lg" : ""}
                  ${!isSelected && !isTodayDate ? "hover:bg-indigo-500/20" : ""}
                `}
              >
                {format(day, "d")}
                {hasEvent && !isSelected && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
                {isTodayDate && !isSelected && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Przycisk dodawania wydarzenia */}
        <div className="mt-4 pt-3 border-t border-slate-700">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs gap-2"
            onClick={handleAddEvent}
          >
            <Plus className="w-3 h-3" />
            {selectedDate ? `Dodaj wydarzenie na ${formatDate(selectedDate)}` : "Najpierw wybierz dzień"}
          </Button>
        </div>
      </GlassCard>

      {/* Lista wydarzeń pod kalendarzem */}
      {selectedDate && (
        <GlassCard className="p-4">
          <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Wydarzenia - {formatDate(selectedDate)}
          </h4>
          
          {selectedDateEvents.length === 0 ? (
            <div className="text-center py-6">
              <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Brak wydarzeń w tym dniu</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-indigo-400"
                onClick={handleAddEvent}
              >
                <Plus className="w-3 h-3 mr-1" />
                Dodaj wydarzenie
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedDateEvents.map((event, idx) => {
                const typeInfo = eventTypeInfo(event.type);
                const Icon = typeInfo.icon;
                const isCustom = event.isCustom;
                
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${typeInfo.color}`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white text-sm font-medium">{event.title}</p>
                        <Badge className="text-xs bg-slate-700/50">
                          {typeInfo.label}
                        </Badge>
                        {isCustom && (
                          <Badge className="text-xs bg-indigo-500/20 text-indigo-400">
                            Własne
                          </Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-slate-400 text-xs mt-1">{event.description}</p>
                      )}
                      {event.vehicleId && getVehicleName(event.vehicleId) && (
                        <p className="text-slate-500 text-xs mt-1">
                          Pojazd: {getVehicleName(event.vehicleId)}
                        </p>
                      )}
                      {event.cost && (
                        <p className="text-slate-500 text-xs mt-1">Koszt: {event.cost} zł</p>
                      )}
                      {event.data?.vehicleId && !event.isCustom && (
                        <p className="text-slate-500 text-xs mt-1">
                          Pojazd: {getVehicleName(event.data.vehicleId)}
                        </p>
                      )}
                    </div>
                    
                    {/* Przyciski akcji tylko dla własnych wydarzeń */}
                    {isCustom && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-slate-400 hover:text-yellow-400"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-slate-400 hover:text-red-400"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Modal dodawania/edycji wydarzenia */}
      <AnimatePresence>
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-800 rounded-xl max-w-md w-full border border-slate-700 shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h3 className="text-white font-semibold">
                  {editingEvent ? "Edytuj wydarzenie" : "Dodaj wydarzenie"}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setShowEventModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-slate-400 text-sm block mb-1">Data</label>
                  <p className="text-white font-medium">
                    {selectedDate && formatDate(selectedDate)}
                  </p>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm block mb-1">Typ wydarzenia</Label>
                  <Select value={newEvent.type} onValueChange={(val) => setNewEvent({...newEvent, type: val})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {Object.entries(eventTypes).map(([key, val]) => (
                        <SelectItem key={key} value={key} className="text-white">
                          <div className="flex items-center gap-2">
                            <val.icon className="w-3 h-3" />
                            {val.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-400 text-sm block mb-1">Tytuł *</Label>
                  <Input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="np. Przegląd techniczny"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-400 text-sm block mb-1">Opis (opcjonalnie)</Label>
                  <Input
                    type="text"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Dodatkowe informacje"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
				<div>
  <Label className="text-slate-400 text-sm block mb-1">Pojazd (opcjonalnie)</Label>
  <Select 
    value={newEvent.vehicleId || "none"} 
    onValueChange={(val) => setNewEvent({...newEvent, vehicleId: val === "none" ? "" : val})}
  >
    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
      <SelectValue placeholder="Wybierz pojazd" />
    </SelectTrigger>
    <SelectContent className="bg-slate-800 border-slate-700">
      <SelectItem value="none" className="text-white">Brak</SelectItem>
      {vehicles.map((v) => (
        <SelectItem key={v.id} value={String(v.id)} className="text-white">
          {v.make} {v.model} ({v.registrationNumber})
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>



                <div>
                  <Label className="text-slate-400 text-sm block mb-1">Koszt (zł, opcjonalnie)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newEvent.cost}
                    onChange={(e) => setNewEvent({...newEvent, cost: e.target.value})}
                    placeholder="0.00"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEventModal(false)}
                  >
                    Anuluj
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-primary"
                    onClick={handleSaveEvent}
                  >
                    {editingEvent ? "Zapisz zmiany" : "Dodaj"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}