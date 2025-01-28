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
import { FaMoon, FaSun, FaShoppingCart, FaLightbulb, FaShoppingBag, FaWallet, FaHeart, FaBars, FaUser } from 'react-icons/fa';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import { useProfile } from '../hooks/useProfile';
import Chatbot from './Chatbot';

const Layout = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user } = useAuth();
  const location = useLocation();
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
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

  useEffect(() => {
    const controlMobileNav = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY) { // scrolling down
        setShowMobileNav(false);
      } else { // scrolling up
        setShowMobileNav(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlMobileNav);

    return () => {
      window.removeEventListener('scroll', controlMobileNav);
    };
  }, [lastScrollY]);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Navbar principale fixe */}
      <Box
        position="fixed"
        w="100%"
        top={0}
        zIndex={999}
        bg={useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')}
        borderBottom="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        backdropFilter="blur(8px)"
        style={{
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <Container maxW="container.xl" py={2}>
          <Flex align="center" justify="space-between">
            {/* Logo */}
            <RouterLink to="/">
              <HStack spacing={2}>
                <Image
                  src="/assets/lo.png"
                  alt="Ematik Logo"
                  height={{ base: "30px", md: "35px" }}
                  width="auto"
                  maxW={{ base: "30px", md: "35px" }}
                  objectFit="contain"
                />
                <Text
                  fontSize={{ base: "xl", md: "2xl" }}
                  fontFamily="aglowCandy"
                  bgGradient="linear(to-r, blue.400, teal.400)"
                  bgClip="text"
                  display={{ base: "none", md: "block" }}
                >
                  eMatik
                </Text>
              </HStack>
            </RouterLink>

            <Flex flex={1} justify="flex-end">
              {/* Desktop Navigation */}
              <HStack spacing={4} display={{ base: "none", md: "flex" }} mr={4}>
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
                  <>
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
                      Commandes
                    </Link>
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
                  </>
                )}
              </HStack>

              {/* Right Side Items */}
              <HStack spacing={2}>
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
                <IconButton
                  icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                  onClick={toggleColorMode}
                  variant="ghost"
                  aria-label="Toggle color mode"
                  color={colorMode === 'light' ? 'gray.600' : 'yellow.400'}
                  _hover={{ color: colorMode === 'light' ? 'gray.800' : 'yellow.500' }}
                />
                
                {user ? (
                  <UserMenu />
                ) : (
                  <Button
                    as={RouterLink}
                    to="/auth"
                    bgGradient="linear(to-r, blue.400, teal.400)"
                    color="white"
                    size="sm"
                    _hover={{ bgGradient: "linear(to-r, teal.400, blue.400)" }}
                  >
                    Se connecter
                  </Button>
                )}
              </HStack>
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Ajustement de la marge pour le contenu principal */}
      <Box pt={{ base: "60px", md: "70px" }}>
        {/* Sous-navbar mobile */}
        <Box
          display={{ base: "block", md: "none" }}
          py={2}
          transform={`translateY(${showMobileNav ? '0' : '-100%'})`}
          transition="transform 0.3s ease-in-out"
          bg={useColorModeValue('white', 'gray.800')}
          borderBottom="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          position="sticky"
          top="60px"
          zIndex={998}
        >
          <Container maxW="container.xl">
            <HStack justify="space-around">
              <Link
                as={RouterLink}
                to="/services"
                display="flex"
                alignItems="center"
                color={location.pathname === '/services' ? 'blue.500' : undefined}
                fontSize="sm"
              >
                <Icon as={FaShoppingCart} boxSize={4} mr={2} />
                Services
              </Link>
              
              <Link
                as={RouterLink}
                to="/tips"
                display="flex"
                alignItems="center"
                color={location.pathname === '/tips' ? 'blue.500' : undefined}
                fontSize="sm"
              >
                <Icon as={FaLightbulb} boxSize={4} mr={2} />
                Astuces
              </Link>

              {user && (
                <>
                  <Link
                    as={RouterLink}
                    to="/orders"
                    display="flex"
                    alignItems="center"
                    color={location.pathname === '/orders' ? 'blue.500' : undefined}
                    fontSize="sm"
                  >
                    <Icon as={FaShoppingBag} boxSize={4} mr={2} />
                    Commandes
                  </Link>

                  <Link
                    as={RouterLink}
                    to="/add-funds"
                    display="flex"
                    alignItems="center"
                    color={location.pathname === '/add-funds' ? 'blue.500' : undefined}
                    fontSize="sm"
                  >
                    <Icon as={FaWallet} boxSize={4} mr={2} />
                    Fonds
                  </Link>
                </>
              )}
            </HStack>
          </Container>
        </Box>

        {children}
      </Box>
      <Chatbot />
    </Box>
  );
};

export default Layout;
