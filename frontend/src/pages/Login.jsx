import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Form.module.css';
export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        const success = await login(username, password);
        if (!success) { setError('Usuário ou senha inválidos.'); }
    };
    return (
        <div>
            <h1 className={styles.title}>Login de Administrador</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                <div className={styles.formGroup}><label htmlFor="username">Usuário</label><input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                <div className={styles.formGroup}><label htmlFor="password">Senha</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <button type="submit" className={styles.button}>Entrar</button>
            </form>
        </div>
    );
}