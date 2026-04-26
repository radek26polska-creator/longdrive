import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook do automatycznego zapisywania draftu formularza w localStorage.
 *
 * Użycie:
 *   const { clearDraft, hasDraft } = useFormDraft('trip-form', values, setValues);
 *
 * @param {string} key - unikalny klucz w localStorage
 * @param {object} values - aktualne wartości formularza
 * @param {function} setValues - setter stanu formularza
 * @param {object} options
 *   @param {number} options.debounceMs - opóźnienie zapisu (domyślnie 800ms)
 *   @param {string[]} options.exclude - pola które nie mają być zapisywane
 *   @param {boolean} options.restoreOnMount - czy przywrócić draft przy montowaniu (domyślnie true)
 */
export function useFormDraft(key, values, setValues, options = {}) {
  const {
    debounceMs = 800,
    exclude = [],
    restoreOnMount = true,
  } = options;

  const storageKey = `draft_${key}`;
  const timerRef = useRef(null);
  const isRestoredRef = useRef(false);

  // Przywróć draft przy pierwszym załadowaniu
  useEffect(() => {
    if (!restoreOnMount || isRestoredRef.current) return;
    isRestoredRef.current = true;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft || typeof draft !== 'object') return;

      // Scal draft z aktualnymi wartościami (nie nadpisuj pól z exclude)
      const merged = { ...values };
      for (const [k, v] of Object.entries(draft)) {
        if (!exclude.includes(k) && v !== null && v !== undefined && v !== '') {
          merged[k] = v;
        }
      }
      setValues(merged);
    } catch (e) {
      // uszkodzony draft — usuń
      localStorage.removeItem(storageKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zapisuj draft z debouncingiem przy każdej zmianie
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        const toSave = { ...values };
        exclude.forEach(k => delete toSave[k]);
        // Dodaj timestamp
        toSave._draftSavedAt = new Date().toISOString();
        localStorage.setItem(storageKey, JSON.stringify(toSave));
      } catch (e) {
        // localStorage pełne lub niedostępne
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [values, storageKey, debounceMs, exclude]);

  // Wyczyść draft (np. po zapisaniu formularza)
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Sprawdź czy draft istnieje i kiedy był zapisany
  const getDraftInfo = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      return {
        exists: true,
        savedAt: draft._draftSavedAt ? new Date(draft._draftSavedAt) : null,
      };
    } catch {
      return null;
    }
  }, [storageKey]);

  const hasDraft = !!localStorage.getItem(storageKey);

  return { clearDraft, hasDraft, getDraftInfo };
}