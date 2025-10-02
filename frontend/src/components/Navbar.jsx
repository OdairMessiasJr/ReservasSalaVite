import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';
import logo from '../assets/logo.png';

export default function Navbar() {
  const { isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.brand}><img src={logo} alt="Logotipo" width="150" height="40" /></Link>
      <div className={styles.title}><h1>SENAI VALINHOS</h1></div>
      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      <ul className={`${styles.navList} ${menuOpen ? styles.open : ''}`}>
        <li onClick={() => setMenuOpen(false)}><NavLink to="/calendario">Ver Reservas</NavLink></li>
        <li onClick={() => setMenuOpen(false)}><NavLink to="/">Agendar/Cancelar</NavLink></li>
        {isAdmin && (<li onClick={() => setMenuOpen(false)}><NavLink to="/adicionar-sala">Adicionar Sala</NavLink></li>)}
        <li>
          {isAdmin ? 
            (<button onClick={() => { logout(); setMenuOpen(false); }} className={styles.authButton}>Logout</button>) : 
            (<Link to="/login" onClick={() => setMenuOpen(false)} className={styles.loginLink}>Login</Link>)}
        </li>
      </ul>
    </nav>
  );
}