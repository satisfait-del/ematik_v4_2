import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Image,
  Text,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const TransitionLoader = ({ message, targetPath }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  const spinnerColor = useColorModeValue('blue.500', 'blue.200')
  const textColor = useColorModeValue('gray.600', 'gray.200')
  const bgColor = useColorModeValue('white', 'gray.800')

  useEffect(() => {
    if (targetPath) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        navigate(targetPath);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [targetPath, navigate]);

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      zIndex="9999"
      bg={bgColor}
      display="flex"
      alignItems="center"
      justifyContent="center"
      backdropFilter="blur(8px)"
    >
      <VStack spacing={8} p={4}>
        <Box
          animation={`${pulse} 2s infinite`}
        >
          <Image
            src="/assets/embleme.PNG"
            alt="Logo"
            w="180px"
            h="180px"
            filter="drop-shadow(0 0 10px rgba(255,255,255,0.3))"
            draggable={false}
            userSelect="none"
            fallback={<Box w="180px" h="180px" bg="gray.700" borderRadius="md" />}
          />
        </Box>

        <VStack spacing={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor={useColorModeValue('gray.200', 'gray.700')}
            color={spinnerColor}
            size="lg"
          />
          <Text
            color={textColor}
            fontSize="2xl"
            fontWeight="bold"
            textAlign="center"
            animation={`${fadeIn} 1s ease-out`}
            textShadow="0 2px 10px rgba(0,0,0,0.5)"
            letterSpacing="wide"
            userSelect="none"
          >
            {message}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

export default TransitionLoader;
