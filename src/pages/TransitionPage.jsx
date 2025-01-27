import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TransitionLoader from '../components/TransitionLoader';
import { useService } from '../context/ServiceContext';

const TransitionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchServices } = useService();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkServices = async () => {
      try {
        await fetchServices();
        const { redirectTo = '/services' } = location.state || {};
        navigate(redirectTo, { replace: true });
      } catch (error) {
        console.error('Erreur lors du chargement des services:', error);
        navigate('/services', { replace: true });
      }
    };

    const timer = setTimeout(() => {
      checkServices();
    }, 2000);

    return () => clearTimeout(timer);
  }, [location, navigate, fetchServices]);

  const message = location.state?.message || "Chargement en cours...";

  return <TransitionLoader message={message} />;
};

export default TransitionPage;
