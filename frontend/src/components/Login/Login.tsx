import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '#api/api';
import { useAuth } from '#context/AuthContext';
import styles from './Login.module.css';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setToken, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await api.post(
        '/login', { username, password });

      if (res.data.token) setToken(res.data.token);
      setUser({ username: res.data.user?.username || username });

      alert('User logged in!');
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Login</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;
