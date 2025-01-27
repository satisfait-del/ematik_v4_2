import {
  Container,
  Stack,
  Heading,
  Text,
  SimpleGrid,
  Card,
  VStack,
  HStack,
  useColorModeValue,
  useToast,
  Box,
  Button,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites'
import ServiceCard from '../components/ServiceCard'
import LoadingSpinner from '../components/LoadingSpinner'

const Favorites = () => {
  const { favorites, removeFavorite, isFavorite, loading } = useFavorites()
  const toast = useToast()
  const bg = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const headingColor = useColorModeValue('gray.700', 'white')

  const handleFavoriteToggle = (service) => {
    removeFavorite(service.id)
    toast({
      title: 'Service retiré des favoris',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  if (loading) {
    return <LoadingSpinner message="Chargement de vos favoris..." />
  }

  return (
    <Box bg={bg} minH="100vh">
      <Container maxW="container.xl" py={8}>
        <Stack spacing={8}>
          <VStack align="start" spacing={2}>
            <HStack spacing={4} align="center">
              <Heading size="lg" color={headingColor}>Mes favoris</Heading>
            </HStack>
            <Text color={textColor}>
              {favorites.length} service{favorites.length !== 1 ? 's' : ''} dans vos favoris
            </Text>
          </VStack>

          {favorites.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {favorites.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onFavoriteToggle={() => handleFavoriteToggle(service)}
                  isFavorite={isFavorite(service.id)}
                  viewMode="grid"
                />
              ))}
            </SimpleGrid>
          ) : (
            <Card p={8} textAlign="center">
              <VStack spacing={4}>
                <Text color={textColor}>Vous n'avez pas encore de services favoris</Text>
                <Button
                  as={RouterLink}
                  to="/services"
                  colorScheme="blue"
                >
                  Découvrir nos services
                </Button>
              </VStack>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

export default Favorites
