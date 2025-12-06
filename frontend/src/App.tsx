import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Register from '#components/Register';
import Login from '#components/Login';
import BatchHistory from '#components/BatchHistory';
import Logout from '#components/Logout';
import { AuthProvider, useAuth } from '#context/AuthContext';
import styles from './App.module.css';
import { useState } from 'react';
import ProtectedRoute from '#components/ProtectedRoute';

function Navbar() {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  return (
    <nav className={styles.navbar}>
      <Link className={styles.appName} to="/">COFFEE TRACKER ☕</Link>
      <div className={styles.navLinks}>
        {!user && (
          <>
            <Link className={styles.navLink} to="/login">Login</Link>
            <Link className={styles.navLink} to="/register">Register</Link>
          </>
        )}

        {user && (
          <div className={styles.userDropdown}>
            <span className={styles.userName} onClick={toggleDropdown}>
              Hello, {user.username} ▼
            </span>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <Link className={styles.dropdownItem} to="/batch">Check Coffee History</Link>
                <Link className={styles.dropdownItem} to="/logout">Logout</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}


function Home() {
  const { user } = useAuth();

  return (
    <div className={styles.homeContainer}>
      <h1>Welcome to CoffeeTracker</h1>
      <p>Track your coffee batches from farm to cup. See detailed batch history, transport conditions, and quality checks.</p>
      <div className={styles.homeButtons}>
        {user ? (
          <>
            <Link to="/batch" className={styles.homeButton}>Check Coffee History</Link>
            <Link to="/logout" className={styles.homeButton}>Logout</Link>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.homeButton}>Login</Link>
            <Link to="/register" className={styles.homeButton}>Register</Link>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className={styles.app}>
        <Router>
          <Navbar />
          <main className={styles.mainContent}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/batch" element={<ProtectedRoute element={<BatchHistory />} />} />
              <Route path="/logout" element={<Logout />} />
            </Routes>
          </main>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
