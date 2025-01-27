import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  VStack,
  Input,
  FormControl,
  FormLabel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  IconButton,
  Text,
  useToast,
  Spinner,
  InputGroup,
  InputLeftElement,
  Select,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronRight } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const CategoryModal = ({ isOpen, onClose, category = null, mode = 'add', onSuccess }) => {
  const [name, setName] = useState('');
  const [subCategories, setSubCategories] = useState(['']);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (category && mode === 'edit') {
      setName(category.name || '');
      setSubCategories(category.subcategories || ['']);
    } else {
      setName('');
      setSubCategories(['']);
    }
  }, [category, mode]);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleSubCategoryChange = (index, value) => {
    const newSubCategories = [...subCategories];
    newSubCategories[index] = value;
    setSubCategories(newSubCategories);
  };

  const addSubCategory = () => {
    setSubCategories([...subCategories, '']);
  };

  const removeSubCategory = (index) => {
    if (subCategories.length > 1) {
      setSubCategories(subCategories.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (!name.trim()) {
        throw new Error('Le nom de la catégorie est requis');
      }

      // Vérifier que toutes les sous-catégories ont un nom
      const validSubCategories = subCategories.filter(sub => sub.trim());
      if (validSubCategories.length === 0) {
        throw new Error('Au moins une sous-catégorie est requise');
      }

      const categoryData = {
        name: name.trim(),
        slug: generateSlug(name),
        subcategories: validSubCategories,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (mode === 'add') {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id);

        if (error) throw error;
      }

      toast({
        title: mode === 'add' ? 'Catégorie créée' : 'Catégorie mise à jour',
        description: `Catégorie "${name}" avec ${validSubCategories.length} sous-catégorie(s)`,
        status: 'success',
        duration: 3000,
      });

      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {mode === 'add' ? 'Ajouter une catégorie' : 'Modifier la catégorie'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Catégorie principale */}
            <FormControl isRequired>
              <FormLabel>Nom de la catégorie</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Recharges"
              />
            </FormControl>

            {/* Sous-catégories */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <FormLabel>Sous-catégories</FormLabel>
                <Button
                  size="sm"
                  leftIcon={<FiPlus />}
                  onClick={addSubCategory}
                >
                  Ajouter
                </Button>
              </HStack>
              
              <VStack spacing={3}>
                {subCategories.map((subCat, index) => (
                  <HStack key={index} width="100%">
                    <Input
                      value={subCat}
                      onChange={(e) => handleSubCategoryChange(index, e.target.value)}
                      placeholder="Nom de la sous-catégorie"
                    />
                    <IconButton
                      icon={<FiTrash2 />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => removeSubCategory(index)}
                      aria-label="Supprimer"
                      isDisabled={subCategories.length === 1}
                    />
                  </HStack>
                ))}
              </VStack>
            </Box>

            <HStack spacing={4} justify="flex-end" width="100%" pt={4}>
              <Button onClick={onClose} isDisabled={loading}>Annuler</Button>
              <Button 
                colorScheme="blue" 
                onClick={handleSubmit}
                isLoading={loading}
              >
                {mode === 'add' ? 'Ajouter' : 'Mettre à jour'}
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mode, setMode] = useState('add');
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Vérifier si l'utilisateur est admin
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile || profile.role !== 'admin') {
        navigate('/');
        toast({
          title: 'Accès refusé',
          description: 'Vous devez être administrateur pour accéder à cette page',
          status: 'error',
          duration: 5000,
        });
      }
    };

    checkAdminAccess();
  }, [user, navigate, toast]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les catégories',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [searchQuery]);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setMode('add');
    onOpen();
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setMode('edit');
    onOpen();
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);

        if (error) throw error;

        toast({
          title: 'Catégorie supprimée',
          status: 'success',
          duration: 3000,
        });

        fetchCategories();
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer la catégorie',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  if (loading && categories.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner />
        <Text mt={4}>Chargement des catégories...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Card mb={6}>
        <CardBody>
          <VStack spacing={6}>
            <HStack justify="space-between" width="100%">
              <Heading size="md">Gestion des catégories</Heading>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                onClick={handleAddCategory}
              >
                Nouvelle catégorie
              </Button>
            </HStack>

            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Rechercher une catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </VStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nom</Th>
                <Th>Sous-catégories</Th>
                <Th>Date de création</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categories.map((category) => (
                <Tr key={category.id}>
                  <Td>{category.name}</Td>
                  <Td>
                    <HStack spacing={2} wrap="wrap">
                      {category.subcategories?.map((subCat, index) => (
                        <Badge key={index} colorScheme="blue">
                          {subCat}
                        </Badge>
                      ))}
                    </HStack>
                  </Td>
                  <Td>{new Date(category.created_at).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<FiEdit2 />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => handleEditCategory(category)}
                        aria-label="Modifier"
                      />
                      <IconButton
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category.id)}
                        aria-label="Supprimer"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {categories.length === 0 && (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">
                Aucune catégorie trouvée
              </Text>
            </Box>
          )}
        </CardBody>
      </Card>

      <CategoryModal
        isOpen={isOpen}
        onClose={onClose}
        category={selectedCategory}
        mode={mode}
        onSuccess={fetchCategories}
      />
    </Box>
  );
};

export default AdminCategories;
