import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
  Divider,
  Text,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';

const AdminSettings = () => {
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Paramètres généraux */}
        <Card bg={bgColor}>
          <CardBody>
            <Heading size="md" mb={6}>Paramètres généraux</Heading>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <FormLabel mb={0}>Mode maintenance</FormLabel>
                  <Text fontSize="sm" color="gray.500">
                    Activer le mode maintenance rendra le site inaccessible aux utilisateurs
                  </Text>
                </Box>
                <Switch colorScheme="brand" />
              </FormControl>

              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <FormLabel mb={0}>Notifications par email</FormLabel>
                  <Text fontSize="sm" color="gray.500">
                    Recevoir des notifications pour les nouvelles transactions
                  </Text>
                </Box>
                <Switch colorScheme="brand" defaultChecked />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Paramètres de paiement */}
        <Card bg={bgColor}>
          <CardBody>
            <Heading size="md" mb={6}>Paramètres de paiement</Heading>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Clé API MoMo Pay</FormLabel>
                <Input type="password" placeholder="••••••••••••••••" />
              </FormControl>

              <FormControl>
                <FormLabel>Clé secrète MoMo Pay</FormLabel>
                <Input type="password" placeholder="••••••••••••••••" />
              </FormControl>

              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <FormLabel mb={0}>Mode test</FormLabel>
                  <Text fontSize="sm" color="gray.500">
                    Utiliser l'environnement de test pour les paiements
                  </Text>
                </Box>
                <Switch colorScheme="brand" />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Sécurité */}
        <Card bg={bgColor}>
          <CardBody>
            <Heading size="md" mb={6}>Sécurité</Heading>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Mot de passe administrateur</FormLabel>
                <Input type="password" placeholder="Nouveau mot de passe" />
              </FormControl>

              <FormControl>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <Input type="password" placeholder="Confirmer le mot de passe" />
              </FormControl>

              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <FormLabel mb={0}>Authentification à deux facteurs</FormLabel>
                  <Text fontSize="sm" color="gray.500">
                    Activer l'authentification à deux facteurs pour plus de sécurité
                  </Text>
                </Box>
                <Switch colorScheme="brand" />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        <HStack justify="flex-end" spacing={4}>
          <Button variant="ghost">Annuler</Button>
          <Button colorScheme="brand">Enregistrer les modifications</Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default AdminSettings;
