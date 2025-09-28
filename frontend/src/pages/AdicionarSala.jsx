import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Form.module.css';
import axios from 'axios';
const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL + '/api' });
export default function AdicionarSala() {
    const [nomeSala, setNomeSala] = useState('');
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    useEffect(() => { if (!isAdmin) { navigate('/login'); } }, [isAdmin, navigate]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/salas', { nome: nomeSala });
            alert('Sala adicionada com sucesso!');
            navigate('/');
        } catch (error) { alert('Falha ao adicionar a sala.'); }
    };
    if (!isAdmin) return <p>Redirecionando...</p>;
    return (
        <div>
            <h1 className={styles.title}>Adicionar Nova Sala</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}><label htmlFor="nome-sala">Nome da Sala</label><input type="text" id="nome-sala" value={nomeSala} onChange={(e) => setNomeSala(e.target.value)} required /></div>
                <button type="submit" className={styles.button}>Adicionar Sala</button>
            </form>
        </div>
    );
}
