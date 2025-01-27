import React, { useState, useEffect } from 'react';
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
  VStack,
  HStack,
  useToast,
  Text,
  Textarea,
  IconButton,
  Badge,
  Image,
  Flex,
  SimpleGrid,
  useDisclosure,
  List,
  ListItem,
  Link,
  InputGroup,
  InputRightElement,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
} from '@chakra-ui/react';
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiUpload, FiX, FiLink } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

const TipModal = ({ isOpen, onClose, tip = null, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const toast = useToast();

  useEffect(() => {
    if (tip) {
      setTitle(tip.title || '');
      setContent(tip.content || '');
      setCategory(tip.category || '');
      setImageUrl(tip.image_url || '');
      setLinks(tip.links || []);
    } else {
      setTitle('');
      setContent('');
      setCategory('');
      setImageUrl('');
      setLinks([]);
    }
  }, [tip]);

  const handleImageUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      console.log('Starting image upload:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('L\'image ne doit pas dépasser 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP');
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading file:', fileName);

      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      console.log('Setting image URL to:', publicUrl);
      setImageUrl(publicUrl);

      toast({
        title: 'Image téléchargée avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      toast({
        title: 'Erreur lors du téléchargement',
        description: error.message || 'Une erreur est survenue lors du téléchargement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !content || !category) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const tipData = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      image_url: imageUrl,
      links: links
    };

    await onSubmit(tipData);
  };

  const addLink = () => {
    if (newLink.title && newLink.url) {
      setLinks([...links, { ...newLink }]);
      setNewLink({ title: '', url: '' });
    }
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{tip ? 'Modifier l\'astuce' : 'Ajouter une astuce'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Titre</FormLabel>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de l'astuce"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Contenu</FormLabel>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contenu de l'astuce"
                  minH="200px"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Catégorie</FormLabel>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Catégorie de l'astuce"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Image</FormLabel>
                <Box position="relative">
                  {imageUrl && (
                    <Box mb={2}>
                      <Image
                        src={imageUrl}
                        alt="Preview"
                        maxH="200px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                      <IconButton
                        icon={<FiX />}
                        position="absolute"
                        top={2}
                        right={2}
                        onClick={() => setImageUrl('')}
                        aria-label="Supprimer l'image"
                      />
                    </Box>
                  )}
                  <Button
                    leftIcon={<FiUpload />}
                    onClick={() => document.getElementById('image-upload').click()}
                    isLoading={uploading}
                    w="full"
                  >
                    {imageUrl ? 'Changer l\'image' : 'Ajouter une image'}
                  </Button>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    display="none"
                  />
                </Box>
              </FormControl>

              <FormControl>
                <FormLabel>Liens</FormLabel>
                <VStack spacing={2} align="stretch">
                  <HStack>
                    <Input
                      placeholder="Titre du lien"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    />
                    <Input
                      placeholder="URL"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    />
                    <IconButton
                      icon={<FiPlus />}
                      onClick={addLink}
                      aria-label="Ajouter un lien"
                    />
                  </HStack>
                  {links.length > 0 && (
                    <List spacing={2}>
                      {links.map((link, index) => (
                        <ListItem key={index}>
                          <Flex justify="space-between" align="center">
                            <Link href={link.url} isExternal color="blue.500">
                              {link.title}
                            </Link>
                            <IconButton
                              icon={<FiX />}
                              size="sm"
                              onClick={() => removeLink(index)}
                              aria-label="Supprimer le lien"
                            />
                          </Flex>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={uploading}
            >
              {tip ? 'Modifier' : 'Ajouter'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

const AdminTips = () => {
  const [tips, setTips] = useState([]);
  const [selectedTip, setSelectedTip] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchTips = async () => {
    try {
      const { data, error } = await supabase
        .from('tips_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTips(data || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
      toast({
        title: 'Erreur lors du chargement des astuces',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const handleAddEdit = async (values) => {
    try {
      console.log('=== Starting Tip Save ===');
      console.log('Current values:', values);

      let result;
      if (selectedTip) {
        console.log('Updating tip with ID:', selectedTip.id);
        result = await supabase
          .from('tips')
          .update(values)
          .eq('id', selectedTip.id)
          .select();
      } else {
        console.log('Inserting new tip');
        result = await supabase
          .from('tips')
          .insert([values])
          .select();
      }

      console.log('Database operation result:', result);

      if (result.error) {
        console.error('Database error:', result.error);
        throw result.error;
      }

      console.log('Operation successful. Data:', result.data);

      toast({
        title: `Astuce ${selectedTip ? 'modifiée' : 'ajoutée'} avec succès`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setSelectedTip(null);
      fetchTips();
    } catch (error) {
      console.error('Error in handleAddEdit:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      toast({
        title: 'Erreur lors de la sauvegarde',
        description: error.message || 'Une erreur est survenue lors de la sauvegarde',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (tip) => {
    setSelectedTip(tip);
    onOpen();
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('tips_view')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Astuce supprimée avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchTips();
    } catch (error) {
      console.error('Error deleting tip:', error);
      toast({
        title: 'Erreur lors de la suppression',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Astuces</Heading>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={() => {
            setSelectedTip(null);
            onOpen();
          }}
        >
          Ajouter une astuce
        </Button>
      </HStack>

      <Box overflowX="auto">
        <Table variant="simple" minWidth="800px">
          <Thead>
            <Tr>
              <Th>Image</Th>
              <Th>Titre</Th>
              <Th>Catégorie</Th>
              <Th>Contenu</Th>
              <Th>Liens</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tips.map((tip) => (
              <Tr key={tip.id}>
                <Td>
                  {tip.image_url && (
                    <Image
                      src={tip.image_url}
                      alt={tip.title}
                      boxSize="50px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  )}
                </Td>
                <Td>{tip.title}</Td>
                <Td>
                  <Badge colorScheme="blue">{tip.category}</Badge>
                </Td>
                <Td maxW="300px" isTruncated>{tip.content}</Td>
                <Td>
                  {tip.links && tip.links.length > 0 && (
                    <HStack spacing={2}>
                      {tip.links.map((link, index) => (
                        <Link
                          key={index}
                          href={link.url}
                          isExternal
                          color="blue.500"
                          fontSize="sm"
                        >
                          {link.title}
                        </Link>
                      ))}
                    </HStack>
                  )}
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      icon={<FiEdit2 />}
                      aria-label="Modifier"
                      size="sm"
                      onClick={() => handleEdit(tip)}
                    />
                    <IconButton
                      icon={<FiTrash2 />}
                      aria-label="Supprimer"
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(tip.id)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <TipModal
        isOpen={isOpen}
        onClose={onClose}
        tip={selectedTip}
        onSubmit={handleAddEdit}
      />
    </Box>
  );
};

export default AdminTips;
