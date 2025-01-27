import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Container,
  Card,
  CardBody,
  Text,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        toast({
          title: 'Connexion réussie',
          status: 'success',
          duration: 3000,
        });
        navigate('/em-ad');
      } else {
        toast({
          title: 'Erreur de connexion',
          description: 'Identifiants invalides',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        status: 'error',
        duration: 3000,
      });
    }

    setIsLoading(false);
  };

  return (
    <Box minH="100vh" py={20} bg="gray.50">
      <Container maxW="lg">
        <VStack spacing={8}>
          <Heading>Administration</Heading>
          <Text color="gray.600">Connectez-vous pour accéder au panneau d'administration</Text>
          
          <Card w="full">
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Entrez votre nom d'utilisateur"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Mot de passe</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Entrez votre mot de passe"
                      />
                      <InputRightElement>
                        <IconButton
                          icon={showPassword ? <FiEyeOff /> : <FiEye />}
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Masquer' : 'Afficher'}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                  >
                    Se connecter
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;
