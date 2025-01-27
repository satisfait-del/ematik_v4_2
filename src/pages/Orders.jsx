import {
  Container,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Box,
  Heading,
  VStack,
  HStack,
  Icon,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Stack,
  useToast,
} from '@chakra-ui/react'
import { FaBox, FaSearch, FaFilter } from 'react-icons/fa'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const getStatusColor = (status) => {
  switch (status) {
    case 'en_cours':
      return 'yellow'
    case 'termine':
      return 'green'
    case 'annule':
      return 'red'
    default:
      return 'gray'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'en_cours':
      return 'En cours'
    case 'termine':
      return 'Terminé'
    case 'annule':
      return 'Annulé'
    default:
      return status
  }
}

const Orders = () => {
  const renderCount = useRef(0)
  renderCount.current++
  
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const { user } = useAuth()
  const toast = useToast()
  const prevUserRef = useRef(user)

  useEffect(() => {
    if (prevUserRef.current?.id !== user?.id) {
      prevUserRef.current = user
    }
  }, [user])

  const showError = useCallback((message) => {
    toast({
      title: 'Erreur',
      description: message,
      status: 'error',
      duration: 3000,
      isClosable: true,
    })
  }, [])

  const loadOrders = useCallback(async () => {
    const userId = user?.id
    if (!userId) return

    try {
      setLoading(true)
      
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const serviceIds = ordersData.map(order => order.service_id).filter(Boolean)
      
      if (serviceIds.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name, price')
          .in('id', serviceIds)

        if (servicesError) throw servicesError

        const ordersWithServices = ordersData.map(order => ({
          ...order,
          service: servicesData.find(service => service.id === order.service_id)
        }))

        setOrders(ordersWithServices)
        setFilteredOrders(ordersWithServices)
      } else {
        setOrders(ordersData)
        setFilteredOrders(ordersData)
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error)
      showError('Impossible de charger vos commandes')
    } finally {
      setLoading(false)
    }
  }, [user?.id, showError])

  useEffect(() => {
    if (user?.id) {
      loadOrders()
    }
  }, [user?.id, loadOrders])

  // Filtre les commandes en fonction des critères
  useEffect(() => {
    let result = [...orders]

    // Filtre par recherche
    if (searchTerm) {
      result = result.filter(order => 
        order.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.input_value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par statut
    if (statusFilter) {
      result = result.filter(order => order.status === statusFilter)
    }

    // Filtre par date
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    const ninetyDaysAgo = new Date(today)
    ninetyDaysAgo.setDate(today.getDate() - 90)

    switch (dateFilter) {
      case 'today':
        result = result.filter(order => new Date(order.created_at) >= today)
        break
      case '30days':
        result = result.filter(order => new Date(order.created_at) >= thirtyDaysAgo)
        break
      case '90days':
        result = result.filter(order => new Date(order.created_at) >= ninetyDaysAgo)
        break
      default:
        break
    }

    setFilteredOrders(result)
  }, [orders, searchTerm, statusFilter, dateFilter])

  if (loading) {
    return <LoadingSpinner message="Chargement de vos commandes..." />
  }

  if (orders.length === 0) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} align="center" py={12}>
          <Icon as={FaBox} boxSize={12} color="gray.400" />
          <Heading size="md" color="gray.500">
            Aucune commande
          </Heading>
          <Text color="gray.500">
            Vos commandes apparaîtront ici une fois que vous aurez passé une commande.
          </Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <Heading size="lg">Mes commandes</Heading>
        
        {/* Filtres */}
        <Stack 
          direction={{ base: "column", md: "row" }} 
          spacing={4}
          align={{ base: "stretch", md: "center" }}
        >
          <InputGroup maxW={{ base: "100%", md: "300px" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher une commande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Select
            placeholder="Tous les statuts"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW={{ base: "100%", md: "200px" }}
          >
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </Select>

          <Select
            placeholder="Toutes les dates"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            maxW={{ base: "100%", md: "200px" }}
          >
            <option value="today">Aujourd'hui</option>
            <option value="30days">30 derniers jours</option>
            <option value="90days">90 derniers jours</option>
          </Select>
        </Stack>

        {/* Résultats de la recherche */}
        {filteredOrders.length === 0 ? (
          <VStack spacing={4} align="center" py={8}>
            <Icon as={FaFilter} boxSize={8} color="gray.400" />
            <Text color="gray.500">
              Aucune commande ne correspond à vos critères de recherche.
            </Text>
          </VStack>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Service</Th>
                  <Th>Date</Th>
                  <Th>Total</Th>
                  <Th>Statut</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOrders.map((order) => (
                  <Tr key={order.id}>
                    <Td>#{order.id.substring(0, 8)}</Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{order.service?.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {order.input_value}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Td>
                    <Td>
                      <Text fontWeight="bold">
                        {order.total_amount?.toLocaleString()} FCFA
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>
    </Container>
  )
}

export default Orders
