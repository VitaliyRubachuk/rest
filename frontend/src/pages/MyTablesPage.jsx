import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../css/TablesPage.css';
import '../css/Modal.css';

const MyTablesPage = () => {
    const [myTables, setMyTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    const [isEditReservationTimeModalOpen, setIsEditReservationTimeModalOpen] = useState(false);
    const [selectedTableToEditTime, setSelectedTableToEditTime] = useState(null);
    const [newReservedUntil, setNewReservedUntil] = useState('');
    const [editError, setEditError] = useState(null);
    const [editSuccessMessage, setEditSuccessMessage] = useState(null);


    useEffect(() => {
        if (user) {
            fetchMyTables();
        } else {
            setLoading(false);
            setError('Будь ласка, увійдіть, щоб переглянути ваші столики.');
        }
    }, [user]);

    const fetchMyTables = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/users/my-tables', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setMyTables(response.data.myTables);
        } catch (err) {
            setError('Не вдалося завантажити ваші столики.');
            console.error('Помилка при завантаженні моїх столиків:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelReservation = async (tableId) => {
        try {
            await axios.delete(`http://localhost:8080/api/tables/${tableId}/reserve`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            alert('Резервацію столика успішно скасовано!');
            fetchMyTables();
        } catch (err) {
            console.error('Помилка при скасуванні резервації:', err);
            setError(err.response?.data?.error || 'Не вдалося скасувати резервацію столика.');
        }
    };

    const handleOpenEditReservationTimeModal = (table) => {
        setSelectedTableToEditTime(table);
        const now = new Date();
        now.setMinutes(now.getMinutes() + 10);
        const formattedMinTime = now.toISOString().slice(0, 16);

        const currentReservedUntil = table.reservedUntil ? new Date(table.reservedUntil) : null;
        let initialTimeForInput = formattedMinTime;

        if (currentReservedUntil && currentReservedUntil.getTime() > now.getTime()) {
            initialTimeForInput = currentReservedUntil.toISOString().slice(0, 16);
        }

        setNewReservedUntil(initialTimeForInput);
        setIsEditReservationTimeModalOpen(true);
        setEditError(null);
        setEditSuccessMessage(null);
    };

    const handleEditReservationTimeSubmit = async (e) => {
        e.preventDefault();
        setEditError(null);
        setEditSuccessMessage(null);

        if (!newReservedUntil) {
            setEditError('Будь ласка, оберіть новий час закінчення резервації.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const updateData = {
                reservedUntil: newReservedUntil + ':00',
            };
            await axios.put(`http://localhost:8080/api/tables/${selectedTableToEditTime.id}/reserve`, updateData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setEditSuccessMessage('Час резервації успішно оновлено!');
            fetchMyTables();
            setIsEditReservationTimeModalOpen(false);
            setSelectedTableToEditTime(null);
            setNewReservedUntil('');
        } catch (err) {
            console.error('Помилка при оновленні часу резервації:', err);
            setEditError(err.response?.data?.error || 'Помилка при оновленні часу резервації.');
        }
    };

    if (loading) {
        return <div className="my-tables-container">Завантаження ваших столиків...</div>;
    }

    if (error) {
        return <div className="my-tables-container error-message">{error}</div>;
    }

    return (
        <div className="my-tables-container">
            <h2>Мої зарезервовані столики</h2>
            {myTables.length === 0 ? (
                <p className="no-my-tables-message">Ви ще не зарезервували жодного столика.</p>
            ) : (
                <div className="my-tables-list">
                    {myTables.map(table => (
                        <div key={table.id} className="my-table-card">
                            <h3>Стіл №{table.tableNumber}</h3>
                            <p>Місць: {table.seats}</p>
                            <p>Зарезервовано з: {new Date(table.reservedAt).toLocaleString()}</p>
                            <p>Зарезервовано до: {table.reservedUntil ? new Date(table.reservedUntil).toLocaleString() : 'Не вказано'}</p>
                            <div className="my-table-actions">
                                <button
                                    onClick={() => handleCancelReservation(table.id)}
                                    className="cancel-reservation-button"
                                >
                                    Скасувати резервацію
                                </button>
                                <button
                                    onClick={() => handleOpenEditReservationTimeModal(table)}
                                    className="edit-button"
                                >
                                    Змінити час
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isEditReservationTimeModalOpen && selectedTableToEditTime && (
                <div className="modal-overlay">
                    <div className="modal-content modal-edit-time">
                        <button className="modal-close-button" onClick={() => setIsEditReservationTimeModalOpen(false)}>&times;</button>
                        <h2>Змінити час резервації для столика №{selectedTableToEditTime.tableNumber}</h2>
                        <form onSubmit={handleEditReservationTimeSubmit}>
                            <div className="form-group">
                                <label htmlFor="newReservedUntil">Зарезервувати до:</label>
                                <input
                                    type="datetime-local"
                                    id="newReservedUntil"
                                    value={newReservedUntil}
                                    onChange={(e) => setNewReservedUntil(e.target.value)}
                                    min={new Date(new Date().setMinutes(new Date().getMinutes() + 5)).toISOString().slice(0,16)}
                                    required
                                />
                            </div>
                            {editError && <p className="error-message">{editError}</p>}
                            {editSuccessMessage && <p className="success-message">{editSuccessMessage}</p>}
                            <button type="submit" className="submit-button">Оновити час</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTablesPage;