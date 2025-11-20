import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { findUserByEmail, initializeDB } from './db';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, passwordHash: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initializeDB();
      const storedUser = localStorage.getItem('localbookr_session');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, passwordHash: string) => {
    try {
      const foundUser = await findUserByEmail(email);
      
      // NOTE: In a real production app, do NOT compare plain text/simple hashes on client.
      // This is maintained as per the prompt's simple auth requirement without full Auth server.
      if (foundUser && foundUser.passwordHash === passwordHash) {
        setUser(foundUser);
        localStorage.setItem('localbookr_session', JSON.stringify(foundUser));
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      toast.error("Login error");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('localbookr_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
