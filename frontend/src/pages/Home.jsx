import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Home.module.css';
import axios from 'axios';

const apiClient = axios.create({ baseURL: '/api' });
const getTodayString = () => new Date().toISOString().split('T')[0];

export default function Home() {
    const [salas, setSalas] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [dataSelecionada, setDataSelecionada] = useState(getTodayString());
    const [loading, setLoading] = useState(true);
    const { isAdmin } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [salaParaReservar, setSalaParaReservar] = useState(null);

    const fetchData = () => {
        setLoading(true);
        Promise.all([ apiClient.get('/salas'), apiClient.get(`/reservas?data=${dataSelecionada}`)])
            .then(([salasRes, reservasRes]) => { setSalas(salasRes.data); setReservas(reservasRes.data); })
            .catch(error => { console.error("Falha ao carregar dados:", error); alert("Não foi possível carregar os dados."); })
            .finally(() => { setLoading(false); });
    };

    useEffect(() => { fetchData(); }, [dataSelecionada]);

    const handleCancel = async (reservaId) => { if (confirm('Deseja cancelar esta reserva?')) { try { await apiClient.delete('/reservas', { data: { id: reservaId } }); alert('Reserva cancelada!'); fetchData(); } catch (e) { alert('Falha ao cancelar.'); } } };
    const handleDeleteSala = async (salaId) => { if (confirm('Atenção! Deletar esta sala removerá TODAS as suas reservas. Continuar?')) { try { await apiClient.delete('/salas', { data: { id: salaId } }); alert('Sala deletada!'); fetchData(); } catch (e) { alert('Falha ao deletar.'); } } };
    const abrirModalReserva = (sala) => { setSalaParaReservar(sala); setIsModalOpen(true); };
    const fecharModalReserva = () => { setSalaParaReservar(null); setIsModalOpen(false); };

    const ModalReserva = () => {
        if (!isModalOpen) return null;

        const handleFormSubmit = async (e) => {
            e.preventDefault();
            const form = e.target;
            
            // Lê os novos campos do formulário
            const reserva = {
                salaId: salaParaReservar.id,
                data: dataSelecionada,
                horarioInicio: form.horarioInicio.value,
                quantidadeAulas: Number(form.quantidadeAulas.value),
                tempoPorAula: Number(form.tempoPorAula.value),
                responsavel: form.responsavel.value
            };

            // Envia os novos dados para a API
            try {
                await apiClient.post('/reservas/create', reserva);
                alert('Sala reservada com sucesso!');
                fecharModalReserva();
                fetchData();
            } catch (error) {
                alert(`Erro: ${error.response?.data?.message || 'Tente novamente'}`);
            }
        };

        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <h2>Reservar {salaParaReservar.nome}</h2>
                    <p>Data: {new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    <form onSubmit={handleFormSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="responsavel">Seu Nome</label>
                            <input type="text" id="responsavel" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="horarioInicio">Horário de Início</label>
                            <input type="time" id="horarioInicio" required />
                        </div>

                        {/* Campos de duração substituídos */}
                        <div className={styles.durationFields}>
                            <div className={styles.formGroup}>
                                <label htmlFor="quantidadeAulas">Nº de Aulas</label>
                                <input type="number" id="quantidadeAulas" min="1" defaultValue="1" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="tempoPorAula">Tempo por Aula (min)</label>
                                <input type="number" id="tempoPorAula" min="1" defaultValue="45" required />
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button type="button" onClick={fecharModalReserva}>Cancelar</button>
                            <button type="submit">Confirmar Reserva</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // O return do componente Home continua o mesmo
    


    return (
        <div>
            <ModalReserva />
            <div className={styles.header}><h1>Agendamento de Salas</h1><div className={styles.datePickerContainer}><label htmlFor="date-picker">Selecione uma data:</label><input type="date" id="date-picker" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)}/></div></div>
            {loading ? <p>Carregando...</p> : (
                <div className={styles.salaList}>
                    {salas.map((sala) => {
                        const reservasDaSala = reservas.filter(r => r.salaId === sala.id).sort((a,b) => a.horarioInicio.localeCompare(b.horarioInicio));
                        return (
                            <div key={sala.id} className={styles.salaCard}>
                                <div className={styles.salaHeader}><h3>{sala.nome}</h3><div><button onClick={() => abrirModalReserva(sala)} className={styles.bookButton}>Reservar</button>{isAdmin && <button onClick={() => handleDeleteSala(sala.id)} className={styles.deleteSalaButton}>&#128465;</button>}</div></div>
                                <div className={styles.reservasList}>
                                    {reservasDaSala.length > 0 ? (<ul>{reservasDaSala.map(res => (<li key={res.id}><span>{res.horarioInicio} - {res.horarioFim}</span><span>({res.responsavel})</span>{isAdmin && <button onClick={() => handleCancel(res.id)}>X</button>}</li>))}</ul>) : (<p>Nenhuma reserva para esta data.</p>)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
