import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AddTableModal from '../../components/AddTableModal';
import EditTableModal from '../../components/EditTableModal';
import '../../css/TablesPage.css';

const AdminTablesPage = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);

    useEffect(() => {
        if (!authLoading && user?.role === 'ADMIN') {
            fetchTables();
        }
    }, [user, authLoading]);

    const fetchTables = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/tables', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setTables(response.data.tables);
        } catch (err) {
            setError('Не вдалося завантажити столики.');
            console.error('Помилка при завантаженні столиків:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTable = async (tableId) => {
        if (window.confirm('Ви впевнені, що хочете видалити цей столик?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:8080/api/tables/${tableId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                alert('Столик успішно видалено!');
                fetchTables();
            } catch (err) {
                console.error('Помилка при видаленні столика:', err);
                setError(err.response?.data?.error || 'Не вдалося видалити столик.');
            }
        }
    };

    const handleEditTable = (table) => {
        setSelectedTable(table);
        setIsEditModalOpen(true);
    };

    const handleAddSuccess = () => {
        setIsAddModalOpen(false);
        fetchTables();
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        fetchTables();
    };

    if (authLoading) {
        return <div className="admin-tables-container">Завантаження даних користувача...</div>;
    }

    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    if (loading) {
        return <div className="admin-tables-container">Завантаження столиків...</div>;
    }

    if (error) {
        return <div className="admin-tables-container error-message">{error}</div>;
    }

    return (
        <div className="admin-tables-container">
            <h2>Керування столиками</h2>
            <button onClick={() => setIsAddModalOpen(true)} className="add-table-button">
                Додати новий столик
            </button>
            {tables.length === 0 ? (
                <p>Наразі столиків немає.</p>
            ) : (
                <div className="tables-grid">
                    {tables.map(table => (
                        <div key={table.id} className={`table-card ${table.isReserved ? 'reserved' : 'available'}`}>
                            <h3>Стіл №{table.tableNumber}</h3>
                            <p>Місць: {table.seats}</p>
                            <p>Статус: {table.isReserved ? 'Зарезервовано' : 'Вільно'}</p>
                            {table.isReserved && (
                                <>
                                    <p>Ким: {table.reservedByUserId ? `Користувач ID: ${table.reservedByUserId}` : 'Невідомо'}</p>
                                    <p>Коли (початок): {new Date(table.reservedAt).toLocaleString()}</p>
                                    <p>Коли (до): {table.reservedUntil ? new Date(table.reservedUntil).toLocaleString() : 'Не вказано'}</p>
                                </>
                            )}
                            <div className="table-actions">
                                <button onClick={() => handleEditTable(table)} className="edit-button">Редагувати</button>
                                <button onClick={() => handleDeleteTable(table.id)} className="delete-button">Видалити</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isAddModalOpen && (
                <AddTableModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onTableAdded={handleAddSuccess} />
            )}

            {isEditModalOpen && selectedTable && (
                <EditTableModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} table={selectedTable} onTableUpdated={handleEditSuccess} />
            )}
        </div>
    );
};

export default AdminTablesPage;