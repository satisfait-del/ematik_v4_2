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
import { handleError } from '../../utils/errorHandler';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      if (!name.trim()) {
        throw new Error('Le nom est requis');
      }

      // 1. Créer l'utilisateur avec le nom dans les metadata
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name // Stocké dans la table auth.users
          }
        }
      });

      if (signUpError) throw signUpError;

      // 2. Attendre que l'utilisateur soit créé
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Créer le profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            full_name: name,
            has_completed_onboarding: false
          }
        ]);

      // Ignorer l'erreur si le profil existe déjà
      if (profileError && !profileError.message.includes('duplicate key')) {
        throw profileError;
      }

      // 4. Créer l'entrée onboarding_data
      const { error: onboardingError } = await supabase
        .from('onboarding_data')
        .insert([
          {
            user_id: user.id,
            step_completed: 0
          }
        ]);

      if (onboardingError) throw onboardingError;

      toast({
        title: 'Inscription réussie',
        description: 'Votre compte a été créé avec succès',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate('/onboarding');
    } catch (error) {
      handleError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', user.id)
        .single();

      // Rediriger vers la page appropriée
      if (!profile.has_completed_onboarding) {
        navigate('/onboarding');
      } else {
        navigate('/services');
      }
    } catch (error) {
      handleError(error, toast);
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
    setConfirmPassword('');
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
            <form onSubmit={isLogin ? handleSignIn : handleSignUp}>
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
                {!isLogin && (
                  <FormControl isRequired>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                )}
                <Button
                  type="submit"
                  bgGradient="linear(to-r, blue.400, teal.400)"
                  color="white"
                  size="lg"
                  fontSize="md"
                  isLoading={loading}
                  _hover={{ bgGradient: "linear(to-r, teal.400, blue.400)" }}
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
