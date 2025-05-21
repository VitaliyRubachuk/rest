import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/Modal.css';

const EditTableModal = ({ isOpen, onClose, table, onTableUpdated }) => {
    const [tableNumber, setTableNumber] = useState('');
    const [seats, setSeats] = useState('');
    const [isReserved, setIsReserved] = useState(false);
    const [reservedByUserId, setReservedByUserId] = useState('');
    const [reservedAt, setReservedAt] = useState('');
    const [reservedUntil, setReservedUntil] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        if (table) {
            setTableNumber(table.tableNumber);
            setSeats(table.seats);
            setIsReserved(table.isReserved);
            setReservedByUserId(table.reservedByUserId || '');
            setReservedAt(table.reservedAt ? new Date(table.reservedAt).toISOString().slice(0, 16) : '');
            setReservedUntil(table.reservedUntil ? new Date(table.reservedUntil).toISOString().slice(0, 16) : '');
        }
    }, [table]);

    if (!isOpen || !table) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!tableNumber || !seats) {
            setError('Будь ласка, заповніть всі обов\'язкові поля.');
            return;
        }

        const updatedTableData = {
            id: table.id,
            tableNumber: parseInt(tableNumber, 10),
            seats: parseInt(seats, 10),
            isReserved: isReserved,
            reservedByUserId: isReserved ? (reservedByUserId ? parseInt(reservedByUserId, 10) : null) : null,
            reservedAt: isReserved && reservedAt ? reservedAt + ':00' : null,
            reservedUntil: isReserved && reservedUntil ? reservedUntil + ':00' : null,
        };

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8080/api/tables/${table.id}`, updatedTableData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setSuccessMessage('Столик успішно оновлено!');
            if (onTableUpdated) {
                onTableUpdated();
            }
        } catch (err) {
            console.error('Помилка при оновленні столика:', err);
            setError(err.response?.data?.error || (err.response?.data?.errors ? err.response.data.errors.join(', ') : 'Помилка при оновленні столика.'));
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>Редагувати столик №{table.tableNumber}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="editTableNumber">Номер столика:</label>
                        <input
                            type="number"
                            id="editTableNumber"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editSeats">Кількість місць:</label>
                        <input
                            type="number"
                            id="editSeats"
                            value={seats}
                            onChange={(e) => setSeats(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="editIsReserved"
                            checked={isReserved}
                            onChange={(e) => setIsReserved(e.target.checked)}
                        />
                        <label htmlFor="editIsReserved">Зарезервовано</label>
                    </div>

                    {isReserved && (
                        <>
                            <div className="form-group">
                                <label htmlFor="editReservedByUserId">ID користувача, що зарезервував (якщо відомо):</label>
                                <input
                                    type="number"
                                    id="editReservedByUserId"
                                    value={reservedByUserId}
                                    onChange={(e) => setReservedByUserId(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="editReservedAt">Час резервації (початок):</label>
                                <input
                                    type="datetime-local"
                                    id="editReservedAt"
                                    value={reservedAt}
                                    onChange={(e) => setReservedAt(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="editReservedUntil">Час резервації (до):</label>
                                <input
                                    type="datetime-local"
                                    id="editReservedUntil"
                                    value={reservedUntil}
                                    onChange={(e) => setReservedUntil(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    <button type="submit" className="submit-button">Оновити столик</button>
                </form>
            </div>
        </div>
    );
};

export default EditTableModal;