import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Transactions from './pages/Transactions';
import Tips from './pages/Tips';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AddFunds from './pages/AddFunds';
import Orders from './pages/Orders';
import Favorites from './pages/Favorites';
import AdminLayout from './em-ad/AdminLayout';
import AdminDashboard from './em-ad/pages/AdminDashboard';
import AdminUsers from './em-ad/pages/AdminUsers';
import AdminTransactions from './em-ad/pages/AdminTransactions';
import AdminServices from './em-ad/pages/AdminServices';
import AdminSettings from './em-ad/pages/AdminSettings';
import AdminCategories from './em-ad/pages/AdminCategories';
import AdminOrders from './em-ad/pages/AdminOrders';
import AdminPayments from './em-ad/pages/AdminPayments';
import Login from './em-ad/pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import { StatsProvider } from './em-ad/context/StatsContext';
import ProtectedRoute from './components/ProtectedRoute';
import PrivateAdminRoute from './components/PrivateAdminRoute';
import PublicRoute from './components/PublicRoute';
import { OrderProvider } from './context/OrderContext';
import { BalanceProvider } from './context/BalanceContext';
import { AdminOrderProvider } from './context/AdminOrderContext';
import { ServiceProvider } from './context/ServiceContext';
import { PaymentProvider } from './context/PaymentContext';
import Auth from './pages/Auth/Auth';
import { ProfileProvider } from './contexts/ProfileContext';
import AdminTips from './em-ad/pages/AdminTips';
import TransitionPage from './pages/TransitionPage';
import { OrderNotificationProvider } from './em-ad/context/OrderNotificationContext';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <ServiceProvider>
          <AuthProvider>
            <ProfileProvider>
              <StatsProvider>
                <BalanceProvider>
                  <OrderProvider>
                    <AdminOrderProvider>
                      <PaymentProvider>
                        <OrderNotificationProvider>
                          <Routes>
                            {/* Routes publiques */}
                            <Route path="/auth" element={
                              <PublicRoute>
                                <Layout><Auth /></Layout>
                              </PublicRoute>
                            } />
                            <Route path="/transition" element={<TransitionPage />} />
                            <Route path="/" element={<Layout><Home /></Layout>} />
                            <Route path="/services" element={<Layout><Services /></Layout>} />
                            <Route path="/tips" element={<Layout><Tips /></Layout>} />
                            
                            {/* Routes protégées */}
                            <Route path="/transactions" element={<ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>} />
                            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                            <Route path="/add-funds" element={<ProtectedRoute><Layout><AddFunds /></Layout></ProtectedRoute>} />
                            <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
                            <Route path="/favorites" element={<ProtectedRoute><Layout><Favorites /></Layout></ProtectedRoute>} />
                            
                            {/* Routes admin */}
                            <Route path="/em-ad" element={<PrivateAdminRoute><AdminLayout /></PrivateAdminRoute>}>
                              <Route index element={<AdminDashboard />} />
                              <Route path="users" element={<AdminUsers />} />
                              <Route path="orders" element={<AdminOrders />} />
                              <Route path="payments" element={<AdminPayments />} />
                              <Route path="transactions" element={<AdminTransactions />} />
                              <Route path="services" element={<AdminServices />} />
                              <Route path="categories" element={<AdminCategories />} />
                              <Route path="tips" element={<AdminTips />} />
                              <Route path="settings" element={<AdminSettings />} />
                            </Route>
                          </Routes>
                        </OrderNotificationProvider>
                      </PaymentProvider>
                    </AdminOrderProvider>
                  </OrderProvider>
                </BalanceProvider>
              </StatsProvider>
            </ProfileProvider>
          </AuthProvider>
        </ServiceProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
