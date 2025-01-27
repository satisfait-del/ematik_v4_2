import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  VStack,
  Image,
  Text,
  Box,
} from '@chakra-ui/react';
import { keyframes as emotionKeyframes } from '@emotion/react';

// Animation de pulsation pour le logo
const pulse = emotionKeyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

// Animation de fondu pour le texte
const fadeIn = emotionKeyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const WelcomeLoader = ({ isOpen, message }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer;
    if (isOpen) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={true}
      onClose={() => {}}
      isCentered
      closeOnOverlayClick={false}
      closeOnEsc={false}
      motionPreset="none"
    >
      <ModalOverlay
        bg="blackAlpha.900"
        backdropFilter="blur(8px)"
      />
      <ModalContent
        bg="transparent"
        boxShadow="none"
        display="flex"
        alignItems="center"
        justifyContent="center"
        width="100vw"
        height="100vh"
        maxW="100vw"
        maxH="100vh"
        m={0}
        position="fixed"
        top={0}
        left={0}
      >
        <VStack spacing={8} p={4}>
          <Image
            src="/embleme.PNG"
            alt="Logo"
            w="180px"
            h="180px"
            animation={`${pulse} 2s ease-in-out infinite`}
            filter="drop-shadow(0 0 10px rgba(255,255,255,0.3))"
            draggable={false}
            userSelect="none"
          />
          <VStack spacing={4}>
            <Text
              color="white"
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
            <Box
              color="white"
              fontSize="lg"
              opacity={0.8}
              animation={`${fadeIn} 1s ease-out`}
              textShadow="0 2px 10px rgba(0,0,0,0.5)"
              userSelect="none"
            >
              Redirection dans {countdown} secondes...
            </Box>
          </VStack>
        </VStack>
      </ModalContent>
    </Modal>
  );
};

export default WelcomeLoader;
