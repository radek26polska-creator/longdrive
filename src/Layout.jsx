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
  Map,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppSettings } from "@/lib/ThemeContext";
import { useAuth } from "@/lib/AuthContext";
import { useMediaQuery } from "react-responsive";

// Mapowanie stron na ścieżki URL
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

// Wszystkie pozycje menu z powiązaniem do klucza modułu
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

// Bottom navigation (5 najważniejszych ikon na telefon)
const bottomNavItems = [
  { name: "Strona główna", icon: Home, page: "Dashboard" },
  { name: "Pojazdy", icon: Car, page: "Vehicles" },
  { name: "Podróże", icon: Route, page: "Trips" },
  { name: "Mapa", icon: Map, page: "MapPage" },
  { name: "Ustawienia", icon: Settings, page: "Settings" },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modulesSettings, setModulesSettings] = useState({});
  const { settings } = useAppSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 768 });

  // Wczytaj ustawienia modułów z localStorage
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
    if (isMobile) setSidebarOpen(false);
  };

  const isActive = (page) => {
    if (page === "Dashboard") return location.pathname === "/";
    if (page === "TripDetail") return location.pathname.startsWith("/trips/");
    return location.pathname.toLowerCase() === `/${page.toLowerCase()}` ||
           location.pathname.toLowerCase().startsWith(`/${page.toLowerCase()}/`);
  };

  const getPageUrl = (page) => {
    return pageToPath[page] || `/${page.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-theme-white text-lg">LongDrive</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-theme-white-secondary hover:text-theme-white min-w-[44px] min-h-[44px]"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar (desktop + mobile overlay) */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: sidebarOpen ? 0 : isMobile ? -280 : 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 left-0 z-40 h-full w-72 sidebar ${
              isMobile && !sidebarOpen ? "hidden" : "block"
            } lg:block`}
          >
            <div className="flex flex-col h-full p-6">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-10">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg"
                >
                  <Car className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="font-bold text-theme-white text-xl tracking-tight">LongDrive</h1>
                  <p className="text-xs text-theme-white-secondary">Zarządzanie Flotą</p>
                </div>
              </div>

              {/* Menu nawigacyjne */}
              <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.page);
                  return (
                    <Link
                      key={item.page}
                      to={getPageUrl(item.page)}
                      onClick={() => isMobile && setSidebarOpen(false)}
                    >
                      <motion.div
                        whileHover={{ x: 4 }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                          active
                            ? "bg-gradient-primary text-white shadow-lg shadow-primary/25"
                            : "text-theme-white-secondary hover:text-theme-white hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.name}</span>
                        {active && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>

              {/* User section */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-6 border-t border-white/10"
                >
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <Avatar className="w-10 h-10 border-2 border-primary/50">
                      <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                        {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme-white truncate">
                        {user.name || "Użytkownik"}
                      </p>
                      <p className="text-xs text-theme-white-secondary truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-theme-white-secondary hover:text-red-400 hover:bg-red-500/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Wyloguj się
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Bottom Navigation (tylko mobile) */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
          <div className="flex justify-around items-center py-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.page);
              return (
                <Link
                  key={item.page}
                  to={getPageUrl(item.page)}
                  className="flex flex-col items-center justify-center min-w-[64px] py-2"
                >
                  <Icon
                    className={`w-6 h-6 transition-all ${
                      active
                        ? "text-primary drop-shadow-lg"
                        : "text-theme-white-secondary group-hover:text-theme-white"
                    }`}
                  />
                  <span
                    className={`text-xs mt-1 transition-all ${
                      active ? "text-primary font-medium" : "text-theme-white-secondary"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content - z dolnym paddingiem dla mobile bottom nav */}
      <main className={`lg:ml-72 min-h-screen pt-16 lg:pt-0 ${isMobile ? "pb-20" : ""}`}>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
