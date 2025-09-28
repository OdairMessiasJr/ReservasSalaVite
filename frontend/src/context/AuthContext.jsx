import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const apiClient = axios.create({ baseURL: 'http://localhost:3001/api' });
const AuthContext = createContext();
export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const login = async (username, password) => {
    try {
      await apiClient.post('/auth/login', { username, password });
      setIsAdmin(true);
      navigate('/');
      return true;
    } catch (error) { setIsAdmin(false); return false; }
  };
  const logout = () => { setIsAdmin(false); navigate('/login'); };
  return (<AuthContext.Provider value={{ isAdmin, login, logout }}>{children}</AuthContext.Provider>);
}
export const useAuth = () => useContext(AuthContext);