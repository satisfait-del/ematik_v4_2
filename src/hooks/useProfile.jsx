import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../config/supabaseClient'
import { useToast } from '@chakra-ui/react'

// Cache global pour stocker les profils
const profileCache = new Map()

export const useProfile = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(() => {
    // Initialiser avec les données du cache si disponibles
    return user?.id ? profileCache.get(user.id) : null
  })
  const toast = useToast()

  const getProfile = useCallback(async () => {
    try {
      setError(null)

      if (!user?.id) {
        setProfile(null)
        return null
      }

      // Vérifier si les données sont dans le cache et pas trop anciennes (5 minutes)
      const cachedData = profileCache.get(user.id)
      if (cachedData && (Date.now() - cachedData.timestamp) < 5 * 60 * 1000) {
        setProfile(cachedData.data)
        return cachedData.data
      }

      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // Ne pas afficher d'erreur si l'utilisateur est déconnecté
        if (!user?.id) return null;
        
        setError(error)
        return null
      }

      // Mettre à jour le cache avec les nouvelles données
      const newCacheData = {
        data,
        timestamp: Date.now()
      }
      profileCache.set(user.id, newCacheData)
      setProfile(data)
      return data
    } catch (error) {
      console.error('Error in getProfile:', error)
      if (user?.id) {
        setError(error)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Nettoyer le profil lors de la déconnexion
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setError(null)
      setLoading(false)
    }
  }, [user])

  const updateProfile = useCallback(async (updates) => {
    try {
      setError(null)
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        setError(error)
        return null
      }

      // Mettre à jour le cache avec les nouvelles données
      const newCacheData = {
        data,
        timestamp: Date.now()
      }
      profileCache.set(user.id, newCacheData)
      setProfile(data)

      // Afficher uniquement le message de succès
      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées avec succès",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      return data
    } catch (error) {
      console.error('Error in updateProfile:', error)
      if (user?.id) {
        setError(error)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  const uploadAvatar = useCallback(async (file) => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) throw new Error('User not authenticated')

      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl }, error: urlError } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (urlError) throw urlError

      // Mettre à jour le profil avec la nouvelle URL de l'avatar
      return await updateProfile({ avatar_url: publicUrl })
    } catch (error) {
      console.error('Error in uploadAvatar:', error)
      if (user?.id) {
        setError(error)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [user, updateProfile])

  // Fonction pour récupérer tous les profils (pour l'admin)
  const getAllProfiles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .returns()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error in getAllProfiles:', error)
      if (user?.id) {
        setError(error)
      }
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger le profil au montage si l'utilisateur est connecté
  useEffect(() => {
    if (user && (!profile || Date.now() - profileCache.get(user.id)?.timestamp > 5 * 60 * 1000)) {
      getProfile()
    }
  }, [user, getProfile, profile])

  // Nettoyer le cache lors de la déconnexion
  useEffect(() => {
    if (!user) {
      profileCache.clear()
      setProfile(null)
    }
  }, [user])

  return {
    profile,
    loading,
    error,
    getProfile,
    updateProfile,
    uploadAvatar,
    getAllProfiles
  }
}
