import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Stack,
  Badge,
  Link,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  useToast,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  VStack,
} from '@chakra-ui/react'
import { FaExternalLinkAlt, FaSearch, FaFilter } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'

const TipCard = ({ tip }) => {
  const cardBg = useColorModeValue('white', 'gray.700')
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Card
        overflow="hidden"
        variant="outline"
        bg={cardBg}
        _hover={{
          transform: 'translateY(-5px)',
          transition: 'all 0.2s ease-in-out',
          shadow: 'lg',
        }}
      >
        <Image
          src={tip.image_url}
          alt={tip.title}
          height="200px"
          objectFit="cover"
        />
        <CardBody>
          <Stack spacing={3}>
            <Stack direction="row" justify="space-between" align="center">
              <Badge colorScheme="brand">{tip.category}</Badge>
              <Text fontSize="sm" color="gray.500">
                {tip.read_time}
              </Text>
            </Stack>
            <Heading size="md">{tip.title}</Heading>
            <Text color={useColorModeValue('gray.600', 'gray.300')}>
              {tip.excerpt}
            </Text>
            <Link
              color="brand.500"
              fontWeight="semibold"
              onClick={onOpen}
              cursor="pointer"
              _hover={{ textDecoration: 'none', color: 'brand.600' }}
            >
              Lire la suite →
            </Link>
            <Text fontSize="sm" color="gray.500">
              Publié le {new Date(tip.created_at).toLocaleDateString()}
            </Text>
          </Stack>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Stack spacing={2}>
              <Heading size="lg">{tip.title}</Heading>
              <Stack direction="row" align="center" spacing={4}>
                <Badge colorScheme="brand">{tip.category}</Badge>
                <Text fontSize="sm" color="gray.500">
                  {tip.read_time} • Publié le {new Date(tip.created_at).toLocaleDateString()}
                </Text>
              </Stack>
            </Stack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Image
              src={tip.image_url}
              alt={tip.title}
              borderRadius="lg"
              mb={4}
              w="100%"
              h="300px"
              objectFit="cover"
            />
            <Text whiteSpace="pre-line" color={useColorModeValue('gray.700', 'gray.300')}>
              {tip.content}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Stack direction="row" spacing={4} w="100%">
              {tip.links && (
                <Button 
                  as="a" 
                  href={tip.links} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  colorScheme="blue"
                  leftIcon={<Icon as={FaExternalLinkAlt} />}
                >
                  En savoir plus
                </Button>
              )}
              <Button colorScheme="brand" onClick={onClose}>
                Fermer
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

const Tips = () => {
  const [tips, setTips] = useState([])
  const [filteredTips, setFilteredTips] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [categories, setCategories] = useState([])
  const toast = useToast()

  useEffect(() => {
    const loadTips = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('tips')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setTips(data)
        setFilteredTips(data)

        // Extraire les catégories uniques
        const uniqueCategories = [...new Set(data.map(tip => tip.category))].filter(Boolean)
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Erreur chargement des astuces:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les astuces',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } finally {
        setLoading(false)
      }
    }

    loadTips()
  }, [toast])

  // Filtre les astuces en fonction des critères
  useEffect(() => {
    let result = [...tips]

    // Filtre par recherche
    if (searchTerm) {
      result = result.filter(tip => 
        tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tip.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tip.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtre par catégorie
    if (categoryFilter) {
      result = result.filter(tip => tip.category === categoryFilter)
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
        result = result.filter(tip => new Date(tip.created_at) >= today)
        break
      case '30days':
        result = result.filter(tip => new Date(tip.created_at) >= thirtyDaysAgo)
        break
      case '90days':
        result = result.filter(tip => new Date(tip.created_at) >= ninetyDaysAgo)
        break
      default:
        break
    }

    setFilteredTips(result)
  }, [tips, searchTerm, categoryFilter, dateFilter])

  if (loading) {
    return <LoadingSpinner message="Chargement des astuces..." />
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box textAlign="center" py={4}>
          <Heading mb={2}>Astuces et Conseils</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.300')}>
            Découvrez nos articles et guides pour tirer le meilleur parti de nos services
          </Text>
        </Box>

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
              placeholder="Rechercher une astuce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          <Select
            placeholder="Toutes les catégories"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            maxW={{ base: "100%", md: "200px" }}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
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

        {filteredTips.length === 0 ? (
          <VStack spacing={4} align="center" py={8}>
            <Icon as={FaFilter} boxSize={8} color="gray.400" />
            <Text color="gray.500">
              Aucune astuce ne correspond à vos critères de recherche.
            </Text>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredTips.map((tip) => (
              <TipCard key={tip.id} tip={tip} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  )
}

export default Tips
