import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaRocket, FaShieldAlt, FaHeadset } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

const Feature = ({ icon, title, text }) => {
  return (
    <VStack
      bg={useColorModeValue('white', 'gray.800')}
      p={8}
      rounded="lg"
      shadow="md"
      textAlign="center"
      spacing={4}
    >
      <Icon as={icon} w={10} h={10} color="brand.500" />
      <Heading size="md">{title}</Heading>
      <Text color={useColorModeValue('gray.600', 'gray.300')}>{text}</Text>
    </VStack>
  );
};

const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg={useColorModeValue('gray.100', 'gray.700')}
        py={20}
        px={4}
        backgroundImage="url('/images/hero-bg.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        position="relative"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={useColorModeValue('whiteAlpha.800', 'blackAlpha.600')}
        />
        <Container maxW="container.xl" position="relative">
          <VStack spacing={6} alignItems="flex-start">
            <Heading
              as="h1"
              size="2xl"
              color={useColorModeValue('gray.800', 'white')}
            >
              Bienvenue sur
              <Text as="span" color="brand.500" ml={2}>
                Ematik Store
              </Text>
            </Heading>
            <Text
              fontSize="xl"
              color={useColorModeValue('gray.600', 'gray.300')}
              maxW="2xl"
            >
              Découvrez nos services de qualité et profitez d'une expérience exceptionnelle
            </Text>
            <VStack spacing={4}>
              <Button
                as={RouterLink}
                to="/services"
                size="lg"
                colorScheme="brand"
              >
                Voir nos services
              </Button>
              <Button
                as={RouterLink}
                to="/dashboard"
                size="lg"
                variant="outline"
                colorScheme="brand"
              >
                Mon compte
              </Button>
            </VStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={20}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <Feature
            icon={FaRocket}
            title="Rapide et Efficace"
            text="Livraison rapide de vos commandes avec un suivi en temps réel"
          />
          <Feature
            icon={FaShieldAlt}
            title="Sécurisé"
            text="Vos transactions sont protégées par un système de sécurité avancé"
          />
          <Feature
            icon={FaHeadset}
            title="Support 24/7"
            text="Notre équipe est disponible pour vous aider à tout moment"
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Home;
