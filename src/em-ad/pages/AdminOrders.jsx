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
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Flex,
  Divider,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  useToast,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Button,
} from '@chakra-ui/react';
import { FiSearch, FiMoreVertical, FiCopy } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { useOrderNotification } from '../context/OrderNotificationContext';

const OrderStatusModal = ({ isOpen, onClose, order = null, onUpdateStatus }) => {
  const toast = useToast();
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');

  const handleCopyData = () => {
    if (order?.input_value) {
      navigator.clipboard.writeText(order.input_value);
      toast({
        title: "Copié !",
        description: "Les données ont été copiées dans le presse-papiers",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top"
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Détails de la commande</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="bold" mb={1}>
                Commande #{order?.id?.slice(0, 8)}
              </Text>
              <Text color={textColor}>
                Client: {order?.user_email}
              </Text>
            </Box>

            <Divider borderColor={dividerColor} />

            <Box>
              <Text fontWeight="bold" mb={2}>
                Détails de la commande
              </Text>
              <VStack align="stretch" spacing={2}>
                <Text>Service: {order?.service?.name || 'Non spécifié'}</Text>
                <Text>Quantité: {order?.quantity || 1}</Text>
                <Text>Montant: {order?.total_amount?.toLocaleString('fr-FR')} XFA</Text>
                <Text>Date: {order?.created_at ? format(new Date(order.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'N/A'}</Text>
                {order?.input_value && (
                  <Box>
                    <Text fontWeight="semibold" color="blue.500" mb={2}>
                      Données fournies par le client:
                    </Text>
                    <Box 
                      p={3} 
                      bg={useColorModeValue('gray.50', 'gray.700')} 
                      borderRadius="md"
                      border="1px"
                      borderColor={dividerColor}
                      position="relative"
                    >
                      <Flex align="center" gap={3} justifyContent="space-between">
                        <Text wordBreak="break-all" fontSize="sm" flex="1">
                          {order.input_value}
                        </Text>
                        <IconButton
                          icon={<FiCopy />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={handleCopyData}
                          aria-label="Copier les données"
                          title="Copier les données"
                        />
                      </Flex>
                    </Box>
                  </Box>
                )}
              </VStack>
            </Box>

            <HStack spacing={4} justify="flex-end">
              <Button 
                colorScheme="red" 
                onClick={() => {
                  onUpdateStatus(order.id, 'non_traite');
                  onClose();
                }}
                variant="outline"
              >
                Non traiter
              </Button>
              <Button 
                colorScheme="green" 
                onClick={() => {
                  onUpdateStatus(order.id, 'traite');
                  onClose();
                }}
              >
                Traiter
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const AdminOrders = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { resetCount } = useOrderNotification();
  
  // États
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('en_cours'); 
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Données des commandes:', data);

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.message);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commandes: ' + error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    resetCount();
  }, [resetCount]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('=== Début de la mise à jour du statut ===');
      console.log('ID de la commande:', orderId);
      console.log('Nouveau statut:', newStatus);

      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Utilisateur actuel:', user);
      
      if (authError) {
        console.error('Erreur d\'authentification:', authError);
        throw authError;
      }

      // Vérifier si l'utilisateur est admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_roles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      console.log('Vérification admin:', { adminCheck, adminError });

      if (adminError) {
        console.error('Erreur lors de la vérification admin:', adminError);
        throw adminError;
      }

      if (!adminCheck) {
        throw new Error('Accès non autorisé - Droits administrateur requis');
      }

      // Mettre à jour le statut
      const { error: updateError, data: updateData } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select();

      console.log('Résultat de la mise à jour:', { updateError, updateData });

      if (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError);
        throw updateError;
      }

      // Rafraîchir les données avec la jointure
      const { data: refreshData, error: refreshError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Résultat du rafraîchissement:', { refreshError, refreshData });

      if (refreshError) {
        console.error('Erreur lors du rafraîchissement:', refreshError);
        throw refreshError;
      }

      setOrders(refreshData || []);
      console.log('=== Fin de la mise à jour du statut ===');

      toast({
        title: 'Succès',
        description: `Le statut de la commande a été mis à jour en "${newStatus === 'traite' ? 'Traité' : 'Non traité'}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur complète:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de mettre à jour le statut: ${error.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' ? true : order.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  if (error) {
    return (
      <Box p={4}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Flex mb={4} gap={4} flexWrap="wrap">
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          maxW={{ base: "100%", md: "200px" }}
        >
          <option value="en_cours">En cours</option>
          <option value="traite">Traité</option>
          <option value="non_traite">Non traité</option>
          <option value="all">Tous les statuts</option>
        </Select>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : filteredOrders.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Aucune commande trouvée
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Montant</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredOrders.map((order) => (
                <Tr key={order.id}>
                  <Td>{order.id.slice(0, 8)}</Td>
                  <Td>{order.total_amount?.toLocaleString('fr-FR')} XFA</Td>
                  <Td>
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(order.status)}
                      variant="subtle"
                      px={2}
                      py={1}
                      rounded="full"
                    >
                      {getStatusText(order.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem onClick={() => setSelectedOrder(order)}>
                          Voir les détails
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

      {selectedOrder && (
        <OrderStatusModal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}
    </Box>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'traite':
      return 'green';
    case 'en_cours':
      return 'blue';
    case 'non_traite':
      return 'red';
    default:
      return 'gray';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'traite':
      return 'Traité';
    case 'en_cours':
      return 'En cours';
    case 'non_traite':
      return 'Non traité';
    default:
      return status;
  }
};

export default AdminOrders;
