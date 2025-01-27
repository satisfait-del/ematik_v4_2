import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '@chakra-ui/react'

export const useSpending = () => {
  const [totalSpent, setTotalSpent] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const toast = useToast()

  useEffect(() => {
    if (user) {
      loadTotalSpent()
    } else {
      setTotalSpent(0)
      setLoading(false)
    }
  }, [user])

  const loadTotalSpent = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_spent')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setTotalSpent(data?.total_spent || 0)
    } catch (error) {
      console.error('Error loading total spent:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos dépenses totales",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    totalSpent,
    loading,
    refresh: loadTotalSpent
  }
}
