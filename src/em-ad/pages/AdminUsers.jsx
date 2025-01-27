import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  Text,
  HStack,
  VStack,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Input,
  Select,
  Button,
  useToast,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaEllipsisV, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const AdminUsers = () => {
  // Hooks d'état et de contexte - toujours au début
  const { user } = useAuth();
  const toast = useToast();
  
  // États
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  // Hooks de style
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Mémoisation des utilisateurs filtrés
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filterRole === 'all' || user.role === filterRole;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  // Effet pour vérifier le statut admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('admin_roles')
          .select('user_id')
          .eq('user_id', user.id);

        if (error) throw error;

        setIsAdmin(data && data.length > 0);
        if (!(data && data.length > 0)) {
          setError('Vous n\'avez pas les droits administrateur nécessaires.');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setError('Impossible de vérifier les droits administrateur.');
      }
    };

    checkAdminStatus();
  }, [user]);

  // Effet pour charger les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching all users...');
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Fetched users:', data);
        setUsers(data || []);
      } catch (error) {
        console.error('Full error:', error);
        setError(error.message);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les utilisateurs: ' + error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, toast]);

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      if (newRole === 'admin') {
        const { error: adminRoleError } = await supabase
          .from('admin_roles')
          .upsert({ user_id: userId });

        if (adminRoleError) throw adminRoleError;
      } else {
        const { error: removeAdminError } = await supabase
          .from('admin_roles')
          .delete()
          .eq('user_id', userId);

        if (removeAdminError) throw removeAdminError;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);

      toast({
        title: 'Succès',
        description: `Le rôle de l'utilisateur a été mis à jour en ${newRole}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de mettre à jour le rôle: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleBlockUser = async (userId, shouldBlock) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          is_blocked: shouldBlock,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      if (shouldBlock) {
        const { error: removeAdminError } = await supabase
          .from('admin_roles')
          .delete()
          .eq('user_id', userId);

        if (removeAdminError) throw removeAdminError;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);

      toast({
        title: 'Succès',
        description: `L'utilisateur a été ${shouldBlock ? 'bloqué' : 'débloqué'} avec succès`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de ${shouldBlock ? 'bloquer' : 'débloquer'} l'utilisateur: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (error) {
    return (
      <Box p={4}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle mr={2}>Erreur!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Flex mb={4} gap={4} flexWrap="wrap">
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <FaSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Select
          maxW="200px"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="user">Utilisateur</option>
        </Select>
        <Button
          colorScheme="blue"
          onClick={() => {
            setUsers([]);
            const fetchUsers = async () => {
              if (!isAdmin) return;

              try {
                setLoading(true);
                setError(null);
                console.log('Fetching all users...');
                
                const { data, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .order('created_at', { ascending: false });

                if (error) throw error;

                console.log('Fetched users:', data);
                setUsers(data || []);
              } catch (error) {
                console.error('Full error:', error);
                setError(error.message);
                toast({
                  title: 'Erreur',
                  description: 'Impossible de charger les utilisateurs: ' + error.message,
                  status: 'error',
                  duration: 3000,
                  isClosable: true,
                });
              } finally {
                setLoading(false);
              }
            };

            fetchUsers();
          }}
          isLoading={loading}
        >
          Actualiser
        </Button>
      </Flex>

      {filteredUsers.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Aucun utilisateur trouvé
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" w="100%">
            <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
              <Tr>
                <Th>Utilisateur</Th>
                <Th>Rôle</Th>
                <Th>Statut</Th>
                <Th>Date d'inscription</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <HStack spacing={3}>
                      <Avatar size="sm" name={user.full_name} src={user.avatar_url} />
                      <VStack alignItems="flex-start" spacing={0}>
                        <Text fontWeight="medium">{user.full_name}</Text>
                        <Text fontSize="sm" color={textColor}>ID: {user.id.slice(0, 8)}</Text>
                      </VStack>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={user.role === 'admin' ? 'purple' : 'gray'}
                      variant="subtle"
                      px={2}
                      py={1}
                      rounded="full"
                    >
                      {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={user.is_blocked ? 'red' : 'green'}
                      variant="subtle"
                      px={2}
                      py={1}
                      rounded="full"
                    >
                      {user.is_blocked ? 'Bloqué' : 'Actif'}
                    </Badge>
                  </Td>
                  <Td>{new Date(user.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FaEllipsisV />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem
                          onClick={() => handleUpdateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                        >
                          {user.role === 'admin' ? 'Rétrograder en utilisateur' : 'Promouvoir en admin'}
                        </MenuItem>
                        <MenuItem
                          onClick={() => handleBlockUser(user.id, !user.is_blocked)}
                        >
                          {user.is_blocked ? 'Débloquer' : 'Bloquer'}
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default AdminUsers;
