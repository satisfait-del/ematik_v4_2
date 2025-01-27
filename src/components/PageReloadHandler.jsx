import React, { useEffect, useState } from 'react';
import TransitionLoader from './TransitionLoader';

const PageReloadHandler = ({ children }) => {
  const [isReloading, setIsReloading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReloading(false);
    }, 1000);

    const handleBeforeUnload = () => {
      setIsReloading(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (isReloading) {
    return <TransitionLoader message="Chargement de la page..." />;
  }

  return children;
};

export default PageReloadHandler;
