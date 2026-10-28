import React, { createContext, useContext, useState, useEffect } from 'react';
import { RestaurantSettings } from '../types';
import { api } from '../services/api';

interface SettingsContextType {
  settings: RestaurantSettings | null;
  refreshSettings: () => Promise<void>;
  formatCurrency: (amount: number | undefined | null) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  const refreshSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const formatCurrency = (amount: number | undefined | null): string => {
    const val = typeof amount === 'number' ? amount : 0;
    const symbol = settings?.currency_symbol || '$';
    return `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, formatCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}
