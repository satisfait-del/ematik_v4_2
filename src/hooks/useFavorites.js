import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '@chakra-ui/react'

export const useFavorites = () => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const toast = useToast()

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, services(*)')
        .eq('user_id', user.id)

      if (error) throw error

      setFavorites(data.map(f => f.services))
    } catch (error) {
      console.error('Error loading favorites:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos favoris",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const addFavorite = useCallback(async (service) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour ajouter des favoris",
        status: "info",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          service_id: service.id
        })

      if (error) throw error

      setFavorites(prev => [...prev, service])
      toast({
        title: "Ajouté aux favoris",
        status: "success",
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error adding favorite:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter aux favoris",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }, [user, toast])

  const removeFavorite = useCallback(async (serviceId) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('service_id', serviceId)

      if (error) throw error

      setFavorites(prev => prev.filter(service => service.id !== serviceId))
      toast({
        title: "Retiré des favoris",
        status: "success",
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error removing favorite:', error)
      toast({
        title: "Erreur",
        description: "Impossible de retirer des favoris",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  }, [user, toast])

  const isFavorite = useCallback((serviceId) => {
    return favorites.some(service => service.id === serviceId)
  }, [favorites])

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    loading
  }
}
