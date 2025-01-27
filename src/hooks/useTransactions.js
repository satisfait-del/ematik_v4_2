import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '@chakra-ui/react'

export function useTransactions() {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const createRechargeTransaction = useCallback(async (amount, transactionIdUser) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'recharge',
          amount,
          transaction_id_user: transactionIdUser,
          status: 'en_cours'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      toast({
        title: "Erreur lors de la création de la transaction",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  const getUserTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      toast({
        title: "Erreur lors de la récupération des transactions",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return []
    } finally {
      setLoading(false)
    }
  }, [toast])

  const updateTransactionStatus = useCallback(async (transactionId, status) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', transactionId)

      if (error) throw error
      return true
    } catch (error) {
      toast({
        title: "Erreur lors de la mise à jour de la transaction",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    loading,
    createRechargeTransaction,
    getUserTransactions,
    updateTransactionStatus
  }
}
