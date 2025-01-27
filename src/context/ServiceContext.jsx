import React, { createContext, useContext, useState } from 'react';

const ServiceContext = createContext();

export const useService = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  return context;
};

export const ServiceProvider = ({ children }) => {
  // Mock data pour les catégories
  const [categories] = useState({
    'Marketing Digital': {
      id: 1,
      subcategories: ['Social Media', 'SEO', 'Email Marketing', 'Content Marketing']
    },
    'Design Graphique': {
      id: 2,
      subcategories: ['Logo Design', 'Branding', 'UI/UX Design', 'Illustration']
    },
    'Développement': {
      id: 3,
      subcategories: ['Web Development', 'Mobile Apps', 'WordPress', 'E-commerce']
    }
  });

  // Mock data pour les services
  const [services, setServices] = useState([
    {
      id: 1,
      name: 'Gestion des Réseaux Sociaux',
      description: 'Service complet de gestion de vos réseaux sociaux',
      duration: { value: 30, unit: 'days' },
      deliveryTime: { value: 24, unit: 'hours' },
      price: 150000,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3',
      category: 'Marketing Digital',
      subcategory: 'Social Media',
      instructions: 'Fournissez le lien de votre profil social et vos objectifs spécifiques.',
      requiresLink: true,
      requiresUsername: true,
      requiresEmail: true,
      minQuantity: 1,
      maxQuantity: 10,
      status: 'active'
    }
  ]);

  const addService = (newService) => {
    setServices(prev => [...prev, { ...newService, id: prev.length + 1 }]);
  };

  const updateService = (updatedService) => {
    setServices(prev =>
      prev.map(service =>
        service.id === updatedService.id ? updatedService : service
      )
    );
  };

  const deleteService = (serviceId) => {
    setServices(prev => prev.filter(service => service.id !== serviceId));
  };

  const getActiveServices = () => {
    return services.filter(service => service.status === 'active');
  };

  return (
    <ServiceContext.Provider
      value={{
        services,
        categories,
        addService,
        updateService,
        deleteService,
        getActiveServices
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};
