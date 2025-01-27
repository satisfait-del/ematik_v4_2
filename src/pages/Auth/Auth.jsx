import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  useColorModeValue,
  Heading,
  Container,
  Link,
  InputGroup,
  InputRightElement,
  IconButton,
  Stack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useService } from '../../context/ServiceContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import WelcomeLoader from '../../components/WelcomeLoader';
import TransitionLoader from '../../components/TransitionLoader';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcomeLoader, setShowWelcomeLoader] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [showTransition, setShowTransition] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { signIn } = useAuth();
  const { services, fetchServices } = useService();

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Tentative de connexion
        const { error } = await signIn(email, password);
        if (!error) {
          // Rediriger vers la page de transition
          navigate('/transition', { 
            replace: true,
            state: { 
              message: "Bienvenue ! Chargement de vos services...",
              redirectTo: "/services"
            }
          });
        } else {
          throw error;
        }
      } else {
        // Inscription
        const { data: { user }, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (user) {
          setWelcomeMessage(`Bienvenue ${user.email} !`);
          setShowWelcomeLoader(true);
          
          setTimeout(() => {
            setShowWelcomeLoader(false);
            setIsLogin(true);
            setEmail('');
            setPassword('');
          }, 3000);

          toast({
            title: "Inscription réussie",
            description: "Vérifiez votre email pour confirmer votre compte",
            status: "success",
            duration: 5000,
            position: "top",
            isClosable: true,
          });
        }
      }
    } catch (error) {
      toast({
        title: isLogin ? 'Erreur de connexion' : 'Erreur d\'inscription',
        description: error.message,
        status: 'error',
        duration: 5000,
        position: "top",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (showTransition) {
    return <TransitionLoader message="Chargement de vos services..." />;
  }

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setShowPassword(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <WelcomeLoader isOpen={showWelcomeLoader} message={welcomeMessage} />
      <Container maxW="lg" py={12}>
        <Box
          bg={useColorModeValue('white', 'gray.700')}
          p={8}
          rounded="lg"
          boxShadow="lg"
        >
          <Stack spacing={4}>
            <Heading textAlign="center">
              {isLogin ? 'Connexion' : 'Inscription'}
            </Heading>
            <form onSubmit={handleSubmit}>
              <Stack spacing={4}>
                {!isLogin && (
                  <FormControl isRequired>
                    <FormLabel>Nom complet</FormLabel>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                    />
                  </FormControl>
                )}
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Mot de passe</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                        variant="ghost"
                        onClick={togglePasswordVisibility}
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  fontSize="md"
                  isLoading={loading}
                >
                  {isLogin ? 'Se connecter' : "S'inscrire"}
                </Button>
              </Stack>
            </form>
            <Text textAlign="center" mt={4}>
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{' '}
              <Link
                color="blue.500"
                onClick={toggleMode}
                _hover={{ textDecoration: 'underline' }}
                cursor="pointer"
              >
                {isLogin ? "S'inscrire" : "Se connecter"}
              </Link>
            </Text>
          </Stack>
        </Box>
      </Container>
    </>
  );
};

export default Auth;
