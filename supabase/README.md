# Structure de la Base de Données Ematik Store

## Tables Principales

### Profiles
- Extension de la table auth.users de Supabase
- Stocke les informations supplémentaires des utilisateurs
- Gère les rôles (admin/user) et le solde

### Categories
- Catégories de services
- Structure hiérarchique (catégories parent/enfant)
- Inclut nom, description, slug et icône

### Services
- Services disponibles à la vente
- Lié aux catégories
- Prix et disponibilité

### Orders
- Commandes des utilisateurs
- Statut de commande
- Montant total

### Order Items
- Détails des articles dans une commande
- Quantité et prix au moment de l'achat

### Transactions
- Toutes les transactions financières
- Types : dépôt, retrait, achat, remboursement
- Mise à jour automatique du solde utilisateur

### Payments
- Détails des paiements
- Statut de paiement
- Méthode de paiement

### Favorites
- Services favoris des utilisateurs
- Relation unique utilisateur-service

### Reviews
- Avis des utilisateurs sur les services
- Note de 1 à 5 et commentaires

### Notifications
- Notifications système pour les utilisateurs
- Statut de lecture

## Sécurité

### Row Level Security (RLS)
- Politiques de sécurité par ligne pour chaque table
- Accès restreint aux données personnelles
- Contrôles d'accès basés sur les rôles

## Fonctions et Triggers

### Mise à jour automatique
- Timestamps updated_at automatiques
- Mise à jour automatique du solde utilisateur

## Indexes
- Optimisation des performances pour les requêtes fréquentes
- Index sur les clés étrangères principales

## Types Personnalisés
- user_role: admin, user
- order_status: pending, processing, completed, cancelled
- transaction_type: deposit, withdrawal, purchase, refund
- payment_status: pending, completed, failed
