import {
  Container,
  Box,
  Stack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Avatar,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
  Card,
  CardBody,
  Text,
  useToast,
  IconButton,
  InputGroup,
  InputRightElement,
  Input as ChakraInput,
  Badge,
  Icon,
  Spinner,
  Center,
  Flex
} from '@chakra-ui/react'
import { useState, useRef } from 'react'
import { FaCamera, FaKey, FaEye, FaEyeSlash, FaUserCircle, FaPhone, FaCalendarAlt, FaWallet } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import LoadingSpinner from '../components/LoadingSpinner'

const Profile = () => {
  const { user } = useAuth()
  const { profile, loading, updateProfile, uploadProfileImage } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.700')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { error } = await updateProfile(formData)
      if (error) throw error

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été mises à jour avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la mise à jour',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setIsUploadingAvatar(true)
      try {
        const imageUrl = await uploadProfileImage(file)
        if (imageUrl) {
          toast({
            title: 'Avatar mis à jour',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        }
      } catch (error) {
        toast({
          title: 'Erreur',
          description: "Erreur lors du téléchargement de l'avatar",
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } finally {
        setIsUploadingAvatar(false)
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await updateProfile({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      if (error) throw error;

      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été modifié avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsChangingPassword(false);
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors du changement de mot de passe',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement de votre profil..." />
  }

  return (
    <Container maxW="container.md" py={8}>
      <Stack spacing={8}>
        <Card bg={bgColor}>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Flex 
                justify="space-between" 
                direction={{ base: "column", sm: "row" }}
                gap={4}
              >
                <Heading size="lg">Mon Profil</Heading>
                {!isEditing && (
                  <Button
                    colorScheme="blue"
                    onClick={() => setIsEditing(true)}
                    width={{ base: "100%", sm: "auto" }}
                  >
                    Modifier
                  </Button>
                )}
              </Flex>

              <Stack 
                direction={{ base: "column", md: "row" }}
                spacing={6} 
                align={{ base: "center", md: "start" }}
                w="100%"
              >
                <VStack>
                  <Avatar
                    size={{ base: "xl", md: "2xl" }}
                    name={profile?.full_name}
                    src={profile?.image}
                  />
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <IconButton
                        size="sm"
                        icon={<FaCamera />}
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={isUploadingAvatar}
                        aria-label="Changer l'avatar"
                      />
                    </>
                  )}
                </VStack>

                <VStack align="stretch" flex={1} spacing={4} w="100%">
                  {!isEditing ? (
                    <>
                      <Stack spacing={4} direction={{ base: "column", sm: "column" }} w="100%">
                        <HStack>
                          <Icon as={FaUserCircle} color="blue.500" />
                          <Text fontWeight="bold" minW="120px">Nom complet:</Text>
                          <Text>{profile?.full_name}</Text>
                        </HStack>

                        <HStack>
                          <Icon as={FaPhone} color="green.500" />
                          <Text fontWeight="bold" minW="120px">Téléphone:</Text>
                          <Text>{profile?.phone_number || 'Non renseigné'}</Text>
                        </HStack>

                        <HStack>
                          <Icon as={FaWallet} color="purple.500" />
                          <Text fontWeight="bold" minW="120px">Solde:</Text>
                          <Text>{profile?.balance?.toLocaleString('fr-FR')} XFA</Text>
                        </HStack>

                        <HStack>
                          <Icon as={FaCalendarAlt} color="orange.500" />
                          <Text fontWeight="bold" minW="120px">Membre depuis:</Text>
                          <Text>
                            {profile?.created_at
                              ? format(new Date(profile.created_at), "d MMMM yyyy", { locale: fr })
                              : 'Non disponible'}
                          </Text>
                        </HStack>

                        <HStack>
                          <Text fontWeight="bold" minW="120px">Rôle:</Text>
                          <Badge colorScheme={profile?.role === 'admin' ? 'red' : 'blue'}>
                            {profile?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                          </Badge>
                        </HStack>
                      </Stack>
                    </>
                  ) : (
                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Nom complet</FormLabel>
                          <Input
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Téléphone</FormLabel>
                          <Input
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                          />
                        </FormControl>

                        <Stack 
                          direction={{ base: "column", sm: "row" }}
                          spacing={4} 
                          width="100%"
                        >
                          <Button
                            colorScheme="blue"
                            type="submit"
                            isLoading={isLoading}
                            width={{ base: "100%", sm: "auto" }}
                          >
                            Enregistrer
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsEditing(false)
                              setFormData({
                                full_name: profile?.full_name || '',
                                phone_number: profile?.phone_number || '',
                              })
                            }}
                            width={{ base: "100%", sm: "auto" }}
                          >
                            Annuler
                          </Button>
                        </Stack>
                      </VStack>
                    </form>
                  )}
                </VStack>
              </Stack>
            </VStack>
          </CardBody>
        </Card>

        {/* Section changement de mot de passe */}
        <Card bg={bgColor}>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Flex 
                justify="space-between" 
                direction={{ base: "column", sm: "row" }}
                gap={4}
              >
                <Heading size="md">Sécurité</Heading>
                <Button
                  leftIcon={<FaKey />}
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  variant="outline"
                  width={{ base: "100%", sm: "auto" }}
                >
                  Changer le mot de passe
                </Button>
              </Flex>

              {isChangingPassword && (
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <InputGroup size={{ base: "md", sm: "md" }}>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                      <InputRightElement>
                        <IconButton
                          size="sm"
                          icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Masquer' : 'Afficher'}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <InputGroup size={{ base: "md", sm: "md" }}>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                      <InputRightElement>
                        <IconButton
                          size="sm"
                          icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Masquer' : 'Afficher'}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                    <InputGroup size={{ base: "md", sm: "md" }}>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                      <InputRightElement>
                        <IconButton
                          size="sm"
                          icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Masquer' : 'Afficher'}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Stack 
                    direction={{ base: "column", sm: "row" }}
                    spacing={4}
                  >
                    <Button
                      colorScheme="blue"
                      onClick={handlePasswordChange}
                      isLoading={isLoading}
                      width={{ base: "100%", sm: "auto" }}
                    >
                      Mettre à jour le mot de passe
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsChangingPassword(false)
                        setPasswords({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                      }}
                      width={{ base: "100%", sm: "auto" }}
                    >
                      Annuler
                    </Button>
                  </Stack>
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Stack>
    </Container>
  )
}

export default Profile
