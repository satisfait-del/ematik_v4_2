import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { Spinner, Center, useColorModeValue } from '@chakra-ui/react';

const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: profileLoading } = useProfile();
  const location = useLocation();
  const spinnerColor = useColorModeValue('blue.500', 'blue.200');

  if (authLoading || profileLoading) {
    return (
      <Center minH="100vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor={useColorModeValue('gray.200', 'gray.700')}
          color={spinnerColor}
          size="xl"
        />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
