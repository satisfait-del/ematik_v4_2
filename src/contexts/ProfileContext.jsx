import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '@chakra-ui/react';

const ProfileContext = createContext(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const toast = useToast();

  const loadProfile = useCallback(async () => {
    if (!user || isInitialized) return;

    try {
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (existingProfile) {
        setProfile({
          ...existingProfile,
          is_admin: existingProfile.role === 'admin'
        });
      } else {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            email: user.email,
            total_spent: 0,
            balance: 0,
            role: 'user'
          }])
          .select()
          .maybeSingle();

        if (insertError) throw insertError;

        setProfile({
          ...newProfile,
          is_admin: false
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre profil",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [user, isInitialized, toast]);

  useEffect(() => {
    if (user && !isInitialized) {
      loadProfile();
    } else if (!user) {
      setProfile(null);
      setLoading(false);
      setIsInitialized(false);
    }
  }, [user, loadProfile, isInitialized]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new) {
          setProfile({
            ...payload.new,
            is_admin: payload.new.role === 'admin'
          });
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const updateProfile = async (updates) => {
    try {
      if (!user) return { error: 'Non authentifié' };

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (error) throw error;

      const updatedProfile = {
        ...data,
        is_admin: data.role === 'admin'
      };

      setProfile(updatedProfile);
      
      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });

      return { data: updatedProfile };
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return { error };
    }
  };

  const value = {
    profile,
    loading: loading || !isInitialized,
    updateProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export default ProfileContext;
