import React, { useState } from 'react';
import axios from 'axios';
import '../css/Modal.css';

const AddTableModal = ({ isOpen, onClose, onTableAdded }) => {
    const [tableNumber, setTableNumber] = useState('');
    const [seats, setSeats] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!tableNumber || !seats) {
            setError('Будь ласка, заповніть всі поля.');
            return;
        }

        const tableData = {
            tableNumber: parseInt(tableNumber, 10),
            seats: parseInt(seats, 10),
        };

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8080/api/tables', tableData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setSuccessMessage('Столик успішно додано!');
            setTableNumber('');
            setSeats('');
            if (onTableAdded) {
                onTableAdded();
            }
        } catch (err) {
            console.error('Помилка при додаванні столика:', err);
            setError(err.response?.data?.error || (err.response?.data?.errors ? err.response.data.errors.join(', ') : 'Помилка при додаванні столика.'));
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close-button" onClick={onClose}>&times;</button>
                <h2>Додати новий столик</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="tableNumber">Номер столика:</label>
                        <input
                            type="number"
                            id="tableNumber"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="seats">Кількість місць:</label>
                        <input
                            type="number"
                            id="seats"
                            value={seats}
                            onChange={(e) => setSeats(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    <button type="submit" className="submit-button">Додати столик</button>
                </form>
            </div>
        </div>
    );
};

export default AddTableModal;