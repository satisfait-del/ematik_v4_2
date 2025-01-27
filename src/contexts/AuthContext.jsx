import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import TransitionLoader from '../components/TransitionLoader';

const AuthContext = createContext(null);
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showTransitionLoader, setShowTransitionLoader] = useState(false);
  const inactivityTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isVoluntaryLogoutRef = useRef(false);
  const toast = useToast();
  const navigate = useNavigate();

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        signOut();
      }
    }, 60000); // Vérifier chaque minute
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Bon retour parmi nous !",
        status: "success",
        duration: 3000,
        position: "top",
        isClosable: true,
      });

      setUser(data.user);
      resetInactivityTimer();

      return { data };
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        status: "error",
        duration: 5000,
        position: "top",
        isClosable: true,
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setShowTransitionLoader(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
        status: "success",
        duration: 3000,
        position: "top",
        isClosable: true,
      });

      setUser(null);
      
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }

      setTimeout(() => {
        setShowTransitionLoader(false);
        navigate('/auth');
      }, 1000);
    } catch (error) {
      toast({
        title: "Erreur lors de la déconnexion",
        description: error.message,
        status: "error",
        duration: 5000,
        position: "top",
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) {
          resetInactivityTimer();
        }
      } catch (error) {
        console.log('Session check error:', error);
      } finally {
        setSessionChecked(true);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        resetInactivityTimer();
      }
    });

    checkSession();

    return () => {
      subscription?.unsubscribe();
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    const handleActivity = () => {
      if (user) {
        resetInactivityTimer();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [user, resetInactivityTimer]);

  const value = {
    user,
    loading,
    sessionChecked,
    signIn,
    signOut,
    showTransitionLoader,
  };

  return (
    <AuthContext.Provider value={value}>
      {showTransitionLoader && (
        <TransitionLoader message="Déconnexion en cours..." />
      )}
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
