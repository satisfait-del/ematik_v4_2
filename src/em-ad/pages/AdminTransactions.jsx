import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Text,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Divider,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  FormControl,
  FormLabel,
  Flex,
} from '@chakra-ui/react';
import { FiEye, FiSearch, FiFilter } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

const TransactionModal = ({ isOpen, onClose, transaction = null }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'reussi':
        return 'green';
      case 'termine':
        return 'green';
      case 'echec':
        return 'red';
      case 'refuser':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'reussi':
        return 'Réussi';
      case 'termine':
        return 'Terminé';
      case 'echec':
        return 'Échoué';
      case 'refuser':
        return 'Refusé';
      default:
        return status;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Détails de la transaction</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="bold" mb={1}>
                Transaction #{transaction?.id}
              </Text>
              <Text color="gray.600">
                ID Utilisateur: {transaction?.user_id}
              </Text>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold" mb={2}>
                Détails de la transaction
              </Text>
              <Text>Type: {transaction?.type}</Text>
              <Text>Montant: {transaction?.amount} FCFA</Text>
              <Text>Date: {new Date(transaction?.created_at).toLocaleString()}</Text>
              <Text>Téléphone: {transaction?.telephone}</Text>
              <Text>Méthode de paiement: {transaction?.payment_method}</Text>
              <Text>Statut: <Badge colorScheme={getStatusColor(transaction?.status)}>
                {getStatusText(transaction?.status)}
              </Badge></Text>
              {transaction?.transaction_user_id && (
                <Text>ID Transaction utilisateur: {transaction.transaction_user_id}</Text>
              )}
              {transaction?.payment_details?.rejection_reason && (
                <>
                  <Text fontWeight="bold" mt={2} mb={1}>
                    Raison du rejet:
                  </Text>
                  <Text color="red.500">{transaction.payment_details.rejection_reason}</Text>
                </>
              )}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const toast = useToast();

  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .in('type', ['achat', 'recharge'])
        .neq('status', 'en_cours')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Filtre de date
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      
      switch (dateFilter) {
        case 'today':
          query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
          break;
        case 'week':
          const lastWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
          query = query.gte('created_at', lastWeek);
          break;
        case 'month':
          const lastMonth = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
          query = query.gte('created_at', lastMonth);
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrer les résultats selon la recherche
      let filteredData = data || [];
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredData = filteredData.filter(transaction => 
          transaction.telephone?.toLowerCase().includes(searchLower) ||
          transaction.transaction_user_id?.toLowerCase().includes(searchLower) ||
          transaction.amount.toString().includes(searchLower)
        );
      }

      setTransactions(filteredData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les transactions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter, dateFilter]); // Recharger quand les filtres changent

  // Délai de recherche pour éviter trop d'appels
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    onOpen();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reussi':
        return 'green';
      case 'termine':
        return 'green';
      case 'echec':
        return 'red';
      case 'refuser':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'reussi':
        return 'Réussi';
      case 'termine':
        return 'Terminé';
      case 'echec':
        return 'Échoué';
      case 'refuser':
        return 'Refusé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Chargement des transactions...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Card mb={6}>
        <CardBody>
          <Stack spacing={6}>
            <Flex justify="space-between" align="center">
              <Heading size="md">Historique des transactions</Heading>
              <HStack spacing={4}>
                <InputGroup maxW="300px">
                  <InputLeftElement pointerEvents="none">
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </HStack>
            </Flex>

            <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">Tous les types</option>
                  <option value="achat">Achat</option>
                  <option value="recharge">Recharge</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Statut</FormLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Tous les statuts</option>
                  <option value="reussi">Réussi</option>
                  <option value="echec">Échoué</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Période</FormLabel>
                <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  <option value="all">Toute la période</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Type</Th>
                <Th>Montant</Th>
                <Th>Téléphone</Th>
                <Th>ID Transaction</Th>
                <Th>Statut</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((transaction) => (
                <Tr key={transaction.id}>
                  <Td>{transaction.type}</Td>
                  <Td>{transaction.amount} FCFA</Td>
                  <Td>{transaction.telephone || '-'}</Td>
                  <Td>{transaction.transaction_user_id || '-'}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(transaction.status)}>
                      {getStatusText(transaction.status)}
                    </Badge>
                  </Td>
                  <Td>{new Date(transaction.created_at).toLocaleString()}</Td>
                  <Td>
                    <IconButton
                      icon={<FiEye />}
                      colorScheme="blue"
                      size="sm"
                      onClick={() => handleViewTransaction(transaction)}
                      aria-label="Voir les détails"
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {transactions.length === 0 && (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">
                Aucune transaction trouvée
              </Text>
            </Box>
          )}
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        transaction={selectedTransaction}
      />
    </Box>
  );
};

export default AdminTransactions;
