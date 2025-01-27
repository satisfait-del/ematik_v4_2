import React, { createContext, useContext, useState, useEffect } from 'react';

const StatsContext = createContext();

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
};

export const StatsProvider = ({ children }) => {
  const [stats, setStats] = useState({
    users: {
      total: 0,
      active: 0,
      new: 0,
    },
    orders: {
      total: 0,
      pending: 0,
      completed: 0,
      revenue: 0,
    },
    payments: {
      pending: 0,
      approved: 0,
      rejected: 0,
    },
    services: {
      total: 0,
      active: 0,
    },
  });

  const updateStats = () => {
    // Ici, vous ajouterez l'appel à votre API pour obtenir les statistiques en temps réel
    // Pour l'instant, nous utilisons des données simulées
    setStats({
      users: {
        total: Math.floor(Math.random() * 1000) + 500,
        active: Math.floor(Math.random() * 300) + 100,
        new: Math.floor(Math.random() * 50),
      },
      orders: {
        total: Math.floor(Math.random() * 2000) + 1000,
        pending: Math.floor(Math.random() * 100),
        completed: Math.floor(Math.random() * 1500) + 500,
        revenue: Math.floor(Math.random() * 10000000) + 5000000,
      },
      payments: {
        pending: Math.floor(Math.random() * 50),
        approved: Math.floor(Math.random() * 1000) + 500,
        rejected: Math.floor(Math.random() * 100),
      },
      services: {
        total: Math.floor(Math.random() * 50) + 20,
        active: Math.floor(Math.random() * 40) + 10,
      },
    });
  };

  // Mettre à jour les statistiques toutes les 30 secondes
  useEffect(() => {
    updateStats(); // Première mise à jour
    const interval = setInterval(updateStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <StatsContext.Provider value={{ stats, updateStats }}>
      {children}
    </StatsContext.Provider>
  );
};
