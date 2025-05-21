import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../css/MyOrders.css';

const MyOrders = () => {
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);
    const viewedOrdersRef = useRef(new Set());
    const [dishDetails, setDishDetails] = useState({});

    const fetchDishDetails = async (dishId) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/dishes/${dishId}`);
            setDishDetails(prev => ({ ...prev, [dishId]: response.data }));
        } catch (error) {
            console.error(`Помилка отримання деталей страви з ID ${dishId}:`, error);
        }
    };

    useEffect(() => {
        const fetchActiveOrders = async () => {
            setLoading(true);
            setError('');

            if (!token) {
                setError('Для перегляду замовлень необхідно увійти в систему.');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://localhost:8080/api/orders/my', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 200 && response.data && Array.isArray(response.data.orders)) {
                    setActiveOrders(response.data.orders);
                    response.data.orders.forEach(order => {
                        order.dishIds.forEach(dishId => {
                            if (!dishDetails[dishId]) {
                                fetchDishDetails(dishId);
                            }
                        });
                        if ((order.status === 'COMPLETED' || order.status === 'CANCELED') && !viewedOrdersRef.current.has(order.id)) {
                            markOrderAsViewed(order.id);
                            viewedOrdersRef.current.add(order.id);
                        }
                    });
                } else {
                    setError('Не вдалося отримати активні замовлення: неочікувана структура даних.');
                    console.error('Неочікувана структура даних:', response.data);
                }
            } catch (error) {
                setError('Не вдалося завантажити ваші активні замовлення. Будь ласка, перевірте підключення до мережі або спробуйте пізніше.');
                console.error('Помилка при завантаженні активних замовлень:', error);
            } finally {
                setLoading(false);
            }
        };

        const markOrderAsViewed = async (orderId) => {
            if (!token) return;
            try {
                await axios.put(`http://localhost:8080/api/orders/${orderId}/viewed`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                console.log(`Замовлення ${orderId} позначено як переглянуте.`);
            } catch (error) {
                console.error(`Помилка при позначенні замовлення ${orderId} як переглянутого:`, error);
            }
        };

        fetchActiveOrders();
    }, [token]);

    useEffect(() => {
        if (!loading && activeOrders.length > 0) {
            activeOrders.forEach(order => {
                order.dishIds.forEach(dishId => {
                    if (!dishDetails[dishId]) {
                        fetchDishDetails(dishId);
                    }
                });
                if ((order.status === 'COMPLETED' || order.status === 'CANCELED') && !viewedOrdersRef.current.has(order.id)) {
                    markOrderAsViewed(order.id);
                    viewedOrdersRef.current.add(order.id);
                }
            });
        }
    }, [loading, activeOrders, token, dishDetails]);

    const getDishNamesForOrder = (dishIds) => {
        return dishIds.map(id => dishDetails[id]?.name || 'Завантаження...').join(', ');
    };

    if (loading) {
        return <div className="loading-indicator">Завантаження ваших активних замовлень...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (activeOrders.length === 0) {
        return (
            <div className="my-orders-wrapper">
                <h2>Ваші активні замовлення</h2>
                <p className="no-orders">Немає активних замовлень.</p>
                <p>Переглянути <Link to="/my-orders/archive">архів замовлень</Link>.</p>
            </div>
        );
    }

    return (
        <div className="my-orders-wrapper">
            <h2>Ваші активні замовлення</h2>
            <ul className="orders-list">
                {activeOrders.map((order) => (
                    <li
                        key={order.id}
                        className={`order-item1 ${order.status === 'COMPLETED' ? 'completed' : ''} ${order.status === 'CANCELED' ? 'canceled' : ''}`}
                    >
                        <p><strong>ID замовлення:</strong> {order.id}</p>
                        <p><strong>ID користувача:</strong> {order.userId}</p>
                        <p>
                            <strong>Страви:</strong>
                            {order.dishIds && order.dishIds.length > 0
                                ? getDishNamesForOrder(order.dishIds)
                                : 'Відсутні'}
                        </p>
                        <p>
                            <strong>Загальна ціна:</strong>
                            {order.fullPrice !== null ? `${order.fullPrice} UAH` : 'Інформація відсутня'}
                        </p>
                        <p><strong>Додаткова інформація:</strong> {order.addition || 'Відсутня'}</p>
                        <p><strong>Статус:</strong> {order.status || 'Невідомо'}</p>
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
            <p>Переглянути <Link to="/my-orders/archive">архів замовлень</Link>.</p>
        </div>
    );
};

export default MyOrders;