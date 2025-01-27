import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Avatar,
  Text,
  HStack,
  VStack,
  Divider,
  useColorModeValue,
  Box,
  Icon,
  Circle,
  Spinner,
} from '@chakra-ui/react';
import { FaUser, FaSignOutAlt, FaChartLine, FaExchangeAlt, FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';

const UserMenu = () => {
  const { signOut } = useAuth();
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

  const menuBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const iconColor = useColorModeValue('gray.500', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');
  const balanceColor = useColorModeValue('green.500', 'green.300');

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('fr-FR').format(balance || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bonjour';
    if (hour >= 12 && hour < 18) return 'Bon après-midi';
    if (hour >= 18 && hour < 22) return 'Bonsoir';
    return 'Bonne nuit';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading || !profile) {
    return (
      <HStack spacing={3}>
        <Spinner size="sm" />
      </HStack>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="ghost"
        rounded="full"
        py={2}
        px={4}
        _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
      >
        <HStack spacing={3}>
          <Avatar
            size="sm"
            name={profile?.full_name}
            src={profile?.image}
          />
          <VStack
            display={{ base: 'none', md: 'flex' }}
            alignItems="flex-start"
            spacing={0}
            ml="2"
          >
            <Text fontSize="sm" fontWeight="medium">
              {getGreeting()}, {profile?.full_name || 'Utilisateur'}
            </Text>
            <HStack spacing={1} align="center">
              <Circle size="16px" bg="green.100">
                <Icon as={FaWallet} color="green.500" boxSize={2.5} />
              </Circle>
              <Text fontSize="sm" color={balanceColor} fontWeight="semibold">
                {formatBalance(profile?.balance)} XFA
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </MenuButton>

      <MenuList
        bg={menuBg}
        borderColor={borderColor}
        boxShadow="lg"
        p={2}
      >
        <MenuItem
          icon={<Icon as={FaUser} color={iconColor} />}
          onClick={() => navigate('/profile')}
        >
          <Text color={textColor}>Mon Profil</Text>
        </MenuItem>

        <MenuItem
          icon={<Icon as={FaChartLine} color={iconColor} />}
          onClick={() => navigate('/dashboard')}
        >
          <Text color={textColor}>Tableau de bord</Text>
        </MenuItem>

        <MenuItem
          icon={<Icon as={FaExchangeAlt} color={iconColor} />}
          onClick={() => navigate('/transactions')}
        >
          <Text color={textColor}>Transactions</Text>
        </MenuItem>

        <Divider my={2} borderColor={borderColor} />

        <MenuItem
          icon={<Icon as={FaSignOutAlt} color="red.500" />}
          onClick={handleLogout}
        >
          <Text color="red.500">Déconnexion</Text>
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default UserMenu;
