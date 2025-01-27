import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '@chakra-ui/react';

export const useServices = (categoryId = null) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchServices();
  }, [categoryId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('services')
        .select(`
          *,
          categories (*),
          reviews (
            rating,
            comment,
            created_at,
            profiles (
              username,
              avatar_url
            )
          )
        `);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculer la note moyenne pour chaque service
      const servicesWithAverageRating = data.map(service => ({
        ...service,
        averageRating: service.reviews.length > 0
          ? service.reviews.reduce((acc, review) => acc + review.rating, 0) / service.reviews.length
          : 0
      }));

      setServices(servicesWithAverageRating);
    } catch (error) {
      setError(error.message);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les services',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const addService = async (serviceData) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select()
        .single();

      if (error) throw error;

      setServices(prev => [...prev, data]);
      toast({
        title: 'Succès',
        description: 'Service ajouté avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return data;
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error;
    }
  };

  const updateService = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setServices(prev =>
        prev.map(service => (service.id === id ? data : service))
      );

      toast({
        title: 'Succès',
        description: 'Service mis à jour avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return data;
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error;
    }
  };

  const deleteService = async (id) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.filter(service => service.id !== id));
      toast({
        title: 'Succès',
        description: 'Service supprimé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error;
    }
  };

  return {
    services,
    loading,
    error,
    addService,
    updateService,
    deleteService,
    refreshServices: fetchServices
  };
};
