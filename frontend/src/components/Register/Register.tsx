import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '#api/api';
import styles from './Register.module.css'

export const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await api.post('/register', { username, password });
      alert(`Registered user: ${res.data.user.username}`);
      navigate('/'); // przekierowanie na home po rejestracji
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Register</h2>
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
      <button onClick={handleRegister}>Register</button>
    </div>
  );
};

export default Register;
