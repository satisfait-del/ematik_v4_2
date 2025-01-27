import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

const AdminOrderContext = createContext();

export const useAdminOrder = () => {
  const context = useContext(AdminOrderContext);
  if (!context) {
    throw new Error('useAdminOrder must be used within an AdminOrderProvider');
  }
  return context;
};

export const AdminOrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const toast = useToast();

  // Simuler la récupération des commandes depuis une API
  useEffect(() => {
    // Dans une vraie application, ceci serait un appel API
    const mockOrders = [
      {
        id: 'CMD123456',
        user: 'Jean Dupont',
        service: 'Recharge Orange 5000',
        amount: '5,000 FCFA',
        status: 'pending',
        date: '07/01/2025 10:30',
        phone: '123456789',
        email: 'jean@example.com',
      },
      {
        id: 'CMD123457',
        user: 'Marie Claire',
        service: 'Forfait Internet 10GB',
        amount: '10,000 FCFA',
        status: 'pending',
        date: '07/01/2025 10:15',
        phone: '987654321',
        email: 'marie@example.com',
      },
    ];

    setOrders(mockOrders);
    updatePendingOrders(mockOrders);
  }, []);

  const updatePendingOrders = (allOrders) => {
    const pending = allOrders.filter(order => order.status === 'pending');
    setPendingOrders(pending);
  };

  const addOrder = (newOrder) => {
    const orderWithDefaults = {
      ...newOrder,
      id: 'CMD' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      date: new Date().toLocaleString(),
      status: 'pending',
    };

    setOrders(prev => {
      const updated = [...prev, orderWithDefaults];
      updatePendingOrders(updated);
      return updated;
    });

    toast({
      title: 'Nouvelle commande',
      description: `Commande ${orderWithDefaults.id} créée avec succès`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });

    return orderWithDefaults;
  };

  const updateOrderStatus = (orderId, newStatus, note = '') => {
    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id === orderId) {
          const updatedOrder = {
            ...order,
            status: newStatus,
            note: note,
            updatedAt: new Date().toLocaleString(),
          };

          toast({
            title: 'Statut mis à jour',
            description: `Commande ${orderId} : ${newStatus}`,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });

          return updatedOrder;
        }
        return order;
      });

      updatePendingOrders(updated);
      return updated;
    });
  };

  const getOrderById = (orderId) => {
    return orders.find(order => order.id === orderId);
  };

  return (
    <AdminOrderContext.Provider value={{
      orders,
      pendingOrders,
      addOrder,
      updateOrderStatus,
      getOrderById,
    }}>
      {children}
    </AdminOrderContext.Provider>
  );
};
