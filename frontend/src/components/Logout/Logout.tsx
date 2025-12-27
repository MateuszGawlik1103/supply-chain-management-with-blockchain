import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '#api/api';
import { useAuth } from '#context/AuthContext';

export const Logout = () => {
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      const token = localStorage.getItem('token');
      try {
        if (token) {
          await api.post(
            '/logout',
            null,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (err) {
        console.error('Error logging out:', err);
      } finally {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        alert('User logged out!');
        navigate('/');
      }
    };

    doLogout();
  }, [navigate, setToken, setUser]);

  return <div>Logging out...</div>;
};

export default Logout;
