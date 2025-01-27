import {
  Container,
  Stack,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Button,
  Image,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
  useToast,
  Badge,
  Collapse,
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  CircularProgress,
  CircularProgressLabel,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { FaMoneyBillWave, FaCopy, FaPhone } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase';

const paymentMethods = [
  {
    id: 'momopay',
    name: 'MoMo Pay',
    logo: 'https://example.com/momopay-logo.png',
    minAmount: 2000,
    maxAmount: 50000,
    merchantId: '136667',
    available: true,
    fees: 0.05, // 5% de frais
    instructions: [
      'Tapez *150*1# sur votre téléphone',
      'Sélectionnez l\'option "Paiement"',
      'Insérez l\'identifiant Merchant : 136667',
      'Entrez le montant à payer',
      'Confirmez avec votre code PIN secret',
      'Vous recevrez un SMS de confirmation avec votre ID de transaction',
      '⚠️ IMPORTANT : Copiez l\'ID de transaction reçu par SMS et collez-le ci-dessous'
    ],
  },
  {
    id: 'noupia',
    name: 'Noupia',
    logo: 'https://example.com/noupia-logo.png',
    minAmount: 1000,
    maxAmount: 50000,
    accountId: '053318784',
    available: true,
    fees: 0.05, // 5% de frais
    instructions: [
      'Ouvrez votre application Noupia',
      'Sélectionnez "Transfert d\'argent"',
      'Entrez le numéro de compte : 053318784',
      'Entrez le montant à transférer',
      'Confirmez le transfert avec votre code PIN',
      'Vous recevrez une notification de confirmation avec l\'ID de transaction',
      '⚠️ IMPORTANT : Copiez l\'ID de transaction de la notification et collez-le ci-dessous'
    ],
  },
  {
    id: 'binance',
    name: 'Binance Pay',
    logo: 'https://example.com/binance-logo.png',
    minAmount: 100,
    maxAmount: 500000,
    available: false,
    comingSoon: true,
    instructions: [
      'Utilisez Binance Pay pour le transfert',
      'ID du marchand sera bientôt disponible',
      'La transaction sera confirmée automatiquement',
    ],
  },
]

const PaymentMethodCard = ({ method, onSelect, isSelected }) => {
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorderColor = 'blue.500'
  const hoverBorderColor = 'blue.300'
  const toast = useToast()

  const handleClick = () => {
    if (!method.available) {
      toast({
        title: 'Méthode non disponible',
        description: 'Cette méthode de paiement n\'est pas encore disponible. Elle sera bientôt accessible !',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    onSelect(method)
  }

  return (
    <Card
      bg={cardBg}
      borderWidth={2}
      borderColor={isSelected ? selectedBorderColor : borderColor}
      cursor={method.available ? "pointer" : "not-allowed"}
      onClick={handleClick}
      opacity={method.available ? 1 : 0.7}
      _hover={{ 
        borderColor: method.available ? (isSelected ? selectedBorderColor : hoverBorderColor) : borderColor,
        transform: method.available ? 'translateY(-2px)' : 'none',
        boxShadow: method.available ? 'lg' : 'none'
      }}
      position="relative"
      transition="all 0.2s"
    >
      <CardBody>
        <VStack spacing={4}>
          <Image
            src={method.logo}
            alt={method.name}
            fallback={
              <Box p={6} bg={isSelected ? 'blue.50' : 'gray.100'} borderRadius="md">
                <FaMoneyBillWave 
                  size="40px" 
                  color={isSelected ? '#3182CE' : 'gray'} 
                />
              </Box>
            }
            boxSize="80px"
            objectFit="contain"
          />
          <VStack spacing={1}>
            <Heading 
              size="md"
              color={isSelected ? 'blue.500' : undefined}
              transition="color 0.2s"
            >
              {method.name}
            </Heading>
            {method.available ? (
              <VStack spacing={0}>
                <Text fontSize="sm" color="gray.500">
                  Min: {method.minAmount.toLocaleString()} FCFA - Max: {method.maxAmount.toLocaleString()} FCFA
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Frais: 5%
                </Text>
              </VStack>
            ) : (
              <Badge colorScheme="purple">Bientôt disponible</Badge>
            )}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

const AddFunds = () => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [amount, setAmount] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [countdown, setCountdown] = useState(600) // 10 minutes en secondes
  const countdownInterval = useRef(null)
  const toast = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let timer;
    if (isConfirmModalOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isConfirmModalOpen, countdown])

  useEffect(() => {
    if (countdown === 0) {
      setIsConfirmModalOpen(false)
      toast({
        title: 'Temps écoulé',
        description: 'Le temps pour confirmer votre transaction est écoulé. Veuillez réessayer.',
        status: 'error',
        duration: 5000,
      })
    }
  }, [countdown])

  const handleCopyReference = (text) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Référence copiée',
      status: 'success',
      duration: 2000,
    })
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedMethod) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une méthode de paiement',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (!amount || amount <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un montant valide',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setIsConfirmModalOpen(true)
    setCountdown(600)
  }

  const handleConfirmTransaction = async () => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour effectuer cette opération',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      setIsLoading(true)

      // Créer la transaction avec le statut en_cours
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'recharge',
          status: 'en_cours',
          amount: parseFloat(amount),
          payment_method: selectedMethod?.id || null,
          description: `Recharge de ${amount} FCFA`,
          transaction_user_id: transactionId || null,
          telephone: phoneNumber || null,
          payment_details: {
            method: selectedMethod?.id || null,
            methodName: selectedMethod?.name || null,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        throw transactionError;
      }

      toast({
        title: 'Paiement en cours',
        description: `Votre paiement de ${amount} FCFA est en cours de traitement. Veuillez patienter entre 1 à 5 minutes.`,
        status: 'info',
        duration: 10000,
        isClosable: true,
      })

      setIsConfirmModalOpen(false)
      navigate('/services')
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la transaction. Veuillez réessayer.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <VStack align="start" spacing={2}>
          <Heading size="lg">Ajouter des fonds</Heading>
          <Text color="gray.500">
            Choisissez votre méthode de paiement préférée pour recharger votre compte
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSelect={setSelectedMethod}
              isSelected={selectedMethod?.id === method.id}
            />
          ))}
        </SimpleGrid>

        <Collapse in={selectedMethod !== null} animateOpacity>
          <Card>
            <CardHeader>
              <Heading size="md">
                Paiement via {selectedMethod?.name}
                <Badge ml={2} colorScheme="brand">
                  En attente
                </Badge>
              </Heading>
            </CardHeader>
            <CardBody>
              <Stack spacing={6}>
                <FormControl isRequired>
                  <FormLabel>Montant à recharger (FCFA)</FormLabel>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Min: ${selectedMethod?.minAmount.toLocaleString()} FCFA - Max: ${selectedMethod?.maxAmount.toLocaleString()} FCFA`}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Numéro de téléphone</FormLabel>
                  <InputGroup>
                    <InputLeftAddon children="+242" />
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        // Ne garder que les chiffres et limiter à 9 caractères
                        const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                        setPhoneNumber(value)
                      }}
                      placeholder="066XXXXXX"
                    />
                  </InputGroup>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Exemple: 066944200
                  </Text>
                </FormControl>

                <Button
                  colorScheme="blue"
                  onClick={handleSubmit}
                  isDisabled={!selectedMethod || !amount || !phoneNumber}
                >
                  Recharger maintenant
                </Button>
              </Stack>
            </CardBody>
          </Card>
        </Collapse>
      </Stack>

      <Modal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmation de la transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.500">Montant</Text>
                  <Text fontSize="2xl" fontWeight="bold">{parseInt(amount).toLocaleString()} FCFA</Text>
                  <Text fontSize="sm" color="gray.500">Frais (5%)</Text>
                  <Text fontSize="md" fontWeight="bold">{Math.round(parseInt(amount) * 0.05).toLocaleString()} FCFA</Text>
                  <Text fontSize="sm" color="gray.500" mt={2}>Total à payer</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {(parseInt(amount) + Math.round(parseInt(amount) * 0.05)).toLocaleString()} FCFA
                  </Text>
                </VStack>
                <VStack align="center" spacing={0}>
                  <CircularProgress
                    value={(countdown / 600) * 100}
                    size="80px"
                    thickness="4px"
                    color={countdown < 120 ? "red.400" : "blue.400"}
                  >
                    <CircularProgressLabel>{formatTime(countdown)}</CircularProgressLabel>
                  </CircularProgress>
                  <Text fontSize="xs" color={countdown < 120 ? "red.400" : "gray.500"}>
                    {countdown < 120 ? "Temps restant limité !" : "Temps restant"}
                  </Text>
                </VStack>
              </HStack>

              <Box 
                borderWidth="1px" 
                borderRadius="lg" 
                p={4} 
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <VStack align="start" spacing={4}>
                  <Heading size="sm">Instructions de paiement :</Heading>
                  {selectedMethod?.instructions.map((instruction, index) => (
                    <HStack 
                      key={index} 
                      spacing={3} 
                      alignItems="flex-start"
                    >
                      <Box
                        minW="24px"
                        h="24px"
                        borderRadius="full"
                        bg={useColorModeValue('blue.500', 'blue.400')}
                        color="white"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="sm"
                        fontWeight="bold"
                      >
                        {index + 1}
                      </Box>
                      <Text flex={1}>
                        {instruction}
                        {(instruction.includes('136667') || instruction.includes('053318784')) && (
                          <Button
                            size="xs"
                            ml={2}
                            leftIcon={<FaCopy />}
                            onClick={() => handleCopyReference(
                              instruction.includes('136667') ? '136667' : '053318784'
                            )}
                            colorScheme="blue"
                            variant="ghost"
                          >
                            Copier
                          </Button>
                        )}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              <FormControl isRequired>
                <FormLabel>ID de transaction (reçu par SMS)</FormLabel>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Collez ici l'ID de transaction reçu par SMS"
                />
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={handleConfirmTransaction}
                isDisabled={!transactionId || isLoading}
                w="full"
                size="lg"
              >
                Confirmer la transaction
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default AddFunds
