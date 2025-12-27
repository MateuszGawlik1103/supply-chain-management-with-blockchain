import { Link } from 'react-router-dom';
import { useAuth } from '#context/AuthContext';
import styles from './Home.module.css';

function Home() {
  const { user } = useAuth();

  return (
    <div className={styles.homeContainer}>
      <h1>Welcome to CoffeeTracker</h1>
      <p>
        Track your coffee batches from farm to cup.
        See detailed batch history, transport conditions,
        and quality checks.
      </p>
      <div className={styles.homeButtons}>
        {user ? (
          <>
            <Link to="/batch" className={styles.homeButton}>
              Check Coffee History
            </Link>
            <Link to="/logout" className={styles.homeButton}>
              Logout
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.homeButton}>
              Login
            </Link>
            <Link to="/register" className={styles.homeButton}>
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
