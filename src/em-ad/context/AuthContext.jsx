import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem('em-ad-token');
    const userData = localStorage.getItem('em-ad-user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const login = async (username, password) => {
    // Simulation d'une vérification d'authentification
    // Dans un cas réel, vous feriez un appel API ici
    if (username === 'admin' && password === 'admin123') {
      const userData = {
        id: 1,
        username: 'admin',
        role: 'admin',
      };
      
      localStorage.setItem('em-ad-token', 'votre-token-jwt-ici');
      localStorage.setItem('em-ad-user', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('em-ad-token');
    localStorage.removeItem('em-ad-user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
