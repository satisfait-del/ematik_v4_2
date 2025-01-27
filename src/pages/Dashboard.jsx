import { useState, useEffect } from 'react'
import {
  Container,
  SimpleGrid,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Stack,
  Heading,
  Text,
  useColorModeValue,
  Icon,
  Flex,
  Badge,
  VStack,
  HStack,
} from '@chakra-ui/react'
import { FaShoppingCart, FaWallet, FaChartLine, FaClock } from 'react-icons/fa'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import LoadingSpinner from '../components/LoadingSpinner'
import { useBalance } from '../context/BalanceContext'

const DashboardCard = ({ title, value, icon, helpText, color = "blue.500" }) => {
  const bg = useColorModeValue('white', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Card bg={bg}>
      <CardBody>
        <Flex align="center" justify="space-between">
          <Stat>
            <StatLabel color={textColor}>{title}</StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color={color}>
              {value}
            </StatNumber>
            {helpText && (
              <StatHelpText color={textColor} fontSize="sm">
                {helpText}
              </StatHelpText>
            )}
          </Stat>
          <Icon as={icon} w={8} h={8} color={color} />
        </Flex>
      </CardBody>
    </Card>
  )
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    orderCount: 0,
    lastOrder: null,
    totalSpent: 0,
  })
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { balance } = useBalance()

  useEffect(() => {
    const loadStats = async () => {
      try {
        if (!user) return

        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, total_amount, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        const completedOrders = orders.filter(order => order.status === 'completed').length
        const successRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0

        setStats({
          orderCount: orders.length,
          lastOrder: orders[0] || null,
          totalSpent,
          successRate,
          completedOrders,
          recentOrders: orders,
        })
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [user])

  const bg = useColorModeValue('gray.50', 'gray.900')
  const headingColor = useColorModeValue('gray.700', 'white')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  if (loading) {
    return <LoadingSpinner message="Chargement du tableau de bord..." />
  }

  return (
    <Box bg={bg} minH="100vh">
      <Container maxW="container.xl" py={8}>
        <Stack spacing={8}>
          <VStack align="start" spacing={2}>
            <Heading size="lg" color={headingColor}>Tableau de bord</Heading>
            <Text color={textColor}>
              Bienvenue sur votre tableau de bord
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <DashboardCard
              title="Solde actuel"
              value={`${balance?.toLocaleString('fr-FR')} XFA`}
              icon={FaWallet}
              color="green.500"
            />

            <DashboardCard
              title="Total dépensé"
              value={`${stats.totalSpent.toLocaleString('fr-FR')} XFA`}
              icon={FaChartLine}
              color="purple.500"
            />

            <DashboardCard
              title="Commandes"
              value={stats.orderCount}
              icon={FaShoppingCart}
              color="blue.500"
              helpText={`${stats.orderCount} commande${stats.orderCount !== 1 ? 's' : ''} passée${stats.orderCount !== 1 ? 's' : ''}`}
            />

            <DashboardCard
              title="Dernière commande"
              value={stats.lastOrder ? format(new Date(stats.lastOrder.created_at), 'd MMM yyyy', { locale: fr }) : 'Aucune'}
              icon={FaClock}
              color="orange.500"
              helpText={stats.lastOrder ? `${stats.lastOrder.total_amount.toLocaleString('fr-FR')} XFA` : null}
            />
          </SimpleGrid>

          <Card>
            <CardBody>
              <Stack spacing={4}>
                <Heading size="md" color={headingColor}>
                  Activité récente
                </Heading>
                {stats.orderCount === 0 ? (
                  <Text color={textColor}>
                    Vous n'avez pas encore passé de commande
                  </Text>
                ) : (
                  <HStack spacing={2} flexWrap="wrap">
                    <Text color={textColor}>
                      Votre dernière commande date du
                    </Text>
                    <Badge colorScheme="blue">
                      {format(new Date(stats.lastOrder.created_at), 'd MMMM yyyy à HH:mm', { locale: fr })}
                    </Badge>
                    <Text color={textColor}>
                      pour un montant de
                    </Text>
                    <Badge colorScheme="green">
                      {stats.lastOrder.total_amount.toLocaleString('fr-FR')} XFA
                    </Badge>
                  </HStack>
                )}
              </Stack>
            </CardBody>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}

export default Dashboard
