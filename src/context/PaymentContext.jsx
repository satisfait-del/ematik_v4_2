import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { useBalance } from './BalanceContext';

const PaymentContext = createContext();

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const { addFunds } = useBalance();
  const toast = useToast();

  // Simuler la récupération des paiements depuis une API
  useEffect(() => {
    // Dans une vraie application, ceci serait un appel API
    const mockPayments = [
      {
        id: 'PAY123',
        userId: 'USER1',
        userName: 'Jean Dupont',
        amount: 5000,
        service: 'Recharge Orange',
        status: 'pending',
        date: '2025-01-07 10:30',
        phone: '123456789',
        email: 'jean@example.com',
      },
    ];

    setPayments(mockPayments);
  }, []);

  const addPayment = (newPayment) => {
    const paymentWithDefaults = {
      ...newPayment,
      id: 'PAY' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      date: new Date().toLocaleString(),
      status: 'pending',
    };

    setPayments(prev => [...prev, paymentWithDefaults]);

    toast({
      title: 'Paiement initié',
      description: 'Votre paiement est en cours de traitement',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });

    return paymentWithDefaults;
  };

  const getPendingPayments = () => {
    return payments.filter(payment => payment.status === 'pending');
  };

  const getCompletedPayments = () => {
    return payments.filter(payment => ['success', 'failed'].includes(payment.status));
  };

  const approvePayment = (paymentId) => {
    setPayments(prev => prev.map(payment => {
      if (payment.id === paymentId) {
        // Mettre à jour le solde de l'utilisateur
        addFunds(payment.amount);
        
        toast({
          title: 'Paiement approuvé',
          description: `Le paiement ${paymentId} a été approuvé`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        return { ...payment, status: 'success' };
      }
      return payment;
    }));
  };

  const rejectPayment = (paymentId, reason = '') => {
    setPayments(prev => prev.map(payment => {
      if (payment.id === paymentId) {
        toast({
          title: 'Paiement rejeté',
          description: `Le paiement ${paymentId} a été rejeté${reason ? ': ' + reason : ''}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });

        return { ...payment, status: 'failed', rejectionReason: reason };
      }
      return payment;
    }));
  };

  const getPaymentById = (paymentId) => {
    return payments.find(payment => payment.id === paymentId);
  };

  return (
    <PaymentContext.Provider value={{
      payments,
      addPayment,
      approvePayment,
      rejectPayment,
      getPendingPayments,
      getCompletedPayments,
      getPaymentById,
    }}>
      {children}
    </PaymentContext.Provider>
  );
};
