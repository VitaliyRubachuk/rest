import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../css/MyOrders.css';

const MyArchiveOrders = () => {
    const [archivedOrders, setArchivedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);
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
        const fetchArchivedOrders = async () => {
            setLoading(true);
            setError('');

            if (!token) {
                setError('Для перегляду архівних замовлень необхідно увійти в систему.');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://localhost:8080/api/orders/my/archive', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 200) {
                    if (response.data && Array.isArray(response.data.orders)) {
                        setArchivedOrders(response.data.orders);
                        response.data.orders.forEach(order => {
                            order.dishIds.forEach(dishId => {
                                if (!dishDetails[dishId]) {
                                    fetchDishDetails(dishId);
                                }
                            });
                        });
                    } else if (response.data && Array.isArray(response.data)) {
                        setArchivedOrders(response.data);
                        response.data.forEach(order => {
                            order.dishIds.forEach(dishId => {
                                if (!dishDetails[dishId]) {
                                    fetchDishDetails(dishId);
                                }
                            });
                        });
                    } else {
                        setArchivedOrders([]);
                        setError('Не вдалося отримати архівні замовлення: неочікувана структура даних.');
                        console.error('Неочікувана структура даних:', response.data);
                    }
                } else {
                    setError(`Не вдалося отримати архівні замовлення: помилка HTTP ${response.status}`);
                    console.error('Помилка HTTP:', response.status, response.statusText);
                }
            } catch (error) {
                setError('Не вдалося завантажити ваші архівні замовлення. Будь ласка, перевірте підключення до мережі або спробуйте пізніше.');
            } finally {
                setLoading(false);
            }
        };

        fetchArchivedOrders();
    }, [token]);

    const getDishNamesForOrder = (dishIds) => {
        return dishIds.map(id => dishDetails[id]?.name || 'Завантаження...').join(', ');
    };

    if (loading) {
        return <div className="loading-indicator">Завантаження ваших архівних замовлень...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (archivedOrders.length === 0) {
        return (
            <div className="my-orders-wrapper">
                <h2>Ваші архівні замовлення</h2>
                <p className="no-orders">Немає архівних замовлень.</p>
                <p><Link to="/my-orders">Повернутися до активних замовлень</Link>.</p>
            </div>
        );
    }

    return (
        <div className="my-orders-wrapper">
            <h2>Ваші архівні замовлення</h2>
            <ul className="orders-list">
                {archivedOrders.map((order) => (
                    <li key={order.id} className="order-item1">
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
            <p><Link to="/my-orders">Повернутися до активних замовлень</Link>.</p>
        </div>
    );
};

export default MyArchiveOrders;