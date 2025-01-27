import React, { useState, useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  VStack,
  Icon,
  Text,
  Progress,
  Flex,
  useColorModeValue,
  Spinner,
  Image,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiActivity,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

const StatCard = ({ title, value, icon, helpText, trend, color }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const iconBg = useColorModeValue(`${color}.100`, `${color}.900`);
  const iconColor = useColorModeValue(`${color}.500`, `${color}.200`);

  return (
    <Card bg={bgColor}>
      <CardBody>
        <Flex alignItems="center" mb={4}>
          <Box
            p={2}
            bg={iconBg}
            borderRadius="md"
            color={iconColor}
            mr={4}
          >
            <Icon as={icon} boxSize={6} />
          </Box>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500">
              {title}
            </StatLabel>
            <StatNumber fontSize="2xl">{value}</StatNumber>
            {helpText && (
              <StatHelpText mb={0}>
                {trend && <StatArrow type={trend} />}
                {helpText}
              </StatHelpText>
            )}
          </Stat>
        </Flex>
      </CardBody>
    </Card>
  );
};

const RecentActivity = ({ recentOrders }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      processing: 'blue',
      completed: 'green',
      cancelled: 'red',
      en_cours: 'blue',
      termine: 'green',
      annule: 'red'
    };
    return colors[status] || 'gray';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  return (
    <Card>
      <CardBody>
        <Heading size="md" mb={4}>
          Activité récente
        </Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Description</Th>
              <Th>Statut</Th>
              <Th>Temps</Th>
            </Tr>
          </Thead>
          <Tbody>
            {recentOrders.map((order) => (
              <Tr key={order.id}>
                <Td>Commande #{order.id.slice(0, 8)}</Td>
                <Td>
                  <Badge colorScheme={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </Td>
                <Td>{formatDate(order.created_at)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

const ServiceStatus = ({ serviceStats }) => {
  const activePercentage = serviceStats.total > 0 
    ? (serviceStats.active / serviceStats.total) * 100 
    : 0;

  return (
    <Card>
      <CardBody>
        <Heading size="md" mb={4}>
          État des services
        </Heading>
        <VStack spacing={4} align="stretch">
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text>Services actifs</Text>
              <Text>{activePercentage.toFixed(1)}%</Text>
            </HStack>
            <Progress
              value={activePercentage}
              colorScheme="green"
              borderRadius="full"
            />
          </Box>
          <HStack justify="space-between">
            <Text color="gray.500">Total des services</Text>
            <Text fontWeight="bold">{serviceStats.total}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text color="gray.500">Services actifs</Text>
            <Text fontWeight="bold">{serviceStats.active}</Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

const ActiveUsers = ({ activeUsers }) => {
  return (
    <Card>
      <CardBody>
        <Heading size="md" mb={4}>
          Utilisateurs Actifs
        </Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Utilisateur</Th>
              <Th>Dernière activité</Th>
              <Th>Commandes</Th>
            </Tr>
          </Thead>
          <Tbody>
            {activeUsers.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <HStack>
                    <Box
                      w="2"
                      h="2"
                      borderRadius="full"
                      bg={user.is_online ? "green.500" : "gray.300"}
                    />
                    <Text>{user.full_name || user.email}</Text>
                  </HStack>
                </Td>
                <Td>{new Date(user.last_activity).toLocaleDateString()}</Td>
                <Td>{user.orders_count}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

const PopularServices = ({ popularServices }) => {
  return (
    <Card>
      <CardBody>
        <Heading size="md" mb={4}>
          Services Populaires
        </Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Service</Th>
              <Th>Commandes</Th>
              <Th>Revenus</Th>
            </Tr>
          </Thead>
          <Tbody>
            {popularServices.map((service) => (
              <Tr key={service.id}>
                <Td>
                  <HStack>
                    {service.image_url && (
                      <Box
                        w="8"
                        h="8"
                        borderRadius="md"
                        overflow="hidden"
                        mr={2}
                      >
                        <Image
                          src={service.image_url}
                          alt={service.name}
                          objectFit="cover"
                          w="full"
                          h="full"
                        />
                      </Box>
                    )}
                    <Text>{service.name}</Text>
                  </HStack>
                </Td>
                <Td>{service.orders_count}</Td>
                <Td>{new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  maximumFractionDigits: 0,
                }).format(service.total_revenue)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    activeUsers: 0,
    orders: 0,
    revenue: 0,
    services: { total: 0, active: 0 }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [popularServices, setPopularServices] = useState([]);

  // Formater les grands nombres
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Formater le montant en FCFA
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Récupérer le nombre d'utilisateurs et utilisateurs actifs
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) throw profilesError;

        // Calculer les utilisateurs actifs (dernière connexion < 30 jours)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsersData = profiles.filter(user => 
          user.last_login && new Date(user.last_login) > thirtyDaysAgo
        ).slice(0, 5);

        // Récupérer toutes les commandes
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            user_id,
            total_amount,
            status,
            created_at,
            order_items!inner (
              service_id
            )
          `);
        
        if (ordersError) throw ordersError;

        // Calculer les commandes par utilisateur
        const userOrderCounts = orders.reduce((acc, order) => {
          acc[order.user_id] = (acc[order.user_id] || 0) + 1;
          return acc;
        }, {});

        // Combiner les données des utilisateurs avec leurs commandes
        const usersWithOrders = activeUsersData.map(user => ({
          ...user,
          orders_count: userOrderCounts[user.id] || 0
        }));

        // Calculer le revenu total (hors commandes annulées)
        const totalRevenue = orders.reduce((sum, order) => 
          sum + (order.status !== 'cancelled' && order.status !== 'annule' ? (order.total_amount || 0) : 0), 0);

        // Récupérer les services avec leurs commandes
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select(`
            id,
            name,
            image_url,
            is_available,
            order_items (
              id,
              order:orders!inner (
                total_amount,
                status
              )
            )
          `);
        
        if (servicesError) throw servicesError;

        // Calculer les statistiques des services
        const activeServices = services.filter(s => s.is_available).length;

        // Calculer les services les plus populaires
        const popularServices = services
          .map(service => {
            const validOrders = service.order_items?.filter(item => 
              item.order.status !== 'cancelled' && item.order.status !== 'annule'
            ) || [];
            
            return {
              id: service.id,
              name: service.name,
              image_url: service.image_url,
              orders_count: validOrders.length,
              total_revenue: validOrders.reduce((sum, item) => 
                sum + (item.order.total_amount || 0), 0)
            };
          })
          .sort((a, b) => b.orders_count - a.orders_count)
          .slice(0, 5);

        // Récupérer les commandes récentes
        const recentOrdersData = orders
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);

        setStats({
          users: profiles.length,
          activeUsers: activeUsersData.length,
          orders: orders.length,
          revenue: totalRevenue,
          services: {
            total: services.length,
            active: activeServices
          }
        });

        setActiveUsers(usersWithOrders);
        setPopularServices(popularServices);
        setRecentOrders(recentOrdersData);

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={4}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={8}>
        <StatCard
          title="Utilisateurs"
          value={`${formatNumber(stats.users)} (${stats.activeUsers} actifs)`}
          icon={FiUsers}
          color="blue"
        />
        <StatCard
          title="Commandes"
          value={formatNumber(stats.orders)}
          icon={FiShoppingBag}
          color="orange"
        />
        <StatCard
          title="Revenu"
          value={formatCurrency(stats.revenue)}
          icon={FiDollarSign}
          color="green"
        />
        <StatCard
          title="Services"
          value={formatNumber(stats.services.total)}
          icon={FiActivity}
          color="purple"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4} mb={8}>
        <RecentActivity recentOrders={recentOrders} />
        <ServiceStatus serviceStats={stats.services} />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <ActiveUsers activeUsers={activeUsers} />
        <PopularServices popularServices={popularServices} />
      </SimpleGrid>
    </Box>
  );
};

export default AdminDashboard;
