import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  Switch,
  VStack,
  HStack,
  useToast,
  Text,
  Textarea,
  IconButton,
  Badge,
  Flex,
  Spinner,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ButtonGroup,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  Image,
  AspectRatio,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUpload, FiImage } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const INPUT_TYPES = [
  { value: 'text', label: 'Texte', placeholder: 'Entrez votre texte...' },
  { value: 'number', label: 'Nombre', placeholder: 'Entrez un nombre...' },
  { value: 'email', label: 'Email', placeholder: 'exemple@email.com' },
  { value: 'tel', label: 'Téléphone', placeholder: 'Ex: +33 6 12 34 56 78' },
  { value: 'url', label: 'URL', placeholder: 'https://www.exemple.com' },
  { value: 'textarea', label: 'Zone de texte', placeholder: 'Entrez votre message...' },
];

const ServiceModal = ({ isOpen, onClose, service = null, mode = 'add', onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [durationValue, setDurationValue] = useState('30');
  const [durationType, setDurationType] = useState('days');
  const [deliveryTimeValue, setDeliveryTimeValue] = useState('24');
  const [deliveryTimeType, setDeliveryTimeType] = useState('hours');
  const [instructions, setInstructions] = useState('');
  const [inputType, setInputType] = useState('text');
  const [inputPlaceholder, setInputPlaceholder] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (service && mode === 'edit') {
      setName(service.name || '');
      setDescription(service.description || '');
      setPrice(service.price?.toString() || '');
      setCategoryId(service.category_id || '');
      setIsAvailable(service.is_available || false);
      setImageUrl(service.image_url || '');
      setInstructions(service.instructions || '');
      setInputType(service.input_type || 'text');
      setInputPlaceholder(service.input_placeholder || '');
      setSubcategoryId(service.subcategory || '');
      setDurationType(service.duration_type || 'days');
      setDurationValue(service.duration_value?.toString() || '30');
      setDeliveryTimeType(service.delivery_time_type || 'hours');
      setDeliveryTimeValue(service.delivery_time_value?.toString() || '24');
    }
  }, [service, mode]);

  const getPlaceholder = useCallback((type) => {
    return INPUT_TYPES.find(t => t.value === type)?.placeholder || '';
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les catégories',
          status: 'error',
          duration: 3000,
        });
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    const selectedCategory = categories.find(cat => cat.id === categoryId);
    if (selectedCategory && selectedCategory.subcategories) {
      console.log('Setting subcategories from category:', selectedCategory.subcategories);
      setSubcategories(selectedCategory.subcategories.map(name => ({ id: name, name })));
    } else {
      setSubcategories([]);
    }
  }, [categoryId, categories]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      toast({
        title: 'Erreur',
        description: 'L\'image ne doit pas dépasser 5MB',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `services/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('services')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger l\'image',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !description || !price || !categoryId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      // On ne garde que les champs qui existent dans la base de données
      const serviceData = {
        name,
        description,
        price: parseFloat(price),
        category_id: categoryId,
        is_available: isAvailable,
        image_url: imageUrl || null,
        instructions: instructions || null,
        subcategory: subcategoryId || null,
        duration_type: durationType || null,
        duration_value: durationType === 'lifetime' ? null : (durationValue ? parseInt(durationValue) : null),
        delivery_time_type: deliveryTimeType || null,
        delivery_time_value: deliveryTimeValue ? parseInt(deliveryTimeValue) : null,
        input_type: inputType || null,
        input_placeholder: inputPlaceholder || null
      };

      let result;
      
      if (mode === 'edit' && service?.id) {
        // Mode modification
        const { data, error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id)
          .select();

        if (error) throw error;
        result = data[0];
        
        toast({
          title: 'Succès',
          description: 'Service modifié avec succès',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Mode création
        const { data, error } = await supabase
          .from('services')
          .insert([serviceData])
          .select();

        if (error) throw error;
        result = data[0];
        
        toast({
          title: 'Succès',
          description: 'Service créé avec succès',
          status: 'success',
          duration: 3000,
        });
      }

      onClose();
      if (onSubmit) onSubmit();
      
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: 'Erreur',
        description: mode === 'edit' ? 'Impossible de modifier le service' : 'Impossible de créer le service',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {mode === 'add' ? 'Ajouter un service' : 'Modifier le service'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nom</FormLabel>
              <Input
                placeholder="Nom du service"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Description du service"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Prix (€)</FormLabel>
              <Input
                type="number"
                step="0.01"
                placeholder="Prix du service"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </FormControl>

            <HStack width="100%" spacing={4}>
              <FormControl isRequired flex={1}>
                <FormLabel>Catégorie</FormLabel>
                <Select
                  placeholder="Sélectionner une catégorie"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired flex={1}>
                <FormLabel>Sous-catégorie</FormLabel>
                <Select
                  placeholder="Sélectionner une sous-catégorie"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  isDisabled={!categoryId || subcategories.length === 0}
                >
                  {subcategories.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>
                      {subcat.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            <HStack width="100%" spacing={4}>
              <FormControl isRequired flex={1}>
                <FormLabel>Durée</FormLabel>
                <HStack>
                  {durationType !== 'lifetime' && (
                    <Input
                      type="number"
                      min={1}
                      value={durationValue}
                      onChange={(e) => setDurationValue(e.target.value)}
                      flex={1}
                    />
                  )}
                  <Select
                    value={durationType}
                    onChange={(e) => setDurationType(e.target.value)}
                    width={durationType === 'lifetime' ? "100%" : "120px"}
                  >
                    <option value="days">Jours</option>
                    <option value="months">Mois</option>
                    <option value="years">Années</option>
                    <option value="lifetime">À vie</option>
                  </Select>
                </HStack>
              </FormControl>

              <FormControl isRequired flex={1}>
                <FormLabel>Temps de livraison</FormLabel>
                <HStack>
                  <Input
                    type="number"
                    min={1}
                    value={deliveryTimeValue}
                    onChange={(e) => setDeliveryTimeValue(e.target.value)}
                    flex={1}
                  />
                  <Select
                    value={deliveryTimeType}
                    onChange={(e) => setDeliveryTimeType(e.target.value)}
                    width="120px"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Heures</option>
                    <option value="days">Jours</option>
                  </Select>
                </HStack>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Image</FormLabel>
              {imageUrl && (
                <AspectRatio ratio={16/9} maxH="200px" overflow="hidden" borderRadius="md" mb={4}>
                  <Image
                    src={imageUrl}
                    alt={name}
                    objectFit="cover"
                  />
                </AspectRatio>
              )}
              <Button
                leftIcon={<FiUpload />}
                onClick={() => document.getElementById('file-upload').click()}
                isLoading={uploading}
              >
                Télécharger une image
              </Button>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                display="none"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Instructions</FormLabel>
              <Textarea
                placeholder="Instructions pour l'utilisateur"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                minH="100px"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Type de champ</FormLabel>
              <Select
                value={inputType}
                onChange={(e) => setInputType(e.target.value)}
              >
                {INPUT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Placeholder généré : {getPlaceholder(inputType)}
              </Text>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">Service disponible</FormLabel>
              <Switch
                isChecked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
            </FormControl>

            <Button
              colorScheme="blue"
              mr={3}
              onClick={handleSubmit}
              isLoading={uploading}
              width="100%"
            >
              {mode === 'add' ? 'Ajouter' : 'Modifier'}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [mode, setMode] = useState('add');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Fonction pour rafraîchir la liste des services
  const fetchServices = async () => {
    try {
      // Récupérer les services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          image_url,
          is_available,
          instructions,
          subcategory,
          duration_type,
          duration_value,
          delivery_time_type,
          delivery_time_value,
          input_type,
          input_placeholder,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      // Récupérer les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Combiner les données
      const servicesWithCategories = servicesData.map(service => {
        const category = categoriesData.find(cat => cat.id === service.category_id);
        return {
          ...service,
          category
        };
      });

      setServices(servicesWithCategories);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les services',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les services au montage du composant
  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = () => {
    setSelectedService(null);
    setMode('add');
    onOpen();
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setMode('edit');
    onOpen();
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Le service a été supprimé avec succès',
          status: 'success',
          duration: 3000,
        });

        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le service',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  return (
    <Box p={4}>
      <HStack mb={4} justify="space-between">
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <FiSearch />
          </InputLeftElement>
          <Input
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={handleAddService}
        >
          Ajouter un service
        </Button>
      </HStack>

      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Image</Th>
                <Th>Nom</Th>
                <Th>Description</Th>
                <Th>Prix</Th>
                <Th>Catégorie</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {services
                .filter((service) =>
                  service.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((service) => (
                  <Tr key={service.id}>
                    <Td>
                      <Box
                        width="60px"
                        height="60px"
                        position="relative"
                        overflow="hidden"
                        borderRadius="md"
                      >
                        <Image
                          src={service.image_url || '/placeholder-image.jpg'}
                          alt={service.name}
                          objectFit="cover"
                          width="100%"
                          height="100%"
                          fallback={<Box bg="gray.100" width="100%" height="100%" />}
                        />
                      </Box>
                    </Td>
                    <Td>{service.name}</Td>
                    <Td>{service.description}</Td>
                    <Td>{service.price} €</Td>
                    <Td>{service.category?.name}</Td>
                    <Td>
                      <Badge colorScheme={service.is_available ? 'green' : 'red'}>
                        {service.is_available ? 'Disponible' : 'Indisponible'}
                      </Badge>
                    </Td>
                    <Td>
                      <ButtonGroup variant="solid" size="sm" spacing={3}>
                        <IconButton
                          colorScheme="blue"
                          icon={<FiEdit2 />}
                          aria-label="Modifier"
                          onClick={() => handleEditService(service)}
                        />
                        <IconButton
                          colorScheme="red"
                          icon={<FiTrash2 />}
                          aria-label="Supprimer"
                          onClick={() => handleDeleteService(service.id)}
                        />
                      </ButtonGroup>
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}

      <ServiceModal
        isOpen={isOpen}
        onClose={onClose}
        service={selectedService}
        mode={mode}
        onSubmit={fetchServices}
      />
    </Box>
  );
};

export default AdminServices;
