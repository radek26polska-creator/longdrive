import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { AlertTriangle, Download, ArrowLeft, FileText, Edit, StopCircle, Printer } from 'lucide-react';
import KartaDrogowa from '@/components/print/KartaDrogowa.jsx';
import PolecenieWyjazdu from '@/components/print/PolecenieWyjazdu.jsx';
import api from '@/api/apiClient';

export default function TripDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tripId = id ? String(id) : null;
  const editMode = searchParams.get('edit') === 'true';

  const [isEditing, setIsEditing] = useState(editMode);
  const [showEndForm, setShowEndForm] = useState(false);

  // Dane początkowe
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [orderedBy, setOrderedBy] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startOdometer, setStartOdometer] = useState(0);
  const [startFuel, setStartFuel] = useState(0);
  // Dane końcowe
  const [endOdometer, setEndOdometer] = useState(0);
  const [endFuel, setEndFuel] = useState(0);
  const [fuelAdded, setFuelAdded] = useState(0);
  const [fuelReceiptNumber, setFuelReceiptNumber] = useState('');
  const [fuelStation, setFuelStation] = useState('');
  const [fuelCost, setFuelCost] = useState(0);
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfFormat, setPdfFormat] = useState('A4');
  const [activeTab, setActiveTab] = useState('karta');

  const kartaRef = useRef(null);
  const polecenieRef = useRef(null);
  const queryClient = useQueryClient();

  // Pobieranie danych
  const { data: tripsRaw = [], isLoading: tripsLoading } = useQuery({
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
      name: `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.name || 'Nieznany'
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

  const trip = useMemo(() => trips.find(t => t.id === tripId), [trips, tripId]);
  const vehicle = useMemo(() => trip ? vehicles.find(v => v.id === trip.vehicleId) : null, [vehicles, trip]);
  const driver = useMemo(() => trip ? drivers.find(d => d.id === trip.driverId) : null, [drivers, trip]);

  useEffect(() => {
    if (trip) {
      if (trip.startDate || trip.startTime) {
        const startDateObj = new Date(trip.startDate || trip.startTime);
        if (!isNaN(startDateObj.getTime())) {
          setDepartureDate(startDateObj.toISOString().split('T')[0]);
          setDepartureTime(startDateObj.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
        }
      } else {
        setDepartureDate('');
        setDepartureTime('');
      }
      setOrderedBy(trip.orderedBy || '');
      setPurpose(trip.purpose || '');
      setStartLocation(trip.startLocation || '');
      setEndLocation(trip.endLocation || '');
      setStartOdometer(trip.startOdometer || 0);
      setStartFuel(trip.startFuel || 0);
      setEndOdometer(trip.endOdometer || 0);
      setEndFuel(trip.endFuel ?? vehicle?.fuelLevel ?? 0);
      setFuelAdded(trip.fuelAdded || 0);
      setFuelReceiptNumber(trip.fuelReceiptNumber || '');
      setFuelStation(trip.fuelStation || '');
      setFuelCost(trip.fuelCost || 0);
      if (trip.endDate) {
        const endDateObj = new Date(trip.endDate);
        if (!isNaN(endDateObj.getTime())) {
          setReturnDate(endDateObj.toISOString().split('T')[0]);
          setReturnTime(endDateObj.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
        }
      } else {
        const now = new Date();
        setReturnDate(now.toISOString().split('T')[0]);
        setReturnTime(now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
      }
    }
  }, [trip, vehicle]);

  const distance = endOdometer - startOdometer;
  const fuelConsumptionNorm = vehicle?.fuelConsumption || 7.5;
  const fuelUsedNorm = distance > 0 ? (distance / 100) * fuelConsumptionNorm : 0;
  const fuelUsedActual = startFuel + fuelAdded - endFuel;
  const fuelDiff = fuelUsedNorm - fuelUsedActual;

  const updateTripMutation = useMutation({
    mutationFn: async (data) => {
      const distance = data.endOdometer - data.startOdometer;
      const fuelConsumption = vehicle?.fuelConsumption || 7.5;
      const fuelUsedNorm = (distance / 100) * fuelConsumption;
      const fuelUsedActual = (data.startFuel || 0) + data.fuelAdded - data.endFuel;
      const fuelDiff = fuelUsedNorm - fuelUsedActual;
      const fuelSavings = fuelDiff > 0 ? fuelDiff : 0;
      const fuelOveruse = fuelDiff < 0 ? Math.abs(fuelDiff) : 0;

      let workHours = 0, workMinutes = 0;
      if (data.departureTime && data.returnTime) {
        const [dh, dm] = data.departureTime.split(':').map(Number);
        const [rh, rm] = data.returnTime.split(':').map(Number);
        let totalMin = (rh * 60 + rm) - (dh * 60 + dm);
        if (totalMin < 0) totalMin += 24 * 60;
        workHours = Math.floor(totalMin / 60);
        workMinutes = totalMin % 60;
      }

      let startDate = null;
      if (data.departureDate && data.departureTime) {
        startDate = new Date(`${data.departureDate}T${data.departureTime}:00`).toISOString();
      }
      let endDate = null;
      if (data.returnDate && data.returnTime) {
        endDate = new Date(`${data.returnDate}T${data.returnTime}:00`).toISOString();
      }

      const updatedTrip = {
        ...trip,
        startDate: startDate || trip.startDate || trip.startTime,
        startTime: startDate || trip.startTime || trip.startDate,
        endDate: endDate || trip.endDate,
        orderedBy: data.orderedBy,
        purpose: data.purpose,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        startOdometer: data.startOdometer,
        startFuel: data.startFuel,
        endOdometer: data.endOdometer,
        endFuel: data.endFuel,
        fuelAdded: data.fuelAdded,
        fuelReceiptNumber: data.fuelReceiptNumber,
        fuelStation: data.fuelStation,
        fuelCost: data.fuelCost,
        notes: data.notes || trip.notes,
        distance,
        fuelUsedNorm,
        fuelUsedActual,
        fuelSavings,
        fuelOveruse,
        workHours,
        workMinutes,
        status: 'completed',
        driverResultsSignature: driver?.name,
        resultsCalculatedBy: 'System',
        resultsControlSignature: data.orderedBy,
        arrivalSignature: data.orderedBy,
      };

      await api.updateTrip(Number(trip.id), updatedTrip);

      if (vehicle) {
        await api.updateVehicle(Number(vehicle.id), {
          mileage: data.endOdometer,
          fuelLevel: data.endFuel,
          status: 'available',
        });
      }

      if (data.fuelAdded > 0 && !trip.fuelAdded) {
        await api.createRefuel({
          vehicleId: Number(trip.vehicleId),
          date: data.returnDate || new Date().toISOString().split('T')[0],
          liters: data.fuelAdded,
          cost: data.fuelCost || 0,
          mileage: data.endOdometer,
          invoiceNumber: data.fuelReceiptNumber || '',
          notes: data.fuelStation ? `Stacja: ${data.fuelStation}` : '',
          fullTank: false,
          tripId: Number(trip.id),
        });
      }
      
      return updatedTrip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['refuels'] });
      setIsEditing(false);
      setShowEndForm(false);
    },
    onError: (error) => {
      console.error('Błąd mutacji:', error);
      alert('Błąd podczas zapisu: ' + (error.message || 'Nieznany błąd'));
    },
  });

  const handleEndTrip = async () => {
    try {
      if (endOdometer <= startOdometer) {
        alert('Nowy stan licznika musi być większy niż początkowy!');
        return;
      }
      if (endFuel < 0) {
        alert('Stan paliwa końcowy nie może być ujemny.');
        return;
      }
      await updateTripMutation.mutateAsync({
        departureDate,
        departureTime,
        orderedBy,
        purpose,
        startLocation,
        endLocation,
        startOdometer,
        startFuel,
        endOdometer,
        endFuel,
        fuelAdded,
        fuelReceiptNumber,
        fuelStation,
        fuelCost,
        returnDate,
        returnTime,
      });
    } catch (error) {
      console.error('Błąd zapisu trasy:', error);
    }
  };

  // ============================================================================
  // 🔧 FUNKCJA GENEROWANIA POJEDYNCZEGO PDF (Z onclone)
  // ============================================================================
  const generateSinglePdf = async (docType, fmt) => {
    setIsGeneratingPdf(true);
    setPdfFormat(fmt);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      
      const element = docType === 'karta' ? kartaRef.current : polecenieRef.current;
      
      if (!element) { 
        alert('Nie znaleziono dokumentu'); 
        setIsGeneratingPdf(false);
        return; 
      }
      
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('karta-drogowa-print') || 
                                clonedDoc.getElementById('polecenie-wyjazdu-print');
          if (clonedElement) {
            const cells = clonedElement.querySelectorAll('td, th');
            cells.forEach(cell => {
              cell.style.paddingTop = '5px';
              cell.style.paddingBottom = '8px';
              cell.style.verticalAlign = 'middle';
              cell.style.lineHeight = '1.5';
            });
          }
        }
      });
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas ma zerowe wymiary');
      }
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: fmt });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pw;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = 0;
      if (imgHeight < ph) {
        yPosition = (ph - imgHeight) / 2;
      }

      yPosition = Math.max(0, yPosition - 12);

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, yPosition, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`${docType === 'karta' ? 'karta_drogowa' : 'polecenie_wyjazdu'}_${trip?.tripNumber || String(trip?.id).slice(-5) || 'dokument'}_${fmt}.pdf`);
    } catch (err) {
      console.error('Błąd generowania PDF:', err);
      alert('Błąd generowania PDF. Spróbuj ponownie.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ============================================================================
  // 🔧 FUNKCJA GENEROWANIA OBU PDF (Z onclone)
  // ============================================================================
  const generateBothPdf = async (fmt) => {
    setIsGeneratingPdf(true);
    setPdfFormat(fmt);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      
      const kartaElement = kartaRef.current;
      const polecenieElement = polecenieRef.current;
      
      if (!kartaElement || !polecenieElement) { 
        alert('Nie znaleziono dokumentów'); 
        setIsGeneratingPdf(false);
        return; 
      }
      
      const canvases = await Promise.all([
        html2canvas(kartaElement, { 
          scale: 3, 
          useCORS: true, 
          backgroundColor: '#ffffff', 
          logging: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById('karta-drogowa-print');
            if (clonedElement) {
              const cells = clonedElement.querySelectorAll('td, th');
              cells.forEach(cell => {
                cell.style.paddingTop = '5px';
                cell.style.paddingBottom = '8px';
                cell.style.verticalAlign = 'middle';
                cell.style.lineHeight = '1.5';
              });
            }
          }
        }),
        html2canvas(polecenieElement, { 
          scale: 3, 
          useCORS: true, 
          backgroundColor: '#ffffff', 
          logging: false,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.getElementById('polecenie-wyjazdu-print');
            if (clonedElement) {
              const cells = clonedElement.querySelectorAll('td, th');
              cells.forEach(cell => {
                cell.style.paddingTop = '5px';
                cell.style.paddingBottom = '8px';
                cell.style.verticalAlign = 'middle';
                cell.style.lineHeight = '1.5';
              });
            }
          }
        })
      ]);
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: fmt });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      
      const addPage = (canvas, addNew) => {
        if (addNew) pdf.addPage();
        
        if (canvas.width === 0 || canvas.height === 0) {
          console.warn('Canvas ma zerowe wymiary, pomijam');
          return;
        }
        
        const imgWidth = pw;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let yPosition = 0;
        if (imgHeight < ph) {
          yPosition = (ph - imgHeight) / 2;
        }

        yPosition = Math.max(0, yPosition - 12);
        
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, yPosition, imgWidth, imgHeight, undefined, 'FAST');
      };
      
      addPage(canvases[0], false);
      if (canvases[1] && canvases[1].width > 0 && canvases[1].height > 0) {
        addPage(canvases[1], true);
      }
      
      pdf.save(`cala_karta_${trip?.tripNumber || String(trip?.id).slice(-5) || 'dokument'}_${fmt}.pdf`);
    } catch (err) {
      console.error('Błąd generowania PDF:', err);
      alert('Błąd generowania PDF. Spróbuj ponownie.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (tripsLoading) {
    return <div className="p-8 text-center">Ładowanie danych...</div>;
  }

  if (!tripId || !trip || !vehicle || !driver) {
    return (
      <div className="p-8 text-center">
        <div className="glass-card p-12 max-w-2xl mx-auto">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Nie znaleziono przejazdu</h3>
          <p className="text-gray-600 mb-6">Przejazd o podanym ID nie istnieje lub został usunięty.</p>
          <Link to={createPageUrl('Trips')} className="btn-modern">Wróć do listy przejazdów</Link>
        </div>
      </div>
    );
  }

  const fuelConsumption = vehicle?.fuelConsumption || 7.5;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Nagłówek */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">
            Karta drogowa {trip.tripNumber || `#${String(trip.id).slice(-5)}`}
          </h2>
          <p className="text-slate-400 mt-1">Szczegóły przejazdu</p>
        </div>
        <Link
          to={createPageUrl('Trips')}
          className="px-5 py-2 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-colors flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Wróć
        </Link>
      </div>

      {/* Zakładki */}
      <div className="flex bg-slate-800 rounded-lg p-1 max-w-md">
        {[
          { key: 'karta', label: 'Karta drogowa' },
          { key: 'polecenie', label: 'Polecenie wyjazdu' },
          { key: 'cala', label: 'Cała karta' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Główna zawartość */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel boczny */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-400" />
              {activeTab === 'karta' && 'Karta drogowa'}
              {activeTab === 'polecenie' && 'Polecenie wyjazdu'}
              {activeTab === 'cala' && 'Cała karta (dwa dokumenty)'}
            </h3>

            {activeTab !== 'cala' ? (
              <div className="space-y-3">
                <button
                  onClick={() => generateSinglePdf(activeTab, 'A4')}
                  disabled={isGeneratingPdf}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGeneratingPdf && pdfFormat === 'A4' ? 'Generowanie...' : 'Pobierz PDF (A4)'}
                </button>
                <button
                  onClick={() => generateSinglePdf(activeTab, 'A5')}
                  disabled={isGeneratingPdf}
                  className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGeneratingPdf && pdfFormat === 'A5' ? 'Generowanie...' : 'Pobierz PDF (A5)'}
                </button>
                
                <button
                  onClick={handlePrint}
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Drukuj dokument
                </button>
                
                <p className="text-xs text-slate-500 mt-2">Pojedynczy dokument do druku.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => generateBothPdf('A4')}
                  disabled={isGeneratingPdf}
                  className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGeneratingPdf && pdfFormat === 'A4' ? 'Generowanie...' : 'Pobierz oba dokumenty PDF (A4)'}
                </button>
                <button
                  onClick={() => generateBothPdf('A5')}
                  disabled={isGeneratingPdf}
                  className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isGeneratingPdf && pdfFormat === 'A5' ? 'Generowanie...' : 'Pobierz oba dokumenty PDF (A5)'}
                </button>
                
                <button
                  onClick={handlePrint}
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Drukuj oba dokumenty
                </button>
                
                <p className="text-xs text-slate-500 mt-2">Dwa dokumenty w jednym pliku PDF.</p>
              </div>
            )}
          </div>

          {/* Panel z danymi i formularzami */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            {trip.status === 'in_progress' && !showEndForm && (
              <div className="mb-6">
                <button
                  onClick={() => setShowEndForm(true)}
                  className="w-full py-4 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-3 text-lg shadow-lg"
                >
                  <StopCircle className="w-6 h-6" />
                  Zakończ przejazd
                </button>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Kliknij, aby wprowadzić dane końcowe i wygenerować kartę drogową
                </p>
              </div>
            )}

            {trip.status === 'in_progress' && showEndForm && (
              <div className="mb-6 border border-emerald-500/30 rounded-xl p-4 bg-emerald-500/5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <StopCircle className="w-5 h-5 text-emerald-400" />
                  Zakończ przejazd
                </h3>
                {/* 🔧 POPRAWA: max-h-[400px] → max-h-[60vh] */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="bg-slate-800/50 rounded-lg p-3 mb-2">
                    <p className="text-slate-400 text-sm">Dane rozpoczęcia (zapamiętane):</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <span className="text-slate-500 text-xs">Przebieg początkowy:</span>
                        <div className="text-white font-bold text-lg">{startOdometer} km</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs">Stan paliwa początkowy:</span>
                        <div className="text-white font-bold text-lg">{startFuel.toFixed(2)} L</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nowy stan licznika (km) *</label>
                    <input
                      type="number"
                      value={endOdometer}
                      onChange={(e) => {
                        const newEndOdometer = Number(e.target.value);
                        setEndOdometer(newEndOdometer);
                        const newDistance = newEndOdometer - startOdometer;
                        const fuelConsumption = vehicle?.fuelConsumption || 7.5;
                        const fuelUsedNorm = newDistance > 0 ? (newDistance / 100) * fuelConsumption : 0;
                        const autoEndFuel = Math.max(0, startFuel + fuelAdded - fuelUsedNorm);
                        setEndFuel(autoEndFuel);
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg"
                      min={startOdometer + 1}
                      required
                    />
                  </div>

                  {endOdometer > startOdometer && (
                    <div className="bg-emerald-500/20 rounded-lg p-3">
                      <p className="text-emerald-300 text-sm font-semibold mb-2">Przejechany dystans:</p>
                      <div className="text-white text-2xl font-bold">{endOdometer - startOdometer} km</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Dolano paliwa (L) - opcjonalnie</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fuelAdded}
                      onChange={(e) => {
                        const newFuelAdded = Number(e.target.value);
                        setFuelAdded(newFuelAdded);
                        const newDistance = endOdometer - startOdometer;
                        const fuelConsumption = vehicle?.fuelConsumption || 7.5;
                        const fuelUsedNorm = newDistance > 0 ? (newDistance / 100) * fuelConsumption : 0;
                        const autoEndFuel = Math.max(0, startFuel + newFuelAdded - fuelUsedNorm);
                        setEndFuel(autoEndFuel);
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>

                  {endOdometer > startOdometer && (
                    <div className="bg-indigo-900/30 rounded-lg p-3">
                      <p className="text-indigo-300 text-sm font-semibold mb-2">Automatyczne wyliczenia:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">Norma spalania:</span>
                          <span className="text-cyan-400 font-bold ml-2">{vehicle?.fuelConsumption || 7.5} L/100km</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Zużycie wg normy:</span>
                          <span className="text-orange-400 font-bold ml-2">{(((endOdometer - startOdometer) / 100) * (vehicle?.fuelConsumption || 7.5)).toFixed(2)} L</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400">AUTOMATYCZNY NOWY STAN PALIWA:</span>
                          <span className="text-green-400 font-bold ml-2 text-lg">{endFuel.toFixed(2)} L</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Gdzie zatankowano</label>
                    <input
                      type="text"
                      value={fuelStation}
                      onChange={(e) => setFuelStation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      placeholder="np. Orlen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nr kwitu</label>
                    <input
                      type="text"
                      value={fuelReceiptNumber}
                      onChange={(e) => setFuelReceiptNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Koszt tankowania (zł)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fuelCost}
                      onChange={(e) => setFuelCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Data powrotu</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Godzina powrotu</label>
                    <input
                      type="time"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowEndForm(false)}
                      className="flex-1 py-2 px-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
                    >
                      Anuluj
                    </button>
                    <button
                      onClick={handleEndTrip}
                      disabled={updateTripMutation.isPending}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                    >
                      {updateTripMutation.isPending ? 'Zapisywanie...' : 'Zakończ'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {trip.status === 'completed' && !isEditing && (
              <div className="mb-6">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 text-lg shadow-lg"
                >
                  <Edit className="w-6 h-6" />
                  Edytuj przejazd
                </button>
              </div>
            )}

            {!isEditing && trip.status !== 'in_progress' ? (
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Pojazd', value: `${vehicle.make} ${vehicle.model}` },
                  { label: 'Nr rejestracyjny', value: vehicle.registrationNumber },
                  { label: 'Kierowca', value: driver.name },
                  { label: 'Data wyjazdu', value: departureDate },
                  { label: 'Godzina wyjazdu', value: departureTime },
                  { label: 'Zlecił', value: orderedBy },
                  { label: 'Cel', value: purpose },
                  { label: 'Trasa', value: `${startLocation || '?'} → ${endLocation || '?'}` },
                  { label: 'Przebieg początkowy', value: `${startOdometer.toLocaleString('pl-PL')} km` },
                  { label: 'Paliwo na start', value: `${startFuel.toFixed(2)} L` },
                  { label: 'Norma zużycia', value: `${fuelConsumption} L/100km` },
                  { label: 'Przebieg końcowy', value: `${endOdometer.toLocaleString('pl-PL')} km` },
                  { label: 'Paliwo końcowe', value: `${endFuel.toFixed(2)} L` },
                  { label: 'Pobrane paliwo', value: `${fuelAdded.toFixed(2)} L` },
                  { label: 'Data powrotu', value: returnDate },
                  { label: 'Godzina powrotu', value: returnTime },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center p-2 bg-slate-700/40 rounded-lg">
                    <span className="text-slate-400">{row.label}:</span>
                    <span className="font-semibold text-white">{row.value || '-'}</span>
                  </div>
                ))}
              </div>
            ) : isEditing ? (
              /* 🔧 POPRAWA: max-h-[500px] → max-h-[60vh] */
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <h4 className="font-semibold text-white border-b border-slate-600 pb-1">Dane wyjazdu</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Data wyjazdu</label>
                  <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Godzina wyjazdu</label>
                  <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Zlecił</label>
                  <input type="text" value={orderedBy} onChange={(e) => setOrderedBy(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Cel podróży</label>
                  <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Skąd</label>
                  <input type="text" value={startLocation} onChange={(e) => setStartLocation(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Dokąd</label>
                  <input type="text" value={endLocation} onChange={(e) => setEndLocation(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Przebieg początkowy (km)</label>
                  <input type="number" value={startOdometer} onChange={(e) => setStartOdometer(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Paliwo na start (L)</label>
                  <input type="number" step="0.1" value={startFuel} onChange={(e) => setStartFuel(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <h4 className="font-semibold text-white border-b border-slate-600 pb-1 mt-4">Dane powrotu</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Przebieg końcowy (km)</label>
                  <input type="number" value={endOdometer} onChange={(e) => setEndOdometer(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Paliwo końcowe (L)</label>
                  <input type="number" step="0.1" value={endFuel} onChange={(e) => setEndFuel(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Pobrane paliwo (L)</label>
                  <input type="number" step="0.1" value={fuelAdded} onChange={(e) => setFuelAdded(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Gdzie zatankowano</label>
                  <input type="text" value={fuelStation} onChange={(e) => setFuelStation(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nr kwitu</label>
                  <input type="text" value={fuelReceiptNumber} onChange={(e) => setFuelReceiptNumber(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Koszt tankowania (zł)</label>
                  <input type="number" step="0.01" value={fuelCost} onChange={(e) => setFuelCost(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Data powrotu</label>
                  <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Godzina powrotu</label>
                  <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 px-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleEndTrip}
                    disabled={updateTripMutation.isPending}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                  >
                    {updateTripMutation.isPending ? 'Zapisywanie...' : 'Zapisz zmiany'}
                  </button>
                </div>
              </div>
            ) : null}

            {trip.status === 'completed' && !isEditing && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-lg font-semibold mb-4 text-white">Wyniki przejazdu</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-emerald-500/10 rounded-lg">
                    <span className="text-slate-400">Dystans:</span>
                    <span className="font-semibold text-emerald-400">{trip.distance || 0} km</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-500/10 rounded-lg">
                    <span className="text-slate-400">Zużycie wg normy:</span>
                    <span className="font-semibold text-blue-400">{(trip.fuelUsedNorm || 0).toFixed(2)} L</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-amber-500/10 rounded-lg">
                    <span className="text-slate-400">Zużycie rzeczywiste:</span>
                    <span className="font-semibold text-amber-400">{(trip.fuelUsedActual || 0).toFixed(2)} L</span>
                  </div>
                  {(trip.fuelSavings || 0) > 0 && (
                    <div className="flex justify-between items-center p-2 bg-emerald-500/10 rounded-lg">
                      <span className="text-slate-400">Oszczędność:</span>
                      <span className="font-semibold text-emerald-400">{trip.fuelSavings.toFixed(2)} L</span>
                    </div>
                  )}
                  {(trip.fuelOveruse || 0) > 0 && (
                    <div className="flex justify-between items-center p-2 bg-red-500/10 rounded-lg">
                      <span className="text-slate-400">Przekroczenie:</span>
                      <span className="font-semibold text-red-400">{trip.fuelOveruse.toFixed(2)} L</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Podgląd dokumentu */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Podgląd: {activeTab === 'karta' && 'Karta drogowa'}
              {activeTab === 'polecenie' && 'Polecenie wyjazdu służbowego'}
              {activeTab === 'cala' && 'Karta drogowa + Polecenie wyjazdu'}
            </h3>
            <div className="overflow-auto bg-white border border-slate-600 rounded-lg" style={{ maxHeight: '80vh' }}>
              {activeTab === 'karta' && (
                <KartaDrogowa
                  ref={kartaRef}
                  trip={{
                    ...trip,
                    departureDate,
                    departureTime,
                    orderedBy,
                    purpose,
                    startLocation,
                    endLocation,
                    startOdometer,
                    startFuel,
                    endOdometer,
                    endFuel,
                    fuelAdded,
                    fuelReceiptNumber,
                    fuelStation,
                    fuelCost,
                    returnDate,
                    returnTime,
                  }}
                  vehicle={vehicle}
                  driver={driver}
                  company={settings}
                  endMileage={endOdometer}
                  endFuel={endFuel}
                  fuelAdded={fuelAdded}
                  format={pdfFormat}
                />
              )}
              {activeTab === 'polecenie' && (
                <PolecenieWyjazdu
                  ref={polecenieRef}
                  trip={{
                    ...trip,
                    departureDate,
                    departureTime,
                    orderedBy,
                    purpose,
                    startLocation,
                    endLocation,
                    startOdometer,
                    startFuel,
                    endOdometer,
                    endFuel,
                    fuelAdded,
                    fuelReceiptNumber,
                    fuelStation,
                    fuelCost,
                    returnDate,
                    returnTime,
                  }}
                  vehicle={vehicle}
                  driver={driver}
                  company={settings}
                  format={pdfFormat}
                />
              )}
              {activeTab === 'cala' && (
                <div>
                  <div className="mb-8 pb-4 border-b border-gray-300">
                    <KartaDrogowa
                      ref={kartaRef}
                      trip={{
                        ...trip,
                        departureDate,
                        departureTime,
                        orderedBy,
                        purpose,
                        startLocation,
                        endLocation,
                        startOdometer,
                        startFuel,
                        endOdometer,
                        endFuel,
                        fuelAdded,
                        fuelReceiptNumber,
                        fuelStation,
                        fuelCost,
                        returnDate,
                        returnTime,
                      }}
                      vehicle={vehicle}
                      driver={driver}
                      company={settings}
                      endMileage={endOdometer}
                      endFuel={endFuel}
                      fuelAdded={fuelAdded}
                      format={pdfFormat}
                    />
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <PolecenieWyjazdu
                      ref={polecenieRef}
                      trip={{
                        ...trip,
                        departureDate,
                        departureTime,
                        orderedBy,
                        purpose,
                        startLocation,
                        endLocation,
                        startOdometer,
                        startFuel,
                        endOdometer,
                        endFuel,
                        fuelAdded,
                        fuelReceiptNumber,
                        fuelStation,
                        fuelCost,
                        returnDate,
                        returnTime,
                      }}
                      vehicle={vehicle}
                      driver={driver}
                      company={settings}
                      format={pdfFormat}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}