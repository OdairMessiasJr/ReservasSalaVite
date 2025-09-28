import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';
import logo from '../assets/logo.svg';
export default function Navbar() {
  const { isAdmin, logout } = useAuth();
  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.brand}><img src={logo} alt="Logotipo" width="150" height="40" /></Link>
      <div className={styles.title}><h1>SENAI VALINHOS</h1></div>
      <ul className={styles.navList}>
        <li><NavLink to="/calendario">Ver Reservas</NavLink></li>
        <li><NavLink to="/">Agendar/Cancelar</NavLink></li>
        {isAdmin && (<li><NavLink to="/adicionar-sala">Adicionar Sala</NavLink></li>)}
        <li>
          {isAdmin ? (<button onClick={logout} className={styles.authButton}>Logout</button>) : (<Link to="/login" className={styles.loginLink}>Login</Link>)}
        </li>
      </ul>
    </nav>
  );
}