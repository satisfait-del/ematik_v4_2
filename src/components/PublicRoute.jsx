import React from 'react';
import { Navigate } from 'react-router-dom';
import { Center, Spinner, useColorModeValue } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const PublicRoute = ({ children }) => {
  const { user, loading, sessionChecked } = useAuth();
  const spinnerColor = useColorModeValue('blue.500', 'blue.200');

  if (!sessionChecked || loading) {
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

  if (user) {
    return <Navigate to="/services" replace />;
  }

  return children;
};

export default PublicRoute;
