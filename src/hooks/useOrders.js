import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useOrders() {
  const [loading, setLoading] = useState(false)

  const addOrder = async (orderData) => {
    try {
      setLoading(true)
      console.log('1. Début de création de commande avec les données:', orderData)

      // Vérifier l'authentification
      const authResponse = await supabase.auth.getUser()
      console.log('2. Réponse auth:', authResponse)

      if (!authResponse.data?.user) {
        console.error('3. Erreur: Utilisateur non authentifié')
        throw new Error('Non authentifié')
      }

      const user = authResponse.data.user
      console.log('4. Utilisateur authentifié:', user)

      // Préparer les données de transaction
      const transactionData = {
        user_id: user.id,
        type: 'achat',
        amount: orderData.totalPrice,
        status: 'en_cours',
        description: `Commande de ${orderData.service.name}`,
        transaction_user_id: user.id
      }
      console.log('5. Données transaction à insérer:', transactionData)

      // Vérifier la structure de la table transactions
      const { data: transactionFields, error: fieldsError } = await supabase
        .from('transactions')
        .select()
        .limit(1)
      console.log('6. Structure table transactions:', { fields: transactionFields, error: fieldsError })

      // Créer la transaction
      const transactionResponse = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
      console.log('7. Réponse création transaction:', transactionResponse)

      if (transactionResponse.error) {
        console.error('8. Erreur création transaction:', transactionResponse.error)
        throw new Error(`Erreur création transaction: ${transactionResponse.error.message}`)
      }

      const transaction = transactionResponse.data?.[0]
      if (!transaction) {
        console.error('9. Transaction non créée, pas de données retournées')
        throw new Error('Transaction non créée')
      }
      console.log('10. Transaction créée:', transaction)

      // Préparer les données de commande
      const orderInsertData = {
        user_id: user.id,
        status: 'en_cours',
        total_amount: orderData.totalPrice,
        transaction_id: transaction.id,
        input_value: orderData.email || orderData.telephone || orderData.url || orderData.username
      }
      console.log('11. Données commande à insérer:', orderInsertData)

      // Vérifier la structure de la table orders
      const { data: orderFields, error: orderFieldsError } = await supabase
        .from('orders')
        .select()
        .limit(1)
      console.log('12. Structure table orders:', { fields: orderFields, error: orderFieldsError })

      // Créer la commande
      const orderResponse = await supabase
        .from('orders')
        .insert(orderInsertData)
        .select()
      console.log('13. Réponse création commande:', orderResponse)

      if (orderResponse.error) {
        console.error('14. Erreur création commande:', orderResponse.error)
        throw new Error(`Erreur création commande: ${orderResponse.error.message}`)
      }

      const order = orderResponse.data?.[0]
      if (!order) {
        console.error('15. Commande non créée, pas de données retournées')
        throw new Error('Commande non créée')
      }
      console.log('16. Commande créée:', order)

      console.log('17. Opération terminée avec succès:', { order, transaction })
      return { order, transaction }
    } catch (error) {
      console.error('18. Erreur complète:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    addOrder
  }
}
