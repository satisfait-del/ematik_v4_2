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

  const formatDuration = (value, type) => {
    if (!value || !type) return 'Non spécifié';
    if (type === 'lifetime') return 'À vie';
    const unit = type === 'days' ? 'jours' : type === 'months' ? 'mois' : 'années';
    return `${value} ${unit}`;
  };

  const formatDeliveryTime = (value, type) => {
    if (!value || !type) return 'Non spécifié';
    const unit = type === 'minutes' ? 'min' : 'h';
    return `${value}${unit}`;
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
          size="sm"
        >
          <Flex direction="row">
            <Box position="relative" minW="70px" maxW="70px">
              <Image
                src={getImageUrl(service)}
                alt={service.name}
                height="50px"
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
                p={0.5}
              >
                <Flex justify="space-between" width="100%" align="start">
                  <VStack align="start" spacing={0.5}>
                    <Badge colorScheme="blue" fontSize="3xs" px={1} py={0.5}>{service.category}</Badge>
                    <Badge colorScheme="gray" fontSize="3xs" px={1} py={0.5}>{service.subcategory}</Badge>
                  </VStack>
                  <IconButton
                    icon={<FaHeart size="10px" />}
                    variant={isFavorite ? 'solid' : 'outline'}
                    colorScheme="pink"
                    size="xs"
                    minW="20px"
                    height="20px"
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    onClick={() => onFavoriteToggle(service)}
                  />
                </Flex>
                
                <Flex justify="space-between" align="end" width="100%">
                  <VStack align="start" spacing={0.5}>
                    <HStack spacing={0.5}>
                      <Icon as={FaClock} color="white" boxSize={1.5} />
                      <Text fontSize="2xs" color="white" fontWeight="bold">
                        {formatDeliveryTime(service.delivery_time_value, service.delivery_time_type)}
                      </Text>
                    </HStack>
                    <HStack spacing={0.5}>
                      <Icon as={FaClock} color="white" boxSize={1.5} />
                      <Text fontSize="2xs" color="white" fontWeight="bold">
                        {formatDuration(service.duration_value, service.duration_type)}
                      </Text>
                    </HStack>
                  </VStack>
                  <Text color="white" fontSize="2xs" fontWeight="bold">
                    {service.price} FCFA
                  </Text>
                </Flex>
              </Box>
            </Box>

            <Box flex="1" p={1.5}>
              <VStack align="stretch" spacing={0.5}>
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color={textColor}
                  noOfLines={1}
                  width="100%"
                >
                  {service.name}
                </Text>

                <Text color={textColor} fontSize="sm" noOfLines={1}>
                  {service.description}
                </Text>

                <Flex 
                  width="100%" 
                  justify="space-between" 
                  align="center"
                >
                  <HStack spacing={1} ml={2}>
                    <Button
                      leftIcon={<FaShoppingCart size="12px" />}
                      colorScheme="blue"
                      size="sm"
                      height="24px"
                      fontSize="xs"
                      px={2}
                      onClick={handleOrderClick}
                    >
                      Commander
                    </Button>
                  </HStack>
                </Flex>
              </VStack>
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
                <Badge colorScheme="gray" fontSize="xs">{service.subcategory}</Badge>
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
          <VStack align="stretch" spacing={2}>
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
            >
              Commander
            </Button>
          </VStack>
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
