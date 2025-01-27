import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const OrderNotificationContext = createContext();

export const useOrderNotification = () => {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error('useOrderNotification must be used within an OrderNotificationProvider');
  }
  return context;
};

export const OrderNotificationProvider = ({ children }) => {
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const fetchNewOrdersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'en_cours');

      if (error) throw error;
      
      setNewOrdersCount(count || 0);
    } catch (error) {
      console.error('Error fetching new orders count:', error);
    }
  };

  // Écouter les changements en temps réel
  useEffect(() => {
    // Première vérification
    fetchNewOrdersCount();

    // Abonnement aux changements de la table orders
    const subscription = supabase
      .channel('orders_channel')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, 
        () => {
          fetchNewOrdersCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const resetCount = () => {
    setNewOrdersCount(0);
  };

  return (
    <OrderNotificationContext.Provider value={{ newOrdersCount, resetCount, fetchNewOrdersCount }}>
      {children}
    </OrderNotificationContext.Provider>
  );
};
