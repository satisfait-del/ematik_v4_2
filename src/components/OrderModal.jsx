import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormHelperText,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useOrders } from '../context/OrderContext'
import { useBalance } from '../context/BalanceContext'
import { useNavigate } from 'react-router-dom'

const OrderModal = ({ isOpen, onClose, service }) => {
  const [inputValue, setInputValue] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addOrder } = useOrders()
  const { balance, deductFunds } = useBalance()
  const navigate = useNavigate()
  const toast = useToast()

  const totalPrice = service.price * quantity
  console.log('Prix total:', totalPrice, 'Solde actuel:', balance)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) {
      console.log('Soumission déjà en cours, ignorée')
      return
    }

    setIsSubmitting(true)

    try {
      // Valider l'input en fonction du type
      if (service.input_type === 'email' && !inputValue.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Veuillez entrer une adresse email valide')
      }
      if (service.input_type === 'telephone' && !inputValue.match(/^\+?[0-9]{8,15}$/)) {
        throw new Error('Veuillez entrer un numéro de téléphone valide')
      }
      if (service.input_type === 'url' && !inputValue.match(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/)) {
        throw new Error('Veuillez entrer une URL valide')
      }

      // Vérifier le solde
      if (balance < totalPrice) {
        toast({
          title: 'Solde insuffisant',
          description: 'Votre solde est insuffisant pour cette commande. Vous allez être redirigé vers la page de rechargement.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        navigate('/add-funds');
        return;
      }

      // Déduire le solde
      const deductionSuccess = await deductFunds(totalPrice);
      if (!deductionSuccess) {
        throw new Error('Erreur lors du débit du solde');
      }

      // Créer la commande avec les bonnes données en fonction du type d'input
      const orderData = {
        service,
        quantity,
        totalPrice
      }

      // Ajouter la valeur d'input avec la bonne clé selon le type
      if (service.input_type === 'email') {
        orderData.email = inputValue
      } else if (service.input_type === 'telephone') {
        orderData.telephone = inputValue
      } else if (service.input_type === 'url') {
        orderData.url = inputValue
      } else if (service.input_type === 'text') {
        orderData.username = inputValue
      }

      console.log('1. Envoi de la commande avec les données:', orderData)
      const result = await addOrder(orderData)
      console.log('2. Commande créée:', result)

      if (!result?.id) {
        // En cas d'erreur, rembourser le solde
        await deductFunds(-totalPrice);
        console.error('3. Données manquantes dans la réponse:', result)
        throw new Error('Erreur: Données de commande incomplètes')
      }

      console.log('4. Commande créée avec succès:', result)
      toast({
        title: 'Commande passée avec succès',
        description: `Votre commande #${result.id} a été créée avec succès et est en cours de traitement.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      onClose()
      setQuantity(1)
      setInputValue('')
    } catch (error) {
      console.error('5. Erreur dans OrderModal:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de la commande',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fonction pour obtenir le type d'input HTML approprié
  const getInputType = () => {
    switch (service.input_type) {
      case 'email':
        return 'email'
      case 'telephone':
        return 'tel'
      case 'url':
        return 'url'
      default:
        return 'text'
    }
  }

  // Fonction pour obtenir le placeholder approprié
  const getPlaceholder = () => {
    switch (service.input_type) {
      case 'email':
        return 'exemple@email.com'
      case 'telephone':
        return '+123456789'
      case 'url':
        return 'https://exemple.com'
      case 'text':
        return 'Votre nom d\'utilisateur'
      default:
        return ''
    }
  }

  // Fonction pour obtenir le label approprié
  const getLabel = () => {
    switch (service.input_type) {
      case 'email':
        return 'Adresse email'
      case 'telephone':
        return 'Numéro de téléphone'
      case 'url':
        return 'URL'
      case 'text':
        return 'Nom d\'utilisateur'
      default:
        return 'Valeur'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Commander {service.name}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Quantité</FormLabel>
                <NumberInput
                  min={service.minQuantity || 1}
                  max={service.maxQuantity || 100}
                  value={quantity}
                  onChange={(value) => setQuantity(Number(value))}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              {service.input_type && (
                <FormControl isRequired>
                  <FormLabel>{getLabel()}</FormLabel>
                  <Input
                    type={getInputType()}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={getPlaceholder()}
                  />
                  {service.instructions && (
                    <FormHelperText>
                      {service.instructions}
                    </FormHelperText>
                  )}
                </FormControl>
              )}

              <HStack justify="space-between" width="100%" pt={2}>
                <Text>Prix total :</Text>
                <Text fontWeight="bold" fontSize="lg" color="blue.500">
                  {totalPrice.toLocaleString()} FCFA
                </Text>
              </HStack>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={isSubmitting}
              loadingText="Commande en cours..."
            >
              Commander
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default OrderModal
