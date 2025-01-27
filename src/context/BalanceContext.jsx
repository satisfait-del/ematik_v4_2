import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '@chakra-ui/react'

const BalanceContext = createContext()

export const BalanceProvider = ({ children }) => {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const toast = useToast()

  const loadBalance = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setBalance(0)
        return
      }

      setUserId(user.id)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single()

      if (error) throw error

      console.log('Balance chargée:', profile.balance)
      setBalance(profile.balance || 0)
    } catch (error) {
      console.error('Erreur chargement balance:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger votre solde',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  // Charger le solde au démarrage
  useEffect(() => {
    loadBalance()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        loadBalance()
      } else {
        setUserId(null)
        setBalance(0)
      }
    })

    // Écouter les changements de profil
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: userId ? `id=eq.${userId}` : undefined
        },
        () => {
          loadBalance()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      profileSubscription.unsubscribe()
    }
  }, [userId])

  const deductFunds = async (amount) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Vérifier le solde actuel
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const currentBalance = currentProfile.balance || 0
      console.log('Solde actuel:', currentBalance, 'Montant à déduire:', amount)
      
      if (currentBalance < amount) {
        throw new Error('Solde insuffisant')
      }

      // Mettre à jour le solde
      const { data, error } = await supabase
        .from('profiles')
        .update({ balance: currentBalance - amount })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      console.log('Nouveau solde après déduction:', data.balance)
      setBalance(data.balance)
      return true
    } catch (error) {
      console.error('Erreur déduction solde:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de débiter votre solde',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const addFunds = async (amount) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Récupérer le solde actuel
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const currentBalance = currentProfile.balance || 0
      const newBalance = currentBalance + amount

      const { data, error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      console.log('Nouveau solde après ajout:', data.balance)
      setBalance(data.balance)
      return true
    } catch (error) {
      console.error('Erreur ajout solde:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter les fonds',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <BalanceContext.Provider value={{ 
      balance, 
      loading, 
      loadBalance, 
      addFunds,
      deductFunds
    }}>
      {children}
    </BalanceContext.Provider>
  )
}

export const useBalance = () => {
  const context = useContext(BalanceContext)
  if (!context) {
    throw new Error('useBalance doit être utilisé dans un BalanceProvider')
  }
  return context
}
