const CompanySettings = require('../models/CompanySettings');

const companySettingsController = {
  async get(req, res) {
    try {
      const settings = await CompanySettings.get();
      console.log('📤 GET company-settings - zwracam:', settings);
      // Zwracamy obiekt, a nie tablicę
      res.json(settings);
    } catch (error) {
      console.error('❌ Błąd podczas pobierania ustawień firmy:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async update(req, res) {
    try {
      console.log('📝 Otrzymane dane do zapisu:', req.body);
      const updated = await CompanySettings.update(req.body);
      
      if (!updated) {
        console.log('⚠️ Nie udało się zaktualizować - brak danych');
        return res.status(404).json({ error: 'Nie można zaktualizować ustawień' });
      }
      
      console.log('✅ Zaktualizowane ustawienia:', updated);
      res.json(updated);
    } catch (error) {
      console.error('❌ Błąd podczas aktualizacji ustawień firmy:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  },

  async getNextCardNumber(req, res) {
    try {
      const cardNumber = await CompanySettings.getNextCardNumber();
      const settings = await CompanySettings.get();
      res.json({ 
        cardNumber,
        prefix: settings.cardPrefix,
        nextNumber: settings.cardCounter,
        fullNumber: cardNumber
      });
    } catch (error) {
      console.error('Błąd podczas pobierania numeru karty:', error);
      res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
  }
};

module.exports = companySettingsController;