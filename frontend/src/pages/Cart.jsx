import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/Cart.css';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
    const { isAuthenticated } = useContext(AuthContext);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [addition, setAddition] = useState('');
    const [isDelivery, setIsDelivery] = useState(true);
    const [tableNumber, setTableNumber] = useState('');
    const [deliveryDetails, setDeliveryDetails] = useState({
        city: '',
        street: '',
        houseNumber: '',
        apartmentNumber: '',
        phoneNumber: ''
    });

    const navigate = useNavigate();

    const handleRemoveFromCart = (dishId) => {
        removeFromCart(dishId);
    };

    const handleQuantityChange = (dishId, quantity) => {
        updateQuantity(dishId, Number(quantity));
    };

    const handleDeliveryChange = (e) => {
        setIsDelivery(e.target.value === 'delivery');
        setTableNumber('');
        setDeliveryDetails({
            city: '',
            street: '',
            houseNumber: '',
            apartmentNumber: '',
            phoneNumber: ''
        });
    };

    const handleDeliveryInputChange = (e) => {
        const { name, value } = e.target;
        setDeliveryDetails(prev => ({ ...prev, [name]: value }));
    };

    const calculateTotalPrice = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
    };

    const handlePlaceOrder = async () => {
        setSuccessMessage('');
        setErrorMessage('');

        if (cart.length === 0) {
            setErrorMessage('Ваш кошик порожній. Будь ласка, додайте страви, щоб оформити замовлення.');
            return;
        }

        if (!isAuthenticated) {
            setErrorMessage('Будь ласка, увійдіть або зареєструйтесь, щоб оформити замовлення.');
            return;
        }

        let dishIds = [];
        cart.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                dishIds.push(item.id);
            }
        });

        const orderData = {
            dishIds: dishIds,
            addition: addition,
            isDelivery: isDelivery
        };

        if (isDelivery) {
            if (!deliveryDetails.city || !deliveryDetails.street || !deliveryDetails.houseNumber || !deliveryDetails.phoneNumber) {
                setErrorMessage('Будь ласка, заповніть всі обов\'язкові поля для доставки (місто, вулиця, номер будинку, номер телефону).');
                return;
            }
            Object.assign(orderData, deliveryDetails);
        } else {
            if (!tableNumber) {
                setErrorMessage('Будь ласка, вкажіть номер столу для замовлення в закладі.');
                return;
            }
            orderData.tableNumber = parseInt(tableNumber);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8080/api/orders',
                orderData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.status === 201 || response.status === 200) {
                console.log('Замовлення успішно створено:', response.data);
                setSuccessMessage('Замовлення успішно оформлене! Дякуємо за покупку!');
                setErrorMessage('');
                setAddition('');
                setTableNumber('');
                setDeliveryDetails({ city: '', street: '', houseNumber: '', apartmentNumber: '', phoneNumber: '' });
                clearCart();
            } else {
                setErrorMessage('Виникла невідома помилка при оформленні замовлення.');
            }

        } catch (error) {
            console.error('Помилка при створенні замовлення:', error);
            setSuccessMessage('');

            if (axios.isAxiosError(error) && error.response) {
                if (error.response.data && error.response.data.errors) {
                    setErrorMessage('Помилка валідації: ' + error.response.data.errors.map(err => err.defaultMessage || err).join(', '));
                } else if (error.response.data && error.response.data.error) {
                    setErrorMessage(error.response.data.error);
                } else {
                    setErrorMessage(`Помилка: ${error.response.status} - ${error.response.statusText || 'Невідома помилка сервера'}`);
                }
            } else {
                setErrorMessage('Помилка при з’єднанні з сервером. Перевірте ваше інтернет-з’єднання.');
            }
        }
    };

    return (
        <div className="cart-wrapper">
            <h2>Ваш кошик</h2>
            {successMessage && (
                <div className="order-status success">
                    {successMessage}
                    <button onClick={() => navigate('/my-orders')} className="order-status-link-button">
                        Перейти в мої замовлення
                    </button>
                </div>
            )}
            {errorMessage && <div className="order-status error">{errorMessage}</div>}

            {cart.length === 0 ? (
                <div className="cart-empty">
                    Ваш кошик порожній.
                </div>
            ) : (
                <ul className="cart-items">
                    {cart.map(item => (
                        <li key={item.id} className="cart-item">
                            <div className="item-details">
                                <h4>{item.name}</h4>
                                <p>Ціна: {item.price} грн</p>
                            </div>
                            <div className="item-quantity">
                                <label>Кількість:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                />
                            </div>
                            <button onClick={() => handleRemoveFromCart(item.id)} className="remove-button">
                                Видалити
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="cart-total">
                Загальна сума: {calculateTotalPrice()} грн
            </div>

            {!isAuthenticated ? (
                <div className="order-form-section">
                    <h3>Щоб оформити замовлення, будь ласка:</h3>
                    <div className="auth-prompt">
                        <button onClick={() => navigate('/login')} className="auth-button">Увійдіть</button>
                        <span>або</span>
                        <button onClick={() => navigate('/register')} className="auth-button">Зареєструйтесь</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="order-form-section">
                        <h3>Виберіть тип замовлення:</h3>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    value="delivery"
                                    checked={isDelivery}
                                    onChange={handleDeliveryChange}
                                />
                                Доставка
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="dineIn"
                                    checked={!isDelivery}
                                    onChange={handleDeliveryChange}
                                />
                                В закладі
                            </label>
                        </div>
                    </div>

                    {isDelivery ? (
                        <div className="order-form-section">
                            <h3>Деталі доставки:</h3>
                            <div className="form-group">
                                <label htmlFor="deliveryCity">Місто*</label>
                                <input
                                    type="text"
                                    id="deliveryCity"
                                    name="city"
                                    placeholder="Місто"
                                    value={deliveryDetails.city}
                                    onChange={handleDeliveryInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="deliveryStreet">Вулиця*</label>
                                <input
                                    type="text"
                                    id="deliveryStreet"
                                    name="street"
                                    placeholder="Вулиця"
                                    value={deliveryDetails.street}
                                    onChange={handleDeliveryInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="deliveryHouseNumber">Номер будинку*</label>
                                <input
                                    type="text"
                                    id="deliveryHouseNumber"
                                    name="houseNumber"
                                    placeholder="Номер будинку"
                                    value={deliveryDetails.houseNumber}
                                    onChange={handleDeliveryInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="deliveryApartmentNumber">Номер квартири (необов'язково)</label>
                                <input
                                    type="text"
                                    id="deliveryApartmentNumber"
                                    name="apartmentNumber"
                                    placeholder="Номер квартири"
                                    value={deliveryDetails.apartmentNumber}
                                    onChange={handleDeliveryInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phoneNumber">Номер телефону*</label>
                                <input
                                    type="text"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    placeholder="+380XXXXXXXXX"
                                    value={deliveryDetails.phoneNumber}
                                    onChange={handleDeliveryInputChange}
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="order-form-section">
                            <h3>Замовлення в закладі:</h3>
                            <div className="form-group">
                                <label htmlFor="tableNumber">Номер столу*</label>
                                <input
                                    type="number"
                                    id="tableNumber"
                                    placeholder="Номер столу"
                                    value={tableNumber}
                                    onChange={(e) => setTableNumber(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="order-form-section">
                        <div className="form-group">
                            <label htmlFor="addition">Додаткова інформація:</label>
                            <textarea
                                id="addition"
                                value={addition}
                                onChange={(e) => setAddition(e.target.value)}
                                placeholder="Ваші побажання до замовлення (наприклад, 'без цибулі')"
                            />
                        </div>
                    </div>

                    <div className="cart-actions">
                        <button onClick={handlePlaceOrder} className="place-order-button">
                            Оформити замовлення
                        </button>
                        <button onClick={clearCart} className="clear-cart-button">
                            Очистити кошик
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;