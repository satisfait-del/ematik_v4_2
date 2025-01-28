import {
  Box,
  Button,
  Heading,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Icon,
  Tooltip,
  useDisclosure,
  Image,
  Badge,
  Card,
  CardBody,
  IconButton,
  Flex,
  useToast
} from '@chakra-ui/react'
import { FaHeart, FaShoppingCart, FaHashtag, FaClock } from 'react-icons/fa'
import OrderModal from './OrderModal'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ServiceCard = ({ service, onFavoriteToggle, isFavorite, viewMode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const headingColor = useColorModeValue('gray.700', 'white')

  const formatDuration = (duration, durationType) => {
    if (durationType === 'lifetime') return 'À vie';
    
    const value = parseInt(duration);
    switch (durationType) {
      case 'days':
        return `${value} ${value > 1 ? 'jours' : 'jour'}`;
      case 'months':
        return `${value} ${value > 1 ? 'mois' : 'mois'}`;
      case 'years':
        return `${value} ${value > 1 ? 'années' : 'année'}`;
      default:
        return duration;
    }
  };

  const formatDeliveryTime = (value, type) => {
    if (!value || !type) return 'Non spécifié';
    const unit = type === 'minutes' ? 'min' : 'h';
    return `${value}${unit}`;
  };

  const formatServiceNumber = (id) => {
    // Prendre les 5 derniers caractères et les compléter avec des zéros si nécessaire
    const idString = id.toString();
    const last5 = idString.slice(-5);
    return last5.padStart(5, '0');
  };

  const defaultImage = 'https://via.placeholder.com/400x300?text=Service+Image';

  const getImageUrl = (service) => {
    return service.image_url || defaultImage;
  };

  const handleOrderClick = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour commander ce service",
        status: "info",
        duration: 3000,
        isClosable: true,
      })
      navigate('/auth')
      return
    }
    onOpen()
  }

  if (viewMode === 'list') {
    return (
      <>
        <Card
          overflow="hidden"
          variant="outline"
          bg={bg}
          borderColor={borderColor}
          maxW="100%"
          _hover={{ 
            shadow: 'md',
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          <Flex direction="row" align="center">
            <Box position="relative" minW="100px" maxW="100px" height="70px">
              <Image
                src={getImageUrl(service)}
                alt={service.name}
                height="100%"
                width="100%"
                objectFit="cover"
                fallbackSrc={defaultImage}
              />
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                bg="blackAlpha.700"
                py={1}
                px={2}
              >
                <Text
                  color="white"
                  fontSize="xs"
                  fontWeight="bold"
                  textAlign="center"
                >
                  #{formatServiceNumber(service.id)}
                </Text>
              </Box>
              <IconButton
                icon={<FaHeart />}
                variant={isFavorite ? 'solid' : 'ghost'}
                colorScheme="red"
                size="sm"
                position="absolute"
                top={2}
                right={2}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                onClick={() => onFavoriteToggle(service)}
                opacity={0.8}
                _hover={{ opacity: 1 }}
              />
            </Box>

            <Box flex="1" p={3}>
              <Flex direction="column" height="100%" justify="space-between">
                <Flex justify="space-between" align="center" mb={2}>
                  <Text
                    color={headingColor}
                    fontSize="sm"
                    fontWeight="bold"
                    noOfLines={1}
                    flex="1"
                  >
                    {service.name}
                  </Text>
                  <Text
                    color="blue.500"
                    fontSize="lg"
                    fontWeight="bold"
                    ml={4}
                  >
                    {service.price} FCFA
                  </Text>
                </Flex>

                <Flex justify="space-between" align="center">
                  <HStack spacing={4} flex="1">
                    <HStack spacing={1}>
                      <Icon as={FaClock} color={textColor} boxSize={3} />
                      <Text fontSize="xs" color={textColor}>
                        {formatDeliveryTime(service.delivery_time_value, service.delivery_time_type)}
                      </Text>
                    </HStack>
                    <HStack spacing={1}>
                      <Icon as={FaHashtag} color={textColor} boxSize={3} />
                      <Text fontSize="xs" color={textColor}>
                        {formatDuration(service.duration_value, service.duration_type)}
                      </Text>
                    </HStack>
                  </HStack>
                  <Button
                    leftIcon={<FaShoppingCart size="12px" />}
                    colorScheme="blue"
                    size="xs"
                    ml={2}
                    onClick={handleOrderClick}
                    _hover={{
                      transform: 'scale(1.05)',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    Commander
                  </Button>
                </Flex>

                <Badge colorScheme="blue" fontSize="xs" mt={2} width="fit-content">
                  {service.category}
                </Badge>
              </Flex>
            </Box>
          </Flex>
        </Card>

        <OrderModal
          isOpen={isOpen}
          onClose={onClose}
          service={service}
        />
      </>
    )
  }

  // Grid View
  return (
    <>
      <Card
        overflow="hidden"
        variant="outline"
        bg={bg}
        borderColor={borderColor}
        maxW="100%"
        size="md"
      >
        <Box position="relative">
          <Image
            src={getImageUrl(service)}
            alt={service.name}
            height="120px"
            width="100%"
            objectFit="cover"
            fallbackSrc={defaultImage}
          />
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="blackAlpha.600"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            p={1.5}
          >
            <Flex justify="space-between" width="100%" align="start">
              <VStack align="start" spacing={1}>
                <Badge colorScheme="blue" fontSize="xs">{service.category}</Badge>
                <Text fontSize="xs" color="white" fontWeight="bold">#{formatServiceNumber(service.id)}</Text>
              </VStack>
              <IconButton
                icon={<FaHeart size="16px" />}
                variant={isFavorite ? 'solid' : 'outline'}
                colorScheme="pink"
                size="sm"
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                onClick={() => onFavoriteToggle(service)}
              />
            </Flex>

            <Flex justify="space-between" align="end" width="100%" pl={1} pr={2}>
              <VStack align="start" spacing={1}>
                <HStack spacing={1}>
                  <Icon as={FaClock} color="white" boxSize={2.5} />
                  <Text fontSize="sm" color="white" fontWeight="bold">
                    {formatDeliveryTime(service.delivery_time_value, service.delivery_time_type)}
                  </Text>
                </HStack>
                <HStack spacing={1}>
                  <Icon as={FaClock} color="white" boxSize={2.5} />
                  <Text fontSize="sm" color="white" fontWeight="bold">
                    {formatDuration(service.duration_value, service.duration_type)}
                  </Text>
                </HStack>
              </VStack>
              <Text color="white" fontSize="md" fontWeight="bold">
                {service.price} FCFA
              </Text>
            </Flex>
          </Box>
        </Box>

        <CardBody p={3}>
          <VStack align="start" spacing={1}>
            <Heading size="sm" color={headingColor}>
              {service.name}
            </Heading>
            <Text fontSize="sm" color={textColor} noOfLines={2}>
              {service.description}
            </Text>
          </VStack>

          <Button
            leftIcon={<FaShoppingCart />}
            colorScheme="blue"
            size="sm"
            onClick={handleOrderClick}
            width="100%"
            mt={2}
          >
            Commander
          </Button>
        </CardBody>
      </Card>

      <OrderModal
        isOpen={isOpen}
        onClose={onClose}
        service={service}
      />
    </>
  )
}

export default ServiceCard
