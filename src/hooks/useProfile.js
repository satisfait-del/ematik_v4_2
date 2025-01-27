import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '@chakra-ui/react'

export function useProfile() {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) return null
      return data
    } catch (error) {
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) return null

      toast({
        title: "Profil mis à jour",
        description: "Vos modifications ont été enregistrées avec succès",
        status: "success",
        duration: 3000,
        isClosable: true,
      })

      return data
    } catch (error) {
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  const uploadProfileImage = useCallback(async (file) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/profile.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true })

      if (uploadError) return null

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ image: publicUrl })
        .eq('id', user.id)

      if (updateError) return null

      return publicUrl
    } catch (error) {
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    loading,
    getProfile,
    updateProfile,
    uploadProfileImage
  }
}
