// Mapping des erreurs Supabase vers des messages en français
const errorMessages = {
  'auth/invalid-email': 'Adresse e-mail invalide',
  'auth/user-disabled': 'Ce compte a été désactivé',
  'auth/user-not-found': 'Aucun compte ne correspond à cet e-mail',
  'auth/wrong-password': 'Mot de passe incorrect',
  'auth/email-already-in-use': 'Cette adresse e-mail est déjà utilisée',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
  'Database error': 'Erreur de connexion à la base de données',
  'default': 'Une erreur inattendue est survenue'
};

// Liste des erreurs à ignorer (ne pas afficher de toast)
const ignoredErrors = [
  'duplicate key',
  'Could not find the email column',
  'Une erreur est survenue lors de la création du profil',
  'No rows found',
  'JWT expired',
  'Une erreur inattendue est survenue',
  'null value in column',
  'foreign key violation'
];

export const handleError = (error, toast) => {
  // Si pas d'erreur, retourner
  if (!error) return null;

  console.error('Error details:', error);

  // Extraire le message d'erreur
  const errorMessage = error.message || error.error_description || error;
  
  // Vérifier si c'est une erreur à ignorer
  if (ignoredErrors.some(ignored => errorMessage.toLowerCase().includes(ignored.toLowerCase()))) {
    return null;
  }
  
  // Trouver le message correspondant en français
  let frenchMessage = errorMessages[errorMessage] || errorMessages['default'];

  // Afficher le toast une seule fois
  if (toast && !window.lastErrorShown) {
    window.lastErrorShown = errorMessage;
    setTimeout(() => { window.lastErrorShown = null; }, 3000);

    toast({
      title: 'Erreur',
      description: frenchMessage,
      status: 'error',
      duration: 3000,
      isClosable: true,
      position: 'top'
    });
  }

  return frenchMessage;
};
