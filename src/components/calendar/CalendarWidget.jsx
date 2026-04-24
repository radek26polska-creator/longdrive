import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  X,
  Clock,
  MapPin,
  Car,
  Wrench,
  Fuel,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, isToday } from "date-fns";
import { pl } from "date-fns/locale";

const weekDays = ["PN", "WT", "ŚR", "CZ", "PT", "SB", "ND"];

const getEventIcon = (type) => {
  switch (type) {
    case "trip":
      return Car;
    case "service":
      return Wrench;
    case "refueling":
      return Fuel;
    default:
      return CalendarIcon;
  }
};

const getEventColor = (type) => {
  switch (type) {
    case "trip":
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "service":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "refueling":
      return "text-green-400 bg-green-500/10 border-green-500/20";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }
};

export default function CalendarWidget({ trips = [], services = [], refuelings = [], vehicles = [], onDateSelect, onAddEvent }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventText, setNewEventText] = useState("");
  const [newEventType, setNewEventType] = useState("other");

  // Połącz wszystkie wydarzenia
  const allEvents = useMemo(() => {
    const events = [];

    trips.forEach((trip) => {
      const date = trip.startDate || trip.startTime;
      if (date) {
        events.push({
          id: `trip-${trip.id}`,
          date: new Date(date),
          title: `${trip.startLocation || "Start"} → ${trip.endLocation || "Cel"}`,
          type: "trip",
          data: trip,
        });
      }
    });

    services.forEach((service) => {
      if (service.date) {
        events.push({
          id: `service-${service.id}`,
          date: new Date(service.date),
          title: service.name || "Serwis",
          type: "service",
          data: service,
        });
      }
    });

    refuelings.forEach((refuel) => {
      if (refuel.date) {
        events.push({
          id: `refuel-${refuel.id}`,
          date: new Date(refuel.date),
          title: `${refuel.liters || 0} L - ${refuel.cost || 0} zł`,
          type: "refueling",
          data: refuel,
        });
      }
    });

    return events;
  }, [trips, services, refuelings]);

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
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
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
    if (onDateSelect) onDateSelect(date);
  };

  const handleAddEvent = () => {
    if (!newEventText.trim()) return;
    if (onAddEvent && selectedDate) {
      onAddEvent(selectedDate, { title: newEventText, type: newEventType });
    }
    setNewEventText("");
    setShowEventModal(false);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find((v) => v.id == vehicleId);
    return vehicle ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || vehicle.name || "Pojazd" : "Nieznany";
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
          <h3 className="text-theme-white font-semibold text-lg">
            {format(currentMonth, "LLLL yyyy", { locale: pl })}
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

        {/* Kalendarz - siatka dni według STAXX */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs text-slate-400 font-normal py-2">
              {day}
            </div>
          ))}
        </div>

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
                  text-center py-2 text-sm rounded-lg transition-all
                  ${isCurrentMonth ? "text-white" : "text-slate-600"}
                  ${isSelected ? "bg-gradient-primary text-white shadow-lg" : ""}
                  ${hasEvent && !isSelected ? "border-b-2 border-indigo-500" : ""}
                  ${isTodayDate && !isSelected ? "bg-indigo-500/20 text-indigo-300" : ""}
                  ${!isSelected && !isTodayDate ? "hover:bg-indigo-500/20" : ""}
                `}
              >
                {format(day, "d")}
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
            onClick={() => setShowEventModal(true)}
            disabled={!selectedDate}
          >
            <Plus className="w-3 h-3" />
            {selectedDate ? `Dodaj wydarzenie na ${format(selectedDate, "dd MMM", { locale: pl })}` : "Najpierw wybierz dzień"}
          </Button>
        </div>
      </GlassCard>

      {/* Lista wydarzeń pod kalendarzem */}
      {selectedDate && selectedDateEvents.length > 0 && (
        <GlassCard className="p-4">
          <h4 className="text-theme-white font-semibold text-sm mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Wydarzenia - {format(selectedDate, "dd MMMM yyyy", { locale: pl })}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedDateEvents.map((event, idx) => {
              const Icon = getEventIcon(event.type);
              const colorClass = getEventColor(event.type);
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${colorClass}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-theme-white text-sm font-medium">{event.title}</p>
                    <p className="text-theme-white-muted text-xs mt-0.5">
                      {event.type === "trip" && getVehicleName(event.data?.vehicleId)}
                      {event.type === "service" && `Koszt: ${event.data?.cost || 0} zł`}
                      {event.type === "refueling" && `${event.data?.liters || 0} L, ${event.data?.cost || 0} zł`}
                    </p>
                  </div>
                  <Badge className="text-xs bg-slate-700/50">
                    {event.type === "trip" && "Przejazd"}
                    {event.type === "service" && "Serwis"}
                    {event.type === "refueling" && "Tankowanie"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Modal dodawania wydarzenia */}
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
                <h3 className="text-theme-white font-semibold">Dodaj wydarzenie</h3>
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
                  <label className="text-theme-white-secondary text-sm block mb-1">Data</label>
                  <p className="text-theme-white font-medium">
                    {selectedDate && format(selectedDate, "dd MMMM yyyy", { locale: pl })}
                  </p>
                </div>
                <div>
                  <label className="text-theme-white-secondary text-sm block mb-1">Typ wydarzenia</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-theme-white"
                  >
                    <option value="other">Inne</option>
                    <option value="trip">Przejazd</option>
                    <option value="service">Serwis</option>
                    <option value="refueling">Tankowanie</option>
                  </select>
                </div>
                <div>
                  <label className="text-theme-white-secondary text-sm block mb-1">Opis</label>
                  <input
                    type="text"
                    value={newEventText}
                    onChange={(e) => setNewEventText(e.target.value)}
                    placeholder="np. Spotkanie z klientem"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-theme-white"
                    autoFocus
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
                    onClick={handleAddEvent}
                  >
                    Dodaj
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
