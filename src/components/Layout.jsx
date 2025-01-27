import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  useColorModeValue,
  useColorMode,
  Container,
  Icon,
  Spacer,
  Tooltip,
  Image,
  Link,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Text,
} from '@chakra-ui/react';
import { FaMoon, FaSun, FaShoppingCart, FaLightbulb, FaShoppingBag, FaWallet, FaHeart, FaBars } from 'react-icons/fa';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import { useProfile } from '../hooks/useProfile';

const Layout = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user } = useAuth();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [profile, setProfile] = useState(null);
  const { getProfile } = useProfile();

  useEffect(() => {
    if (user) {
      const loadProfile = async () => {
        const data = await getProfile();
        setProfile(data);
      };
      loadProfile();
    }
  }, [user, getProfile]);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Box
        bg={useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')}
        borderBottom="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        position="fixed"
        w="100%"
        top={0}
        zIndex={999}
        backdropFilter="blur(8px)"
        style={{
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <Container maxW="container.xl" py={2}>
          <Flex align="center" justify="space-between">
            {/* Logo */}
            <RouterLink to="/">
              <Image
                src="/assets/Logo (2).PNG"
                alt="Ematik Logo"
                height={{ base: "40px", md: "60px" }}
                width="auto"
                maxW={{ base: "150px", md: "250px" }}
                objectFit="contain"
              />
            </RouterLink>

            {/* Desktop Navigation */}
            <HStack spacing={{ base: 2, md: 4 }} mx={{ base: 2, md: 4 }} flex={1} display={{ base: "none", md: "flex" }}>
              <Link
                as={RouterLink}
                to="/services"
                color={location.pathname === '/services' ? 'blue.500' : undefined}
                fontWeight={location.pathname === '/services' ? 'bold' : 'normal'}
                _hover={{ color: 'blue.500' }}
                display="flex"
                alignItems="center"
                fontSize={{ base: 'sm', lg: 'md' }}
              >
                <Icon as={FaShoppingCart} mr={1} />
                Services
              </Link>
              {user && (
                <Link
                  as={RouterLink}
                  to="/orders"
                  color={location.pathname === '/orders' ? 'blue.500' : undefined}
                  fontWeight={location.pathname === '/orders' ? 'bold' : 'normal'}
                  _hover={{ color: 'blue.500' }}
                  display="flex"
                  alignItems="center"
                  fontSize={{ base: 'sm', lg: 'md' }}
                >
                  <Icon as={FaShoppingBag} mr={1} />
                  Mes commandes
                </Link>
              )}
              <Link
                as={RouterLink}
                to="/tips"
                color={location.pathname === '/tips' ? 'blue.500' : undefined}
                fontWeight={location.pathname === '/tips' ? 'bold' : 'normal'}
                _hover={{ color: 'blue.500' }}
                display="flex"
                alignItems="center"
                fontSize={{ base: 'sm', lg: 'md' }}
              >
                <Icon as={FaLightbulb} mr={1} />
                Astuces
              </Link>
              {user && (
                <Link
                  as={RouterLink}
                  to="/add-funds"
                  color={location.pathname === '/add-funds' ? 'blue.500' : undefined}
                  fontWeight={location.pathname === '/add-funds' ? 'bold' : 'normal'}
                  _hover={{ color: 'blue.500' }}
                  display="flex"
                  alignItems="center"
                  fontSize={{ base: 'sm', lg: 'md' }}
                >
                  <Icon as={FaWallet} mr={1} />
                  Ajouter des fonds
                </Link>
              )}
            </HStack>

            {/* Right Side Icons */}
            <HStack spacing={4}>
              {/* Mobile Menu Button */}
              <IconButton
                display={{ base: 'flex', md: 'none' }}
                icon={<FaBars />}
                variant="ghost"
                onClick={onOpen}
                aria-label="Open Menu"
              />

              {/* Desktop Icons */}
              <Box display={{ base: 'none', md: 'block' }}>
                {user && (
                  <IconButton
                    as={RouterLink}
                    to="/favorites"
                    icon={<FaHeart />}
                    variant="ghost"
                    aria-label="Favoris"
                    color={location.pathname === '/favorites' ? 'red.500' : undefined}
                    _hover={{ color: 'red.500' }}
                  />
                )}
              </Box>
              
              <IconButton
                icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                onClick={toggleColorMode}
                variant="ghost"
                aria-label="Toggle Theme"
                color={colorMode === 'light' ? 'gray.600' : 'yellow.400'}
                _hover={{ color: colorMode === 'light' ? 'gray.800' : 'yellow.500' }}
              />
              
              {user ? (
                <UserMenu />
              ) : (
                <Button
                  as={RouterLink}
                  to="/auth"
                  colorScheme="purple"
                  size="sm"
                >
                  Se connecter
                </Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={4}>
              <Link
                as={RouterLink}
                to="/services"
                onClick={onClose}
                display="flex"
                alignItems="center"
              >
                <Icon as={FaShoppingCart} mr={2} />
                Services
              </Link>
              {user && (
                <Link
                  as={RouterLink}
                  to="/orders"
                  onClick={onClose}
                  display="flex"
                  alignItems="center"
                >
                  <Icon as={FaShoppingBag} mr={2} />
                  Mes commandes
                </Link>
              )}
              <Link
                as={RouterLink}
                to="/tips"
                onClick={onClose}
                display="flex"
                alignItems="center"
              >
                <Icon as={FaLightbulb} mr={2} />
                Astuces
              </Link>
              {user && (
                <Link
                  as={RouterLink}
                  to="/add-funds"
                  onClick={onClose}
                  display="flex"
                  alignItems="center"
                >
                  <Icon as={FaWallet} mr={2} />
                  Ajouter des fonds
                </Link>
              )}
              {user && (
                <Link
                  as={RouterLink}
                  to="/favorites"
                  onClick={onClose}
                  display="flex"
                  alignItems="center"
                >
                  <Icon as={FaHeart} mr={2} />
                  Favoris
                </Link>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box pt={{ base: "60px", md: "80px" }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
