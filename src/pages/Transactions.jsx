import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  Text,
  VStack,
  HStack,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  TableContainer,
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Colors
  const bg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.700', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .in('type', ['recharge', 'achat'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data);
      } catch (err) {
        console.error('Erreur lors du chargement des transactions:', err);
        setError('Impossible de charger les transactions. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succes':
        return 'green';
      case 'en_cours':
        return 'yellow';
      case 'echec':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getTypeColor = (type) => {
    return type === 'recharge' ? 'green' : 'blue';
  };

  const getTypeIcon = (type) => {
    return type === 'recharge' ? FaArrowUp : FaArrowDown;
  };

  if (loading) {
    return <LoadingSpinner message="Chargement de vos transactions..." />;
  }

  if (error) {
    return (
      <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} pt="20">
        <Container maxW="container.xl">
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} pt="20">
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="lg" mb={2} color={headingColor}>
              Historique des transactions
            </Heading>
            <Text color={textColor}>
              Consultez l'historique de vos recharges et achats
            </Text>
          </Box>

          <Box
            bg={bg}
            p={6}
            borderRadius="lg"
            boxShadow="sm"
            border="1px"
            borderColor={borderColor}
          >
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Type</Th>
                    <Th>Date</Th>
                    <Th>Description</Th>
                    <Th>Montant</Th>
                    <Th>Statut</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.map((transaction) => (
                    <Tr key={transaction.id}>
                      <Td>
                        <HStack spacing={2}>
                          <Icon 
                            as={getTypeIcon(transaction.type)} 
                            color={`${getTypeColor(transaction.type)}.500`}
                          />
                          <Badge colorScheme={getTypeColor(transaction.type)}>
                            {transaction.type === 'recharge' ? 'Recharge' : 'Achat'}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td>{formatDate(transaction.created_at)}</Td>
                      <Td maxW="300px" isTruncated>{transaction.description}</Td>
                      <Td isNumeric fontWeight="bold">
                        {formatAmount(transaction.amount)} FCFA
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(transaction.status)}>
                          {transaction.status === 'succes' ? 'Succès' :
                           transaction.status === 'en_cours' ? 'En cours' :
                           transaction.status === 'echec' ? 'Échec' : 
                           transaction.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Transactions;
