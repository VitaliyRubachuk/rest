import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../css/TablesPage.css';

const TablesPage = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    const [showReserveTimeInput, setShowReserveTimeInput] = useState(false);
    const [selectedTableForReservation, setSelectedTableForReservation] = useState(null);
    const [reservedUntil, setReservedUntil] = useState('');
    const [minReservedTime, setMinReservedTime] = useState('');

    useEffect(() => {
        fetchTables();
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setMinReservedTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }, []);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/tables/available');
            setTables(response.data.availableTables);
            setError(null);
        } catch (err) {
            setError('Не вдалося завантажити столики.');
            console.error('Помилка при завантаженні столиків:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReserveButtonClick = (table) => {
        if (!user) {
            setError('Будь ласка, увійдіть, щоб зарезервувати столик.');
            return;
        }
        setSelectedTableForReservation(table);
        setReservedUntil(minReservedTime);
        setShowReserveTimeInput(true);
        setError(null);
    };

    const handleReserveTableSubmit = async () => {
        setError(null);
        if (!reservedUntil) {
            setError('Будь ласка, оберіть час закінчення резервації.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const selectedLocalDate = new Date(reservedUntil);
            const reservedUntilUTC = selectedLocalDate.toISOString();

            const reservationData = {
                reservedUntil: reservedUntilUTC,
            };

            await axios.post(`http://localhost:8080/api/tables/${selectedTableForReservation.id}/reserve`, reservationData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            alert('Столик успішно зарезервовано!');
            setShowReserveTimeInput(false);
            setSelectedTableForReservation(null);
            setReservedUntil('');
            fetchTables();
        } catch (err) {
            console.error('Помилка при резервуванні столика:', err);
            setError(err.response?.data?.error || 'Не вдалося зарезервувати столик. Перевірте час резервації та спробуйте знову.');
        }
    };

    const handleGoBack = () => {
        setError(null);
        setShowReserveTimeInput(false);
        setSelectedTableForReservation(null);
    };

    if (loading) {
        return <div className="tables-container">Завантаження столиків...</div>;
    }

    if (error && !showReserveTimeInput) {
        return (
            <div className="tables-container">
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={handleGoBack} className="back-button">
                        Повернутися до столиків
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="tables-container">
            <h2>Доступні столики</h2>
            {tables.length === 0 ? (
                <p className="no-tables-message">Наразі всі столики зарезервовані або недоступні.</p>
            ) : (
                <div className="tables-list">
                    {tables.map(table => (
                        <div key={table.id} className="table-card">
                            <h3>Стіл №{table.tableNumber}</h3>
                            <p>Місць: {table.seats}</p>
                            {user ? (
                                <>
                                    {!(showReserveTimeInput && selectedTableForReservation?.id === table.id) && (
                                        <button
                                            onClick={() => handleReserveButtonClick(table)}
                                            className="reserve-button"
                                        >
                                            Зарезервувати
                                        </button>
                                    )}
                                    {showReserveTimeInput && selectedTableForReservation?.id === table.id && (
                                        <div className="reserve-time-input">
                                            <label htmlFor="reservedUntil">Зарезервувати до:</label>
                                            <input
                                                type="datetime-local"
                                                id="reservedUntil"
                                                value={reservedUntil}
                                                onChange={(e) => setReservedUntil(e.target.value)}
                                                min={minReservedTime}
                                                required
                                            />
                                            {error && <p className="error-message-inline">{error}</p>}
                                            <div className="reservation-buttons">
                                                <button onClick={handleReserveTableSubmit} className="submit-button">Підтвердити резервацію</button>
                                                <button onClick={handleGoBack} className="cancel-reservation-button">Скасувати</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="login-prompt">Увійдіть, щоб зарезервувати</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TablesPage;