import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  VStack,
  Text,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Divider,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiCheck, FiX, FiEye } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

const PaymentModal = ({ isOpen, onClose, payment = null }) => {
  const [rejectionReason, setRejectionReason] = React.useState('');
  const toast = useToast();
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');

  // Constantes pour les statuts de transaction
  const TRANSACTION_STATUS = {
    EN_COURS: 'en_cours',
    REUSSI: 'reussi',
    COMPLETE: 'complete',
    ECHEC: 'echec',
    ANNULE: 'annule'
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      console.log('=== Début de handleUpdateStatus ===');
      console.log('Payment reçu:', payment);
      console.log('Action demandée (newStatus):', newStatus);

      // Vérifier si la transaction a déjà été traitée
      const isProcessed = payment?.type === 'achat' 
        ? payment?.status === TRANSACTION_STATUS.COMPLETE || payment?.status === TRANSACTION_STATUS.ECHEC
        : payment?.status === TRANSACTION_STATUS.REUSSI || payment?.status === TRANSACTION_STATUS.ECHEC;

      console.log('Transaction déjà traitée ?', isProcessed);

      if (isProcessed) {
        toast({
          title: 'Transaction déjà traitée',
          description: 'Cette transaction a déjà été traitée.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        onClose();
        return;
      }

      // Déterminer le statut en fonction du type de transaction
      const finalStatus = payment?.type === 'achat'
        ? (newStatus === 'approve' ? TRANSACTION_STATUS.COMPLETE : TRANSACTION_STATUS.ECHEC)
        : (newStatus === 'approve' ? TRANSACTION_STATUS.REUSSI : TRANSACTION_STATUS.ECHEC);

      console.log('=== Détails du statut ===');
      console.log('Type de transaction:', payment?.type);
      console.log('Action (newStatus):', newStatus);
      console.log('Statut final:', finalStatus);

      const updateData = { 
        status: finalStatus,
        payment_details: {
          ...payment?.payment_details,
          [newStatus === 'approve' ? 'approved_at' : 'rejected_at']: new Date().toISOString(),
          ...(newStatus === 'reject' ? { rejection_reason: rejectionReason } : {})
        }
      };

      console.log('=== Données de mise à jour ===');
      console.log('Update data:', JSON.stringify(updateData, null, 2));

      // Mise à jour du statut de la transaction
      const { data: updateResult, error: transactionError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', payment?.id);

      console.log('=== Résultat de la mise à jour ===');
      if (transactionError) {
        console.error('Erreur de mise à jour:', transactionError);
        console.error('Code erreur:', transactionError.code);
        console.error('Message erreur:', transactionError.message);
        console.error('Détails erreur:', transactionError.details);
        throw transactionError;
      } else {
        console.log('Mise à jour réussie:', updateResult);
      }

      // Si le statut est approuvé et que c'est une recharge, mettre à jour le solde de l'utilisateur
      if (newStatus === 'approve' && payment?.type === 'recharge') {
        console.log('=== Mise à jour du solde ===');
        // Récupérer le solde actuel
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', payment?.user_id)
          .single();

        if (userError) {
          console.error('Erreur récupération solde:', userError);
          throw userError;
        }

        console.log('Solde actuel:', userData.balance);
        // Calculer et mettre à jour le nouveau solde
        const newBalance = (userData.balance || 0) + payment.amount;
        console.log('Nouveau solde:', newBalance);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', payment?.user_id);

        if (updateError) {
          console.error('Erreur mise à jour solde:', updateError);
          throw updateError;
        }
        
        console.log('Solde mis à jour avec succès');
      }

      // Envoyer une notification à l'utilisateur
      console.log('=== Envoi notification ===');
      const notificationData = {
        user_id: payment?.user_id,
        type: newStatus === 'approve' ? 'transaction_approved' : 'transaction_rejected',
        title: newStatus === 'approve' ? 'Paiement approuvé' : 'Paiement rejeté',
        message: newStatus === 'approve' 
          ? `Votre ${payment?.type === 'recharge' ? 'recharge' : 'paiement'} de ${payment.amount} FCFA a été approuvé${payment?.type === 'recharge' ? '. Votre solde a été mis à jour.' : '.'}`
          : `Votre ${payment?.type === 'recharge' ? 'recharge' : 'paiement'} de ${payment.amount} FCFA a été rejeté. Raison: ${rejectionReason}`,
        read: false,
        data: {
          transaction_id: payment.id,
          amount: payment.amount,
          type: payment?.type,
          ...(newStatus === 'reject' ? { rejection_reason: rejectionReason } : {})
        }
      };

      console.log('Données notification:', notificationData);

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationData);

      if (notificationError) {
        console.error('Erreur envoi notification:', notificationError);
      } else {
        console.log('Notification envoyée avec succès');
      }

      toast({
        title: newStatus === 'approve' ? 'Paiement approuvé' : 'Paiement rejeté',
        description: newStatus === 'approve' 
          ? `Le ${payment?.type === 'recharge' ? 'rechargement' : 'paiement'} a été approuvé${payment?.type === 'recharge' ? ' et le solde a été mis à jour.' : '.'}`
          : `Le ${payment?.type === 'recharge' ? 'rechargement' : 'paiement'} a été rejeté.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      console.log('=== Fin de handleUpdateStatus ===');
      onClose();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut du paiement. Veuillez réessayer.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Détails du paiement</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="bold" mb={1}>
                Transaction #{payment?.id}
              </Text>
              <Text color={textColor}>
                ID Utilisateur: {payment?.user_id}
              </Text>
            </Box>

            <Divider borderColor={dividerColor} />

            <Box>
              <Text fontWeight="bold" mb={2}>
                Détails de la transaction
              </Text>
              <Text>Type: {payment?.type}</Text>
              <Text>Montant: {payment?.amount} FCFA</Text>
              <Text>Date: {new Date(payment?.created_at).toLocaleString()}</Text>
              <Text>Téléphone: {payment?.telephone}</Text>
              <Text>Méthode de paiement: {payment?.payment_method}</Text>
              {payment?.transaction_user_id && (
                <Text>ID Transaction utilisateur: {payment?.transaction_user_id}</Text>
              )}
            </Box>

            {payment?.status === TRANSACTION_STATUS.EN_COURS && (
              <>
                <Divider borderColor={dividerColor} />
                
                {/* Zone de raison de rejet */}
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Raison du rejet (optionnel)
                  </Text>
                  <Textarea
                    placeholder="Entrez la raison du rejet..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </Box>

                {/* Boutons d'action */}
                <HStack spacing={4} justify="flex-end">
                  <Button
                    colorScheme="red"
                    onClick={() => handleUpdateStatus('reject')}
                  >
                    Rejeter
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={() => handleUpdateStatus('approve')}
                  >
                    Approuver
                  </Button>
                </HStack>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const AdminPayments = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const toast = useToast();

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'en_cours')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingPayments(data);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paiements en attente',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    onOpen();
  };

  return (
    <Box>
      <Card>
        <CardBody>
          <Heading size="md" mb={6}>Paiements en attente</Heading>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Montant</Th>
                <Th>Téléphone</Th>
                <Th>ID Transaction</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingPayments.map((payment) => (
                <Tr key={payment.id}>
                  <Td>{payment.amount} FCFA</Td>
                  <Td>{payment.telephone}</Td>
                  <Td>{payment.transaction_user_id || '-'}</Td>
                  <Td>{new Date(payment.created_at).toLocaleString()}</Td>
                  <Td>
                    <IconButton
                      icon={<FiEye />}
                      colorScheme="blue"
                      size="sm"
                      onClick={() => handleViewPayment(payment)}
                      aria-label="Voir les détails"
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {pendingPayments.length === 0 && (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">
                Aucun paiement en attente
              </Text>
            </Box>
          )}
        </CardBody>
      </Card>

      <PaymentModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          fetchPendingPayments();
        }}
        payment={selectedPayment}
      />
    </Box>
  );
};

export default AdminPayments;
