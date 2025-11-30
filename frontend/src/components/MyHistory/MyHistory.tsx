import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '#api/api';
import { useAuth } from '#context/AuthContext';
import styles from './MyHistory.module.css';

export const MyHistory = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/my-history', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setHistory(res.data.history.map((h: any) => h.batch_id));
      } catch (err) {
        console.error(err);
      }
    };

    if (token) loadHistory();
  }, [token]);

  const handleClick = (batchId: string) => {
    navigate(`/batch?batch=${batchId}`);
  };

  return (
    <div className={styles.container}>
      <h2>Your Coffee Search History ☕</h2>

      {history.length === 0 ? (
        <p>No search history yet.</p>
      ) : (
        <ul className={styles.list}>
          {history.map((batchId, i) => (
            <li key={i} className={styles.item} onClick={() => handleClick(batchId)}>
              {batchId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyHistory;
