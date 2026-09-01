"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";

interface CustomerThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const CustomerThemeContext = createContext<CustomerThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "revora-customer-theme";

export function CustomerThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync theme to DOM html class
  const applyTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof document !== "undefined") {
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as Theme | null;
      const initialTheme: Theme = saved === "dark" ? "dark" : "light";
      applyTheme(initialTheme);
    } catch (e) {
      console.error("Failed to read customer theme from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    applyTheme(newTheme);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error("Failed to save customer theme to localStorage", e);
    }
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  return (
    <CustomerThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </CustomerThemeContext.Provider>
  );
}

export function useCustomerTheme() {
  const context = useContext(CustomerThemeContext);
  if (!context) {
    throw new Error("useCustomerTheme must be used within a CustomerThemeProvider");
  }
  return context;
}
