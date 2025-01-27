import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  useColorModeValue,
  Text,
  Stack,
  Heading,
  useDisclosure,
  Drawer,
  DrawerContent,
  useColorMode,
  Badge,
} from '@chakra-ui/react';
import { FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

// Composant séparé pour le menu avec notification
const MenuItem = ({ item }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <NavLink
      to={item.path}
      style={{
        backgroundColor: isActive ? 'var(--chakra-colors-brand-500)' : 'transparent',
        color: isActive ? 'white' : 'inherit',
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        display: 'block',
        textDecoration: 'none',
        position: 'relative',
      }}
    >
      <Flex alignItems="center" justifyContent="space-between">
        <Text>{item.name}</Text>
        {item.badge && (
          <Badge
            colorScheme="red"
            borderRadius="full"
            ml={2}
          >
            {item.badge}
          </Badge>
        )}
      </Flex>
    </NavLink>
  );
};

// Composant pour le menu avec notifications
const MenuWithNotifications = () => {
  const { newOrdersCount } = useOrderNotification();
  
  const menuItems = [
    { name: 'Tableau de bord', path: '/em-ad' },
    { name: 'Utilisateurs', path: '/em-ad/users' },
    { 
      name: 'Commandes', 
      path: '/em-ad/orders',
      badge: newOrdersCount > 0 ? newOrdersCount : null 
    },
    { name: 'Paiements', path: '/em-ad/payments' },
    { name: 'Transactions', path: '/em-ad/transactions' },
    { name: 'Services', path: '/em-ad/services' },
    { name: 'Catégories', path: '/em-ad/categories' },
    { name: 'Astuces', path: '/em-ad/tips' },
    { name: 'Paramètres', path: '/em-ad/settings' },
  ];

  return (
    <Stack spacing={4} mx={4}>
      {menuItems.map((item) => (
        <MenuItem key={item.path} item={item} />
      ))}
    </Stack>
  );
};

const SidebarContent = ({ onClose, ...rest }) => {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold">
          Em-Ad
        </Text>
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onClose}
          variant="outline"
          aria-label="close menu"
          icon={<FiX />}
        />
      </Flex>

      <MenuWithNotifications />
    </Box>
  );
};

const AdminLayout = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.100', 'gray.900')}>
      <SidebarContent display={{ base: 'none', md: 'block' }} />
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>

      {/* Navbar */}
      <Flex
        ml={{ base: 0, md: 60 }}
        px={{ base: 4, md: 24 }}
        height="20"
        alignItems="center"
        bg={useColorModeValue('white', 'gray.900')}
        borderBottomWidth="1px"
        borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
        justifyContent="flex-start"
      >
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          variant="outline"
          aria-label="open menu"
          icon={<FiMenu />}
        />

        <Heading size="lg" ml={{ base: 3, md: 0 }}>
          Administration
        </Heading>

        <IconButton
          ml="auto"
          onClick={toggleColorMode}
          icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
          variant="ghost"
        />
      </Flex>

      <Box ml={{ base: 0, md: 60 }} p="4">
        <Outlet />
      </Box>
    </Box>
  );
};

import { useOrderNotification } from './context/OrderNotificationContext';

export default AdminLayout;
