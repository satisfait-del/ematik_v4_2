import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  useToast,
  Progress,
  Card,
  CardBody,
  SimpleGrid,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FaStore, 
  FaUser, 
  FaUsers, 
  FaClock, 
  FaCalendarAlt, 
  FaCalendarWeek, 
  FaPlay,
  FaTv,
  FaRocket,
  FaMoneyBillWave,
  FaPalette,
  FaRobot
} from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { handleError } from '../utils/errorHandler';

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    businessType: '',
    usageFrequency: '',
    preferredServices: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Charger les données d'onboarding existantes
    const loadOnboardingData = async () => {
      try {
        const { data, error } = await supabase
          .from('onboarding_data')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          // Ne pas afficher d'erreur si les données n'existent pas encore
          if (!error.message.includes('JSON object requested') && 
              !error.message.includes('contains 0 rows')) {
            console.error('Erreur lors du chargement des données:', error);
            toast({
              title: "Erreur",
              description: "Impossible de charger vos données d'onboarding",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
          return;
        }

        if (data) {
          setSelections({
            businessType: data.business_type || '',
            usageFrequency: data.usage_frequency || '',
            preferredServices: data.preferred_services || []
          });
          setCurrentStep(data.step_completed || 0);
        }
      } catch (error) {
        // Ne pas afficher d'erreur pour les cas normaux
        if (!error.message?.includes('JSON object requested') && 
            !error.message?.includes('contains 0 rows')) {
          console.error('Erreur lors du chargement des données:', error);
        }
      }
    };

    loadOnboardingData();
  }, [user, navigate, toast]);

  const businessTypes = [
    { id: 'personal', label: 'Personnel', icon: FaUser },
    { id: 'business', label: 'Entreprise', icon: FaStore },
    { id: 'creator', label: 'Créateur de contenu', icon: FaUsers },
  ];

  const frequencies = [
    { id: 'daily', label: 'Quotidien', icon: FaClock },
    { id: 'weekly', label: 'Hebdomadaire', icon: FaCalendarWeek },
    { id: 'monthly', label: 'Mensuel', icon: FaCalendarAlt },
  ];

  const services = [
    { id: 'netflix', label: 'Netflix', icon: FaPlay },
    { id: 'iptv', label: 'IPTV', icon: FaTv },
    { id: 'boost', label: 'Boost', icon: FaRocket },
    { id: 'monetisation', label: 'Monétisation', icon: FaMoneyBillWave },
    { id: 'canva', label: 'Canva Pro', icon: FaPalette },
    { id: 'chatgpt', label: 'ChatGPT', icon: FaRobot }
  ];

  const steps = [
    {
      title: 'Type d\'utilisation',
      description: 'Comment comptez-vous utiliser nos services ?',
      options: businessTypes,
      key: 'businessType',
      multiSelect: false,
    },
    {
      title: 'Fréquence d\'utilisation',
      description: 'À quelle fréquence utiliserez-vous nos services ?',
      options: frequencies,
      key: 'usageFrequency',
      multiSelect: false,
    },
    {
      title: 'Services préférés',
      description: 'Quels types de services vous intéressent ?',
      options: services,
      key: 'preferredServices',
      multiSelect: true,
    },
  ];

  const handleSelection = (key, value) => {
    setSelections(prev => {
      if (steps[currentStep].multiSelect) {
        const currentSelections = prev[key];
        
        // Si la valeur est déjà sélectionnée, la retirer
        if (currentSelections.includes(value)) {
          return {
            ...prev,
            [key]: currentSelections.filter(v => v !== value)
          };
        }
        
        // Si on a déjà 3 sélections et qu'on essaie d'en ajouter une nouvelle
        if (currentSelections.length >= 3) {
          toast({
            title: 'Maximum 3 services',
            description: 'Vous ne pouvez sélectionner que 3 services maximum',
            status: 'warning',
            duration: 3000,
            isClosable: true,
          });
          return prev;
        }
        
        // Ajouter la nouvelle sélection
        return {
          ...prev,
          [key]: [...currentSelections, value]
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleNext = async () => {
    try {
      setLoading(true);
      const currentKey = steps[currentStep].key;
      
      if (!selections[currentKey] || 
          (Array.isArray(selections[currentKey]) && selections[currentKey].length === 0)) {
        toast({
          title: 'Sélection requise',
          description: 'Veuillez faire une sélection pour continuer',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Mettre à jour les données d'onboarding
      const { error: updateError } = await supabase
        .from('onboarding_data')
        .upsert({
          user_id: user.id,
          step_completed: currentStep + 1,
          business_type: selections.businessType,
          usage_frequency: selections.usageFrequency,
          preferred_services: selections.preferredServices
        });

      if (updateError) throw updateError;

      if (currentStep === steps.length - 1) {
        // Mettre à jour le profil comme complété
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ has_completed_onboarding: true })
          .eq('id', user.id);

        if (profileError) throw profileError;

        navigate('/services');
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } catch (error) {
      // Utiliser le gestionnaire d'erreurs centralisé
      handleError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const currentStepData = steps[currentStep];

  return (
    <Container maxW="container.sm" py={10}>
      <Progress value={(currentStep + 1) * (100 / steps.length)} mb={8} colorScheme="blue" />
      
      <Box p={6} bg={useColorModeValue('white', 'gray.800')} rounded="lg" shadow="base">
        <VStack spacing={8} align="stretch">
          <VStack spacing={2} textAlign="center" mb={6}>
            <Heading size="lg">{currentStepData.title}</Heading>
            <Text color="gray.500">{currentStepData.description}</Text>
            {currentStepData.key === 'preferredServices' && (
              <Text fontSize="sm" color="blue.500">
                Sélectionnez entre 1 et 3 services
              </Text>
            )}
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            {currentStepData.options.map((option) => (
              <Card
                key={option.id}
                cursor="pointer"
                onClick={() => handleSelection(currentStepData.key, option.id)}
                bg={
                  currentStepData.multiSelect
                    ? selections[currentStepData.key].includes(option.id) ? 'blue.500' : useColorModeValue('white', 'gray.800')
                    : selections[currentStepData.key] === option.id ? 'blue.500' : useColorModeValue('white', 'gray.800')
                }
                color={
                  currentStepData.multiSelect
                    ? selections[currentStepData.key].includes(option.id) ? 'white' : 'inherit'
                    : selections[currentStepData.key] === option.id ? 'white' : 'inherit'
                }
                borderWidth="1px"
                borderColor={useColorModeValue('gray.200', 'gray.600')}
                _hover={{ borderColor: 'blue.500', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <CardBody>
                  <VStack spacing={4}>
                    <Icon as={option.icon} boxSize={8} />
                    <Text fontWeight="bold">{option.label}</Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <HStack justify="space-between" mt={6}>
            <Button
              onClick={handleBack}
              isDisabled={currentStep === 0}
              variant="ghost"
            >
              Retour
            </Button>
            <Button
              onClick={handleNext}
              colorScheme="blue"
              isLoading={loading}
            >
              {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Container>
  );
};

export default Onboarding;
