import {
  Box,
  Container,
  SimpleGrid,
  Input,
  Select,
  Stack,
  Image,
  Heading,
  Text,
  Button,
  IconButton,
  HStack,
  Badge,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useToast,
  Icon,
  Wrap,
  WrapItem,
  VStack,
  useColorModeValue,
  Circle,
  Card,
  CardBody,
  Flex,
  ButtonGroup,
  Spinner,
} from '@chakra-ui/react'
import { FaHeart, FaSearch, FaClock, FaShoppingCart, FaHashtag, FaTh, FaList, FaTrophy, FaShoppingBag, FaWallet, FaChartLine, FaTimes } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useFavorites } from '../hooks/useFavorites'
import { useOrders } from '../context/OrderContext'
import { useBalance } from '../context/BalanceContext'
import { useAdminOrder } from '../context/AdminOrderContext'
import { useSpending } from '../hooks/useSpending'
import { supabase } from '../lib/supabase'
import ServiceCard from '../components/ServiceCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'

const Services = () => {
  // Color mode values
  const bg = useColorModeValue('white', 'gray.800')
  const pageBg = useColorModeValue('gray.50', 'gray.900')
  const inputBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const headingColor = useColorModeValue('gray.700', 'white')

  // State hooks
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [orderCount, setOrderCount] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)

  // Context hooks
  const toast = useToast()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const { balance } = useBalance()
  const { addOrder } = useAdminOrder()
  const { user } = useAuth()

  const getUserLevel = (spent) => {
    if (spent >= 100000) return 'OR'
    if (spent >= 50000) return 'ARGENT'
    if (spent >= 25000) return 'BRONZE'
    return 'NOUVEAU'
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'OR':
        return 'yellow'
      case 'ARGENT':
        return 'gray'
      case 'BRONZE':
        return 'orange'
      default:
        return 'green' // Pour le niveau NOUVEAU
    }
  }

  // Charger les services et les catégories
  useEffect(() => {
    const loadServices = async () => {
      try {
        // Charger les services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (servicesError) throw servicesError;

        // Charger les catégories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*');

        if (categoriesError) throw categoriesError;

        // Charger le profil utilisateur pour les statistiques
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('total_spent')
            .eq('id', user.id)
            .maybeSingle();

          setTotalSpent(profile?.total_spent || 0);
        }

        // Organiser les catégories
        const categoriesMap = {};
        categoriesData.forEach(category => {
          categoriesMap[category.id] = {
            name: category.name,
            subcategories: category.subcategories || []
          };
        });

        setServices(servicesData);
        setCategories(categoriesMap);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [user, toast]);

  // Charger le nombre de commandes
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return

      try {
        // Charger le nombre de commandes
        const { count, error: orderError } = await supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)

        if (orderError) throw orderError

        setOrderCount(count || 0)
      } catch (error) {
        console.error('Erreur chargement statistiques:', error)
      }
    }

    loadUserStats()
  }, [user])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Bonjour'
    if (hour >= 12 && hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const handleFavorite = (service) => {
    if (isFavorite(service.id)) {
      removeFavorite(service.id)
      toast({
        title: 'Retiré des favoris',
        status: 'info',
        duration: 2000,
        isClosable: true,
      })
    } else {
      addFavorite(service)
      toast({
        title: 'Ajouté aux favoris',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  const handleSubmit = (service) => {
    const newOrder = {
      user_id: service.user_id,
      service_id: service.id,
      amount: service.price,
      status: 'pending'
    };

    try {
      const order = addOrder(newOrder);
      toast({
        title: 'Commande créée',
        description: 'Votre commande a été créée avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Fonction de filtrage améliorée
  const filteredServices = services.filter((service) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      service.name?.toLowerCase().includes(searchLower) ||
      service.service_number?.toLowerCase().includes(searchLower) ||
      service.description?.toLowerCase().includes(searchLower)

    const matchesCategory = !selectedCategory || service.category_id === selectedCategory

    const matchesSubcategory = !selectedSubcategory || service.subcategory === selectedSubcategory

    return matchesSearch && matchesCategory && matchesSubcategory
  })

  const availableSubcategories = selectedCategory
    ? categories[selectedCategory]?.subcategories || []
    : []

  if (loading) {
    return <LoadingSpinner message="Chargement des services..." />
  }

  return (
    <Box bg={pageBg} minH="100vh">
      <Container maxW="container.xl" pt={2} pb={4}>
        <Stack spacing={3}>
          {/* Header Section */}
          <Flex justify="space-between" align="center" mb={4}>
            <Stack spacing={1}>
              <Heading size="2xl" color={headingColor}>Nos Services</Heading>
              <Text fontSize="lg" color={textColor}>
                Découvrez notre gamme complète de services numériques
              </Text>
            </Stack>
            <ButtonGroup size="sm" isAttached variant="outline">
              <IconButton
                icon={<Icon as={FaTh} />}
                aria-label="Vue grille"
                onClick={() => setViewMode('grid')}
                colorScheme={viewMode === 'grid' ? 'blue' : 'gray'}
              />
              <IconButton
                icon={<Icon as={FaList} />}
                aria-label="Vue liste"
                onClick={() => setViewMode('list')}
                colorScheme={viewMode === 'list' ? 'blue' : 'gray'}
              />
            </ButtonGroup>
          </Flex>

          {/* Stats Section - Only shown when user is logged in */}
          {user && (
            <Box 
              bg={bg} 
              p={{ base: 2, md: 4 }}
              borderRadius="lg"
              boxShadow="sm"
            >
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 4 }}>
                <Box 
                  p={{ base: 2, md: 3 }} 
                  bg={inputBg} 
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={2}>
                    <Circle 
                      size={{ base: "28px", md: "32px" }} 
                      bg={`${getLevelColor(getUserLevel(totalSpent))}.100`}
                      color={`${getLevelColor(getUserLevel(totalSpent))}.500`}
                    >
                      <Icon as={FaTrophy} boxSize={{ base: 3, md: 3.5 }} />
                    </Circle>
                    <VStack spacing={0} align="start">
                      <Text fontSize={{ base: "2xs", md: "xs" }} color={textColor}>Statut du compte</Text>
                      <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} color={headingColor}>
                        {getUserLevel(totalSpent)}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box 
                  p={{ base: 2, md: 3 }} 
                  bg={inputBg} 
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={2}>
                    <Circle size={{ base: "28px", md: "32px" }} bg="blue.100" color="blue.500">
                      <Icon as={FaShoppingBag} boxSize={{ base: 3, md: 3.5 }} />
                    </Circle>
                    <VStack spacing={0} align="start">
                      <Text fontSize={{ base: "2xs", md: "xs" }} color={textColor}>Commandes</Text>
                      <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} color={headingColor}>{orderCount}</Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box 
                  p={{ base: 2, md: 3 }} 
                  bg={inputBg} 
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={2}>
                    <Circle size={{ base: "28px", md: "32px" }} bg="green.100" color="green.500">
                      <Icon as={FaWallet} boxSize={{ base: 3, md: 3.5 }} />
                    </Circle>
                    <VStack spacing={0} align="start">
                      <Text fontSize={{ base: "2xs", md: "xs" }} color={textColor}>Solde</Text>
                      <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} color={headingColor}>{balance} XFA</Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box 
                  p={{ base: 2, md: 3 }} 
                  bg={inputBg} 
                  borderRadius="lg"
                  boxShadow="sm"
                  border="1px"
                  borderColor={borderColor}
                >
                  <HStack spacing={2}>
                    <Circle size={{ base: "28px", md: "32px" }} bg="purple.100" color="purple.500">
                      <Icon as={FaChartLine} boxSize={{ base: 3, md: 3.5 }} />
                    </Circle>
                    <VStack spacing={0} align="start">
                      <Text fontSize={{ base: "2xs", md: "xs" }} color={textColor}>Dépenses</Text>
                      <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} color={headingColor}>{totalSpent} XFA</Text>
                    </VStack>
                  </HStack>
                </Box>
              </SimpleGrid>
            </Box>
          )}
          {/* Search and Filter Section */}
          <Stack
            direction={{ base: 'column', md: 'row' }}
            spacing={4}
            mb={6}
          >
            <InputGroup size="lg" maxW={{ base: "full", md: "md" }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Rechercher un service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={inputBg}
                borderRadius="lg"
              />
              {searchQuery && (
                <InputRightElement>
                  <IconButton
                    size="sm"
                    icon={<FaTimes />}
                    onClick={() => setSearchQuery('')}
                    variant="ghost"
                    aria-label="Clear search"
                  />
                </InputRightElement>
              )}
            </InputGroup>

            <Select
              placeholder="Catégorie"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedSubcategory('')
              }}
              size="lg"
              bg={inputBg}
              borderRadius="lg"
            >
              {Object.entries(categories).map(([id, category]) => (
                <option key={id} value={id}>
                  {category.name}
                </option>
              ))}
            </Select>

            {selectedCategory && availableSubcategories.length > 0 && (
              <Select
                placeholder="Sous-catégorie"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                size="lg"
                bg={inputBg}
                borderRadius="lg"
              >
                {availableSubcategories.map((subcategory, index) => (
                  <option key={index} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </Select>
            )}
          </Stack>

          {/* Services Grid */}
          {viewMode === 'grid' ? (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onFavoriteToggle={() => handleFavorite(service)}
                  isFavorite={isFavorite(service.id)}
                  viewMode={viewMode}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Stack spacing={4}>
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onFavoriteToggle={() => handleFavorite(service)}
                  isFavorite={isFavorite(service.id)}
                  viewMode={viewMode}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

export default Services
