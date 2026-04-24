import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Car,
  Users,
  Route,
  Key,
  Settings,
  Wrench,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Fuel,
  Calculator,
  Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppSettings } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";

const pageToPath = {
  Dashboard: "/",
  Vehicles: "/vehicles",
  Drivers: "/drivers",
  Trips: "/trips",
  TripDetail: "/trips",
  Keys: "/keys",
  Services: "/services",
  Statistics: "/statistics",
  Refueling: "/refueling",
  Calculators: "/calculators",
  MapPage: "/map",
  Settings: "/settings",
};

const allNavItems = [
  { name: "Strona główna", icon: LayoutDashboard, page: "Dashboard", moduleKey: null },
  { name: "Pojazdy", icon: Car, page: "Vehicles", moduleKey: null },
  { name: "Kierowcy", icon: Users, page: "Drivers", moduleKey: null },
  { name: "Podróże", icon: Route, page: "Trips", moduleKey: null },
  { name: "Kluczyki", icon: Key, page: "Keys", moduleKey: "moduleKeys" },
  { name: "Serwisy", icon: Wrench, page: "Services", moduleKey: "moduleService" },
  { name: "Statystyki", icon: BarChart3, page: "Statistics", moduleKey: "moduleStatistics" },
  { name: "Tankowania", icon: Fuel, page: "Refueling", moduleKey: "moduleFueling" },
  { name: "Kalkulatory", icon: Calculator, page: "Calculators", moduleKey: "moduleCalculators" },
  { name: "Mapa", icon: Map, page: "MapPage", moduleKey: "moduleMap" },
  { name: "Ustawienia", icon: Settings, page: "Settings", moduleKey: null },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modulesSettings, setModulesSettings] = useState({});
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadModules = () => {
      const saved = localStorage.getItem("modules_settings");
      if (saved) {
        try {
          setModulesSettings(JSON.parse(saved));
        } catch (e) {}
      }
    };
    loadModules();
    window.addEventListener("storage", loadModules);
    window.addEventListener("modulesSettingsChanged", loadModules);
    return () => {
      window.removeEventListener("storage", loadModules);
      window.removeEventListener("modulesSettingsChanged", loadModules);
    };
  }, []);

  const navItems = allNavItems.filter((item) => {
    if (!item.moduleKey) return true;
    const moduleValue = modulesSettings[item.moduleKey];
    return moduleValue !== false;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
    setSidebarOpen(false);
  };

  const isActive = (page) => {
    if (page === "Dashboard") return location.pathname === "/";
    if (page === "TripDetail") return location.pathname.startsWith("/trips/");
    return location.pathname.toLowerCase() === `/${page.toLowerCase()}` ||
           location.pathname.toLowerCase().startsWith(`/${page.toLowerCase()}/`);
  };

  const getPageUrl = (page) => pageToPath[page] || `/${page.toLowerCase()}`;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      {/* Header mobilny */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base">LongDrive</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -mr-2 rounded-lg active:bg-white/10 transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Otwórz menu"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Sidebar – wersja mobilna */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 shadow-2xl lg:static lg:translate-x-0 lg:z-0 lg:shadow-none"
            >
              <div className="flex flex-col h-full p-4">
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Car className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white text-base">LongDrive</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 -mr-2 rounded-lg active:bg-white/10 transition-colors min-w-[44px] min-h-[44px]"
                    aria-label="Zamknij menu"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Logo dla desktop - nowy wygląd STAXX */}
                <div className="hidden lg:flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-white text-xl tracking-tight">LongDrive</h1>
                    <p className="text-xs text-slate-400">Zarządzanie Flotą</p>
                  </div>
                </div>

                {/* Menu nawigacyjne - nowy wygląd STAXX */}
                <nav className="flex-1 overflow-y-auto pb-4 space-y-1 scrollbar-none">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.page);
                    return (
                      <Link
                        key={item.page}
                        to={getPageUrl(item.page)}
                        onClick={() => setSidebarOpen(false)}
                        className="block"
                      >
                        <div
                          className={`
                            flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                            active:scale-98 group
                            ${active
                              ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-indigo-400" : "group-hover:text-indigo-400"}`} />
                          <span className="font-medium text-sm">{item.name}</span>
                          {active && <ChevronRight className="w-4 h-4 ml-auto opacity-70 text-indigo-400" />}
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Stopka z użytkownikiem - nowy wygląd STAXX */}
                {user && (
                  <div className="pt-4 mt-2 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-2">
                      <Avatar className="w-9 h-9 border-2 border-indigo-500/50">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold">
                          {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user.name || "Użytkownik"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                    >
                      <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
                      <span className="text-sm font-medium">Wyloguj się</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar dla desktop - nowy wygląd STAXX */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-72 bg-slate-900 shadow-2xl z-0">
        <div className="flex flex-col h-full p-4">
          {/* Logo - nowy wygląd STAXX */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-xl tracking-tight">LongDrive</h1>
              <p className="text-xs text-slate-400">Zarządzanie Flotą</p>
            </div>
          </div>

          {/* Menu nawigacyjne - nowy wygląd STAXX */}
          <nav className="flex-1 overflow-y-auto pb-4 space-y-1 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.page);
              return (
                <Link key={item.page} to={getPageUrl(item.page)} className="block">
                  <div
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                      ${active
                        ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-indigo-400" : "group-hover:text-indigo-400"}`} />
                    <span className="font-medium text-sm">{item.name}</span>
                    {active && <ChevronRight className="w-4 h-4 ml-auto opacity-70 text-indigo-400" />}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Stopka z użytkownikiem - nowy wygląd STAXX */}
          {user && (
            <div className="pt-4 mt-2 border-t border-white/10">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-2">
                <Avatar className="w-9 h-9 border-2 border-indigo-500/50">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.name || "Użytkownik"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
              >
                <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
                <span className="text-sm font-medium">Wyloguj się</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Główna treść – uproszczona */}
      <main className="lg:ml-72 min-h-screen w-full overflow-x-hidden">
        <div className="pt-14 lg:pt-0 w-full">
          <div className="p-3 lg:p-6 w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}