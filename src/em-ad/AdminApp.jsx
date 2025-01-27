import React from 'react';
import { OrderNotificationProvider } from './context/OrderNotificationContext';
import AdminLayout from './AdminLayout';

const AdminApp = () => {
  return (
    <OrderNotificationProvider>
      <AdminLayout />
    </OrderNotificationProvider>
  );
};

export default AdminApp;
