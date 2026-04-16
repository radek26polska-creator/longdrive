import { QueryClient } from '@tanstack/react-query';
import api from '@/api/apiClient';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ DODANE - domyślna funkcja dla wszystkich zapytań
      queryFn: async ({ queryKey }) => {
        const [endpoint] = queryKey;
        
        // Mapowanie endpointów na funkcje API
        const apiMap = {
          'vehicles': () => api.getVehicles(),
          'drivers': () => api.getDrivers(),
          'trips': () => api.getTrips(),
          'services': () => api.getServices(),
          'refuelings': () => api.getRefuels(),
          'key-logs': () => api.getKeyLogs(),
          'keyLogs': () => api.getKeyLogs(),
          'companySettings': () => api.getCompanySettings(),
          'settings': () => api.getCompanySettings(), // alias dla /settings
          'company-settings': () => api.getCompanySettings(),
        };
        
        const apiFn = apiMap[endpoint];
        
        if (apiFn) {
          try {
            const result = await apiFn();
            // Jeśli endpoint zwraca tablicę, ale wynik nie jest tablicą - opakuj
            if (endpoint !== 'companySettings' && endpoint !== 'settings' && !Array.isArray(result)) {
              return result.data || result || [];
            }
            return result;
          } catch (error) {
            console.warn(`⚠️ Błąd fetch dla ${endpoint}:`, error.message);
            // Zwróć pustą wartość zależnie od typu endpointu
            if (endpoint === 'companySettings' || endpoint === 'settings') {
              return {};
            }
            return [];
          }
        }
        
        // Dla nieznanych endpointów
        console.warn(`⚠️ Nieznany endpoint: ${endpoint}, zwracam pustą wartość`);
        return endpoint.includes('Settings') ? {} : [];
      },
      refetchOnWindowFocus: false,  // zmienione na false - mniej zapytań
      refetchOnMount: true,
      staleTime: 5 * 60 * 1000,     // 5 minut - dane są świeże
      gcTime: 10 * 60 * 1000,       // 10 minut w cache
      retry: 1,                     // tylko 1 raz przy błędzie
    },
  },
});