import { useState, useEffect, useRef } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './Calendario.module.css';
const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }), getDay, locales });
const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL + '/api' });
const getTodayString = () => new Date().toISOString().split('T')[0];
const converterReservasParaEventos = (reservas) => {
    return reservas.map(reserva => ({
        id: reserva.id, title: `${reserva.salaNome} (${reserva.responsavel})`,
        start: new Date(`${reserva.data}T${reserva.horarioInicio}`), end: new Date(`${reserva.data}T${reserva.horarioFim}`),
    }));
};
export default function PaginaCalendario() {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataSelecionada, setDataSelecionada] = useState(getTodayString());
    const calendarRef = useRef(null);
    useEffect(() => {
        const fetchTodasAsReservas = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get('/reservas/all');
                setEventos(converterReservasParaEventos(res.data));
            } catch (error) { console.error("Falha ao carregar as reservas:", error); } finally { setLoading(false); }
        };
        fetchTodasAsReservas();
    }, []);
    const handleNavigateToDate = () => { if (dataSelecionada && calendarRef.current) { const [year, month, day] = dataSelecionada.split('-').map(Number); calendarRef.current.getApi().onNavigate('DATE', new Date(year, month - 1, day)); }};
    if (loading) return <p className={styles.loading}>Carregando...</p>;
    return (
        <div className={styles.calendarContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Calendário de Reservas</h1>
                <div className={styles.datePickerContainer}><input type="date" value={dataSelecionada} onChange={(e) => setDataSelecionada(e.target.value)} className={styles.datePicker}/><button onClick={handleNavigateToDate} className={styles.datePickerButton}>Ir para Data</button></div>
            </div>
            <Calendar ref={calendarRef} localizer={localizer} events={eventos} startAccessor="start" endAccessor="end" style={{ height: '70vh' }} culture='pt-BR' messages={{ next: "Próximo", previous: "Anterior", today: "Hoje", month: "Mês", week: "Semana", day: "Dia", agenda: "Agenda", noEventsInRange: "Não há reservas neste período.", }} />
        </div>
    );
}
