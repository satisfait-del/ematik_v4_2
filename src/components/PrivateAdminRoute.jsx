import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import TransitionLoader from './TransitionLoader'

const PrivateAdminRoute = ({ children }) => {
  const { user } = useAuth()
  const { profile, loading } = useProfile()
  const location = useLocation()

  // Afficher le loader pendant le chargement
  if (loading) {
    return <TransitionLoader message="Vérification des autorisations..." />
  }

  // Rediriger vers la page de connexion si non connecté
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // Rediriger vers la page d'accueil si non admin
  if (!profile?.is_admin) {
    console.log('Accès refusé - Non admin:', { profile })
    return <Navigate to="/" replace />
  }

  // Tout est OK, afficher le contenu admin
  return children
}

export default PrivateAdminRoute
