import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../css/AdminOrdersPage.css';

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dishDetails, setDishDetails] = useState({});
    const [userNames, setUserNames] = useState({});
    const [orderDates, setOrderDates] = useState({});
    const [updatedAtDates, setUpdatedAtDates] = useState({});

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/orders', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const filteredOrders = response.data.orders.filter(
                order => order.status === 'PENDING' || order.status === 'IN_PROGRESS'
            );
            setOrders(filteredOrders);

            const userIds = [...new Set(filteredOrders.map(order => order.userId))];
            userIds.forEach(fetchUserName);

            filteredOrders.forEach(order => {
                order.dishIds.forEach(dishId => {
                    if (!dishDetails[dishId]) {
                        fetchDishDetails(dishId);
                    }
                });
                setOrderDates(prev => ({ ...prev, [order.id]: order.orderDate }));
                setUpdatedAtDates(prev => ({ ...prev, [order.id]: order.updatedAt }));
            });

            setLoading(false);
        } catch (err) {
            setError('Не вдалося завантажити замовлення.');
            console.error('Помилка завантаження замовлень:', err);
            setLoading(false);
        }
    }, [dishDetails]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

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

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:8080/api/orders/${orderId}/status`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 200) {
                setOrders(prevOrders =>
                    prevOrders.map(order => {
                        if (order.id === orderId) {
                            return { ...order, status: newStatus };
                        }
                        return order;
                    })
                );
                fetchOrders();
            } else {
                setError(`Не вдалося оновити статус замовлення з ID ${orderId}. Код помилки: ${response.status}`);
                console.error(`Помилка оновлення статусу замовлення ${orderId}:`, response);
            }

        } catch (err) {
            setError(`Не вдалося оновити статус замовлення з ID ${orderId}.`);
            console.error(`Помилка оновлення статусу замовлення ${orderId}:`, err);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (error) {
            console.error("Error parsing date:", dateString, error);
            return 'Invalid Date';
        }
    };

    if (loading) {
        return <div>Завантаження замовлень...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="admin-orders-page">
            <h2>Перегляд замовлень</h2>
            <div className="admin-orders-actions">
                <Link to="/admin/archive" className="nav-buttons a">
                    Архів
                </Link>
            </div>
            {orders.length === 0 ? (
                <p>Немає активних замовлень.</p>
            ) : (
                <ul className="orders-list">
                    {orders.map(order => (
                        <li key={order.id} className="order-item">
                            <p>ID замовлення: {order.id}</p>
                            <p>Користувач: {userNames[order.userId] || "Завантаження..."}</p>
                            <p>Дата створення: {formatDate(orderDates[order.id])}</p>
                            <p>Дата оновлення: {formatDate(updatedAtDates[order.id])}</p>
                            <p>Повна ціна: {order.fullPrice} грн</p>
                            <p>Страви: {getDishNamesForOrder(order.dishIds)}</p>
                            <p>Додаткова інформація: {order.addition || 'Відсутня'}</p>
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
                            <div className="status-control">
                                <label>Статус:</label>
                                <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="CANCELED">CANCELED</option>
                                </select>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminOrdersPage;