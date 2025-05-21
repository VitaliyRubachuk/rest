import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../css/ArchiveOrdersPage.css';

const ArchiveOrdersPage = () => {
    const [archivedOrders, setArchivedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dishDetails, setDishDetails] = useState({});
    const [userNames, setUserNames] = useState({});

    useEffect(() => {
        fetchArchivedOrders();
    }, []);

    const fetchArchivedOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/orders?statuses=COMPLETED,CANCELED', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setArchivedOrders(response.data.orders);
            const userIds = [...new Set(response.data.orders.map(order => order.userId))];
            userIds.forEach(fetchUserName);
            response.data.orders.forEach(order => {
                order.dishIds.forEach(dishId => {
                    if (!dishDetails[dishId]) {
                        fetchDishDetails(dishId);
                    }
                });
            });
            setLoading(false);
        } catch (err) {
            setError('Не вдалося завантажити архівні замовлення.');
            console.error('Помилка завантаження архівних замовлень:', err);
            setLoading(false);
        }
    };

    const fetchDishDetails = async (dishId) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/dishes/${dishId}`);
            setDishDetails(prev => ({ ...prev, [dishId]: response.data }));
        } catch (error) {
            console.error(`Помилка отримання деталей страви з ID ${dishId}:`, error);
        }
    };

    const fetchUserName = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUserNames(prev => ({ ...prev, [userId]: response.data.name }));
        } catch (error) {
            console.error(`Помилка отримання імені користувача з ID ${userId}:`, error);
            setUserNames(prev => ({ ...prev, [userId]: 'Невідомий користувач' }));
        }
    };

    const getDishNamesForOrder = (dishIds) => {
        return dishIds.map(id => dishDetails[id]?.name || 'Завантаження...').join(', ');
    };

    if (loading) {
        return <div>Завантаження архівних замовлень...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="archive-orders-page">
            <h2>Архів замовлень</h2>
            <div className="archive-actions">
                <Link to="/admin/orders" className="nav-buttons a">
                    Назад до активних замовлень
                </Link>
            </div>
            {archivedOrders.length === 0 ? (
                <p>Немає завершених або скасованих замовлень в архіві.</p>
            ) : (
                <ul className="archived-orders-list">
                    {archivedOrders.map(order => (
                        <li key={order.id} className="archived-order-item">
                            <p>ID замовлення: {order.id}</p>
                            <p>Користувач: {userNames[order.userId] || "Завантаження..."}</p>
                            <p>Дата створення: {new Date(order.orderDate).toLocaleString()}</p>
                            <p>Дата оновлення: {new Date(order.updatedAt).toLocaleString()}</p>
                            <p>Повна ціна: {order.fullPrice} грн</p>
                            <p>Страви: {getDishNamesForOrder(order.dishIds)}</p>
                            <p>Додаткова інформація: {order.addition || 'Відсутня'}</p>
                            <p>Статус: {order.status}</p>
                            <p>
                                <strong>Тип замовлення:</strong>
                                {order.isDelivery ? 'Доставка' : 'В закладі'}
                            </p>
                            {order.isDelivery ? (
                                <>
                                    <p>
                                        <strong>Адреса доставки:</strong>
                                        {`${order.city ? order.city + ', ' : ''}${order.street ? order.street + ', ' : ''}${order.houseNumber ? 'буд. ' + order.houseNumber : ''}${order.apartmentNumber ? ', кв. ' + order.apartmentNumber : ''}`}
                                    </p>
                                    <p><strong>Номер телефону:</strong> {order.phoneNumber || 'Не вказано'}</p>
                                </>
                            ) : (
                                <p><strong>Номер столу:</strong> {order.tableNumber || 'Не вказано'}</p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ArchiveOrdersPage;