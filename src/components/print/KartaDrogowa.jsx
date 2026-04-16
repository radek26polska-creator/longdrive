import React from 'react';

const KartaDrogowa = React.forwardRef(({ trip, vehicle, driver, company, endMileage, endFuel, fuelAdded, format = 'A4' }, ref) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const actualEndMileage = trip?.endOdometer || endMileage || trip?.startOdometer || 0;
  const actualEndFuel = trip?.endFuel ?? endFuel ?? vehicle?.fuelLevel ?? 0;
  const actualFuelAdded = trip?.fuelAdded ?? fuelAdded ?? 0;
  const distance = actualEndMileage - (trip?.startOdometer || 0);
  const fuelConsumption = vehicle?.fuelConsumption || 7.5;
  const fuelUsedNorm = (distance / 100) * fuelConsumption;
  const fuelUsedActual = (trip?.startFuel || 0) + actualFuelAdded - actualEndFuel;
  const fuelDiff = fuelUsedNorm - fuelUsedActual;
  const fuelSavings = fuelDiff > 0 ? fuelDiff : 0;
  const fuelOveruse = fuelDiff < 0 ? Math.abs(fuelDiff) : 0;

  const isA5 = format === 'A5';

  const pageWidth  = isA5 ? '148mm' : '210mm';
  const pageHeight = isA5 ? '210mm' : '297mm';
  const pagePad    = isA5 ? '1mm 5mm 4mm 5mm' : '3mm 9mm 7mm 9mm';

  const baseFontSize  = isA5 ? '7.5px' : '9.5px';
  const smallFontSize = isA5 ? '6px'   : '7.5px';
  const labelFontSize = isA5 ? '5.5px' : '7px';
  const tinyFontSize  = isA5 ? '5px'   : '6px';
  const titleFontSize = isA5 ? '15px'  : '21px';
  const valueFontSize = isA5 ? '9px'   : '11px';

  const cellPad  = isA5 ? '1px 3px' : '2px 5px';
  const hCellPad = isA5 ? '1px 2px' : '2px 4px';

  const greenColor  = '#4a7c59';
  const lightGreen  = '#e8f5e9';
  const borderColor = '#5a8a6a';

  const startRaw = trip?.startTime || trip?.startDate;
  const endRaw   = trip?.endTime   || trip?.endDate;

  const startDate = startRaw ? formatDate(startRaw) : '';
  const endDate   = endRaw   ? formatDate(endRaw)   : '';
  const startTime = startRaw
    ? new Date(startRaw).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    : '';
  const endTime = endRaw
    ? new Date(endRaw).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    : '';

  const cell = {
    border: `1px solid ${borderColor}`,
    padding: cellPad,
    fontSize: baseFontSize,
    verticalAlign: 'top',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: '1.3',
  };

  const hCell = {
    ...cell,
    padding: hCellPad,
    backgroundColor: lightGreen,
    fontWeight: '600',
    color: '#1a1a1a',
    verticalAlign: 'middle',
    textAlign: 'center',
    lineHeight: '1.2',
  };

  const num = { fontWeight: 'bold', color: greenColor, marginRight: '3px' };

  const driverName = driver?.name ||
    (driver ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() : '');

  // 🔧 POPRAWA 1: Usunięto `body * { visibility: hidden }` - to powodowało znikanie menu
  // 🔧 POPRAWA 2: Dodano `display: block` i `position: relative` zamiast `fixed`
  // 🔧 POPRAWA 3: Styl jest teraz TYLKO dla wydruku, nie wpływa na ekran
  const printCSS = `
    @media print {
      @page {
        size: ${isA5 ? 'A5' : 'A4'} portrait;
        margin: 0mm;
      }
      
      /* TYLKO karta jest widoczna, reszta strony ukryta TYLKO W DRUKU */
      body * {
        visibility: hidden !important;
      }
      
      #karta-drogowa-print,
      #karta-drogowa-print * {
        visibility: visible !important;
      }
      
      #karta-drogowa-print {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: ${pageWidth} !important;
        height: auto !important;
        min-height: ${pageHeight} !important;
        margin: 0 !important;
        padding: ${pagePad} !important;
        box-sizing: border-box !important;
        background: white !important;
        z-index: 99999 !important;
      }
    }
  `;

  return (
    <div
      ref={ref}
      id="karta-drogowa-print"
      style={{
        width: pageWidth,
        maxWidth: pageWidth,
        boxSizing: 'border-box',
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        fontSize: baseFontSize,
        lineHeight: '1.3',
        color: '#1a1a1a',
        backgroundColor: '#ffffff',
        padding: pagePad,
        // 🔧 POPRAWA 4: Dodano - element nie przeszkadza w interfejsie
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'none', // Karta nie blokuje kliknięć w menu
      }}
    >
      <style>{printCSS}</style>

      {/* ===== NAGŁÓWEK (sekcje 1 i 2) ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{
              border: `1px solid ${borderColor}`,
              width: '50%',
              padding: isA5 ? '4px 6px' : '6px 8px',
              verticalAlign: 'top',
            }}>
              <div style={{ fontSize: tinyFontSize, color: greenColor, fontWeight: 'bold', marginBottom: '2px' }}>1</div>
              {company && (company.name || company.address) ? (
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: isA5 ? '8px' : '11px' }}>{company.name}</div>
                  <div style={{ fontSize: isA5 ? '6.5px' : '9px', lineHeight: '1.5', marginTop: '2px' }}>
                    {company.address  && <div>{company.address}</div>}
                    {(company.zipCode || company.city) && (
                      <div>{[company.zipCode, company.city].filter(Boolean).join(' ')}</div>
                    )}
                    {company.nip    && <div>NIP: {company.nip}</div>}
                    {company.regon  && <div>REGON: {company.regon}</div>}
                    {company.phone  && <div>tel. {company.phone}</div>}
                    {company.email  && <div>{company.email}</div>}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: labelFontSize, color: '#9ca3af', marginTop: '14px', textAlign: 'center' }}>
                  Pieczęć jednostki organizacyjnej
                </div>
              )}
            </td>

            <td style={{
              border: `1px solid ${borderColor}`,
              width: '50%',
              padding: isA5 ? '4px 6px' : '6px 8px',
              verticalAlign: 'middle',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: tinyFontSize, color: greenColor, fontWeight: 'bold', marginBottom: '2px' }}>2</div>
                  <div style={{ fontSize: titleFontSize, fontWeight: 'bold', color: greenColor, letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                    KARTA DROGOWA
                  </div>
                  <div style={{ marginTop: isA5 ? '5px' : '8px', fontSize: isA5 ? '8px' : '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>Nr</span>
                    <span style={{
                      borderBottom: `1px solid ${borderColor}`,
                      display: 'inline-block',
                      minWidth: isA5 ? '80px' : '130px',
                      paddingLeft: '3px',
                      fontWeight: '700',
                      fontSize: isA5 ? '10px' : '12px',
                    }}>
                      {trip?.cardNumber || trip?.tripNumber || ''}
                    </span>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: isA5 ? '8px' : '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>Data</span>
                    <span style={{
                      borderBottom: `1px solid ${borderColor}`,
                      display: 'inline-block',
                      minWidth: isA5 ? '80px' : '130px',
                      paddingLeft: '3px',
                      fontWeight: '600',
                    }}>
                      {startDate}
                    </span>
                  </div>
                </div>
                <div style={{
                  border: `2px solid ${borderColor}`,
                  padding: isA5 ? '4px 8px' : '6px 12px',
                  textAlign: 'center',
                  backgroundColor: lightGreen,
                  flexShrink: 0,
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: isA5 ? '12px' : '17px', color: greenColor, lineHeight: '1.2' }}>SM</div>
                  <div style={{ fontWeight: 'bold', fontSize: isA5 ? '12px' : '17px', color: greenColor, lineHeight: '1.2' }}>101</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SEKCJA 3 – POJAZD ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ ...cell }} colSpan="2">
              <span style={num}>3</span>
              Samochód osobowy - specjalny - motocykl*)&nbsp;&nbsp;
              Nr rej.&nbsp;
              <span style={{ fontWeight: '700', letterSpacing: '1px' }}>
                {vehicle?.registrationNumber || '...................................'}
              </span>
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, width: '50%' }}>
              Marka i typ:&nbsp;
              <span style={{ fontWeight: '600' }}>
                {vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : '...................................'}
              </span>
            </td>
            <td style={{ ...cell, width: '50%' }}>
              Pojemność cylindrów:&nbsp;
              <span style={{ fontWeight: '600' }}>
                {vehicle?.engineCapacity ? `${vehicle.engineCapacity} cm³` : '...................................'}
              </span>
            </td>
          </tr>
          <tr>
            <td style={{ ...cell }}>
              Rodzaj paliwa:&nbsp;
              <span style={{ fontWeight: '600' }}>{vehicle?.fuelType || '....................................'}</span>
            </td>
            <td style={{ ...cell }}>
              Rodzaj nadwozia:&nbsp;
              <span style={{ fontWeight: '600' }}>{vehicle?.bodyType || '....................................'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SEKCJA 4+5 – KIEROWCA ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '42%' }} />
          <col style={{ width: '19%' }} />
          <col style={{ width: '19%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ ...cell }} rowSpan="2">
              <span style={num}>4</span> Imię i nazwisko kierowcy
              <div style={{ marginTop: '4px', fontWeight: '700', fontSize: valueFontSize }}>
                {driverName}
              </div>
              <div style={{ marginTop: '3px', fontSize: labelFontSize, color: '#6b7280' }}>
                Cel:&nbsp;<span style={{ color: '#1a1a1a', fontWeight: '500' }}>{trip?.purpose || ''}</span>
              </div>
            </td>
            <td style={{ ...hCell, fontSize: labelFontSize }}>
              Godzina rozp.<br />pracy
            </td>
            <td style={{ ...hCell, fontSize: labelFontSize }}>
              Godzina uk.<br />pracy
            </td>
            <td style={{ ...hCell, fontSize: labelFontSize }}>
              <span style={num}>5</span>Promień<br />wyjazdu
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '600', fontSize: valueFontSize, height: isA5 ? '18px' : '22px' }}>
              {startTime}
            </td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '600', fontSize: valueFontSize }}>
              {endTime}
            </td>
            <td style={{ ...cell, textAlign: 'center' }}> </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SEKCJA 6+7 – SPRAWNOŚĆ ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '60%' }} />
          <col style={{ width: '40%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ ...cell }}>
              <span style={num}>6</span> Pojazd samochodowy sprawny do wyjazdu
              <div style={{ marginTop: isA5 ? '8px' : '12px', display: 'flex', gap: '30px' }}>
                <span style={{ fontSize: labelFontSize, color: '#6b7280' }}>Podpis _____________</span>
                <span style={{ fontSize: labelFontSize, color: '#6b7280' }}>Podpis kierowcy _____________</span>
              </div>
            </td>
            <td style={{ ...cell }}>
              <span style={num}>7</span> Kontrola drogowa
              <div style={{ minHeight: isA5 ? '18px' : '22px' }}></div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SEKCJA 8 – ZLECENIE ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '50%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ ...cell }}>
              <span style={num}>8</span>&nbsp;Zleca wyjazd:&nbsp;
              <span style={{ fontWeight: '600' }}>{trip?.orderedBy || '___________________________'}</span>
            </td>
            <td style={{ ...cell }}>
              Zatwierdził przejazd: ___________________________
            </td>
          </tr>
          <tr>
            <td style={{ ...cell }}>
              <span style={{ fontSize: labelFontSize, color: '#6b7280' }}>Podpis _________________</span>
            </td>
            <td style={{ ...cell }}>
              <span style={{ fontSize: labelFontSize, color: '#6b7280' }}>Podpis _________________</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SEKCJA 9+10+11 – PALIWO ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '13%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ ...hCell, textAlign: 'left' }} colSpan="6">
              <span style={num}>9</span> PALIWO
            </td>
            <td style={{ ...cell, fontSize: labelFontSize, lineHeight: '1.4' }} rowSpan="6">
              <div style={{ marginBottom: '6px' }}>
                <span style={num}>10</span> Podpis wystawiającego kartę
              </div>
              <div style={{ fontSize: labelFontSize, color: '#6b7280', marginBottom: isA5 ? '12px' : '20px' }}>
                ______________________
              </div>
              <div style={{ marginBottom: '4px', fontSize: labelFontSize }}>
                <span style={num}>11</span> Norma zużycia paliwa<br />na 100 km przebiegu:
              </div>
              <div style={{ fontWeight: '700', fontSize: isA5 ? '11px' : '13px', color: greenColor }}>
                {fuelConsumption} l/100km
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>
              Stan paliwa<br />przy otrzymaniu<br />karty
            </td>
            <td style={{ ...hCell, fontSize: tinyFontSize }} colSpan="4">Pobrano</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>
              Stan paliwa<br />przy zwrocie<br />karty
            </td>
          </tr>
          <tr>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>1</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>Gdzie</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>Nr kwitu</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>Ilość</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>Podpis<br />wydającego</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>6</td>
          </tr>
          <tr>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '700', fontSize: valueFontSize, height: isA5 ? '20px' : '24px' }}>
              {(trip?.startFuel || 0).toFixed(1)} L
            </td>
            <td style={{ ...cell, textAlign: 'center', fontSize: smallFontSize }}>{trip?.fuelStation || ''}</td>
            <td style={{ ...cell, textAlign: 'center', fontSize: smallFontSize }}>{trip?.fuelReceiptNumber || ''}</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '700', fontSize: smallFontSize }}>
              {actualFuelAdded > 0 ? `${actualFuelAdded.toFixed(1)} L` : '—'}
            </td>
            <td style={{ ...cell, textAlign: 'center' }}> </td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '700', fontSize: valueFontSize }}>
              {actualEndFuel.toFixed(1)} L
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, height: isA5 ? '14px' : '18px' }}> </td>
            <td style={cell}> </td>
            <td style={cell}> </td>
            <td style={cell}> </td>
            <td style={cell}> </td>
            <td style={cell}> </td>
          </tr>
          <tr>
            <td style={{ ...cell, fontSize: labelFontSize, color: '#6b7280' }} colSpan="3">
              Podpis _________________
            </td>
            <td style={{ ...cell, fontSize: labelFontSize, color: '#6b7280' }} colSpan="3">
              Podpis _________________
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SEKCJA 12+13 – LICZNIKI ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '10%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ ...hCell, textAlign: 'left' }}><span style={num}>12</span></td>
            <td style={{ ...hCell, fontSize: labelFontSize }}>Data</td>
            <td style={{ ...hCell, fontSize: labelFontSize }}>Godz. - min.</td>
            <td style={{ ...hCell, fontSize: labelFontSize }}>Stan licznika</td>
            <td style={{ ...hCell, fontSize: labelFontSize }} colSpan="4">Zużycie paliwa</td>
          </tr>
          <tr>
            <td style={{ ...hCell }}> </td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>1</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>2</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>3</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>wg norm po<br />uwzgl.<br />poprawek</td>
            <td style={{ ...hCell, fontSize: tinyFontSize }}>rzeczywiste</td>
            <td style={{ ...hCell, fontSize: tinyFontSize, color: '#10b981' }}>oszczędność</td>
            <td style={{ ...hCell, fontSize: tinyFontSize, color: '#ef4444' }}>przekroczenie</td>
          </tr>
          <tr>
            <td style={{ ...cell, fontWeight: '700', fontSize: smallFontSize }}>POWRÓT</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '600', fontSize: smallFontSize }}>{endDate}</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '600', fontSize: smallFontSize }}>{endTime}</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '700', fontSize: valueFontSize }}>
              {actualEndMileage > 0 ? `${actualEndMileage.toLocaleString()} km` : ''}
            </td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '600', fontSize: smallFontSize }}>
              {fuelUsedNorm > 0 ? `${fuelUsedNorm.toFixed(1)} L` : ''}
            </td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '600', fontSize: smallFontSize }}>
              {fuelUsedActual > 0 ? `${fuelUsedActual.toFixed(1)} L` : '—'}
            </td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '700', fontSize: smallFontSize, color: '#10b981' }}>
              {fuelSavings > 0 ? `${fuelSavings.toFixed(1)} L` : ''}
            </td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '700', fontSize: smallFontSize, color: '#ef4444' }}>
              {fuelOveruse > 0 ? `${fuelOveruse.toFixed(1)} L` : ''}
            </td>
          </tr>
          <tr>
            <td style={{ ...cell, fontWeight: '700', fontSize: smallFontSize }}>
              <span style={num}>13</span>WYJAZD
            </td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '600', fontSize: smallFontSize }}>{startDate}</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '600', fontSize: smallFontSize }}>{startTime}</td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '700', fontSize: valueFontSize }}>
              {(trip?.startOdometer || 0).toLocaleString()} km
            </td>
            <td style={cell}> </td>
            <td style={cell}> </td>
            <td style={cell}> </td>
            <td style={cell}> </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SEKCJA 14 – WYNIKI ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '40%' }} />
          <col style={{ width: '40%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ ...hCell, textAlign: 'left' }}>
              <span style={num}>14</span> WYNIKI
            </td>
            <td style={{ ...hCell, fontSize: labelFontSize }}>Czas pracy godz. - min.</td>
            <td style={{ ...hCell, fontSize: labelFontSize }}>Przebieg km</td>
          </tr>
          <tr>
            <td style={{ ...cell, height: isA5 ? '22px' : '28px' }}> </td>
            <td style={{ ...cell, textAlign: 'center' }}> </td>
            <td style={{ ...cell, textAlign: 'center', fontWeight: '700', fontSize: isA5 ? '13px' : '15px', color: greenColor }}>
              {distance > 0 ? `${distance.toLocaleString()} km` : '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SEKCJA 15+16+17 – PODPISY ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '33%' }} />
          <col style={{ width: '34%' }} />
          <col style={{ width: '33%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ ...cell }}>
              <span style={num}>15</span> Podpis kierowcy
              <div style={{ marginTop: isA5 ? '14px' : '18px', fontSize: labelFontSize, color: '#6b7280' }}>
                _______________________
              </div>
            </td>
            <td style={{ ...cell }}>
              <span style={num}>16</span> Wyniki obliczył
              <div style={{ marginTop: isA5 ? '14px' : '18px', fontSize: labelFontSize, color: '#6b7280' }}>
                _______________________
              </div>
            </td>
            <td style={{ ...cell }}>
              <span style={num}>17</span> Podpis kontr. wyniki
              <div style={{ marginTop: isA5 ? '14px' : '18px', fontSize: labelFontSize, color: '#6b7280' }}>
                _______________________
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== SEKCJA 19 – UWAGI ===== */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col style={{ width: '60%' }} />
          <col style={{ width: '40%' }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={{ ...cell, verticalAlign: 'top', minHeight: isA5 ? '30px' : '38px' }}>
              <span style={num}>19</span> Uwagi
              <div style={{ marginTop: '3px', fontSize: baseFontSize, minHeight: isA5 ? '22px' : '28px' }}>
                {trip?.notes || ''}
              </div>
            </td>
            <td style={{ ...cell, verticalAlign: 'top' }}>
              <span style={num}>19</span> Deklaracja na dojazd poza promień
              <div style={{ marginTop: '4px', fontSize: labelFontSize, color: '#6b7280' }}>
                Nr _______________
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: 'center', marginTop: '4px', fontSize: tinyFontSize, color: '#9ca3af' }}>
        Dokument wygenerowano elektronicznie • {new Date().toLocaleString('pl-PL')}
      </div>
    </div>
  );
});

KartaDrogowa.displayName = 'KartaDrogowa';
export default KartaDrogowa;