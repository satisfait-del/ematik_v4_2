import { createContext, useContext, useState } from 'react'
import { useBalance } from './BalanceContext'
import { useToast } from '@chakra-ui/react'
import { supabase } from '../lib/supabase'

const OrderContext = createContext()

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([])
  const { addFunds } = useBalance()
  const toast = useToast()

  const addOrder = async (orderData) => {
    try {
      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Créer la commande avec le statut en_cours
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'en_cours',
          total_amount: orderData.totalPrice,
          input_value: orderData.email || orderData.telephone || orderData.url || orderData.username,
          service: orderData.service
        })
        .select()
        .single()

      if (orderError) {
        console.error('Erreur création commande:', orderError)
        throw new Error(`Erreur création commande: ${orderError.message}`)
      }

      if (!order) {
        throw new Error('Commande non créée')
      }

      // Récupérer la transaction associée
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select()
        .eq('order_id', order.id)
        .single()

      if (transactionError) {
        console.error('Erreur récupération transaction:', transactionError)
      }

      // Mettre à jour l'état local
      const newOrder = {
        ...order,
        transaction,
        service: orderData.service
      }
      
      setOrders(prevOrders => [newOrder, ...prevOrders])
      return newOrder
    } catch (error) {
      console.error('Erreur dans addOrder:', error)
      throw error
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.id === orderId) {
            return { ...order, status: newStatus }
          }
          return order
        })
      )

      if (newStatus === 'terminé') {
        toast({
          title: 'Commande terminée',
          description: `La commande #${orderId} a été marquée comme terminée`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrders = () => {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrders doit être utilisé dans un OrderProvider')
  }
  return context
}
