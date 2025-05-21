import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../css/ProfilePage.css';

const ProfilePage = () => {
    const { user, updateUser } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPasswordChange, setShowPasswordChange] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
        }
    }, [user]);

    const handleNameChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (name.trim() === '') {
            setError('Ім\'я не може бути порожнім.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:8080/api/users/${user.id}`,
                { name: name, email: user.email, password: null },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setMessage('Ім\'я успішно оновлено!');
            setError('');

            // Використовуємо оновлену функцію updateUser, яка також обробляє новий токен
            updateUser(response.data.updatedUser, response.data.newToken); // Передаємо оновлені дані та новий токен
        } catch (err) {
            console.error('Помилка при оновленні імені:', err);
            setError(err.response?.data?.error || 'Не вдалося оновити ім\'я.');
            setMessage('');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (oldPassword.trim() === '' || newPassword.trim() === '' || confirmNewPassword.trim() === '') {
            setError('Всі поля пароля мають бути заповнені.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Новий пароль повинен містити не менше 6 символів.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('Новий пароль та підтвердження не співпадають.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:8080/api/users/${user.id}/password`,
                { oldPassword: oldPassword, newPassword: newPassword },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setMessage('Пароль успішно оновлено!');
            setError('');
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowPasswordChange(false);
        } catch (err) {
            console.error('Помилка при оновленні пароля:', err);
            setError(err.response?.data?.error || 'Не вдалося оновити пароль. Перевірте старий пароль.');
            setMessage('');
        }
    };

    if (!user) {
        return <div className="profile-container">Будь ласка, увійдіть, щоб переглянути свій профіль.</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h2>Ваш профіль</h2>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <div className="profile-info-section">
                    <p>Ім'я: **{user.name}**</p>
                    <p>Email: **{user.email}**</p>
                    <p>Роль: **{user.role}**</p>
                </div>

                <form onSubmit={handleNameChange} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="name">Змінити ім'я:</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="profile-input"
                            required
                        />
                    </div>
                    <button type="submit" className="profile-button">Оновити ім'я</button>
                </form>

                <div className="password-change-section">
                    <button onClick={() => setShowPasswordChange(!showPasswordChange)} className="profile-button password-toggle-button">
                        {showPasswordChange ? 'Приховати зміну пароля' : 'Змінити пароль'}
                    </button>

                    {showPasswordChange && (
                        <form onSubmit={handlePasswordChange} className="profile-form password-form">
                            <div className="form-group">
                                <label htmlFor="oldPassword">Старий пароль:</label>
                                <input
                                    type="password"
                                    id="oldPassword"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="profile-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newPassword">Новий пароль:</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="profile-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmNewPassword">Підтвердіть новий пароль:</label>
                                <input
                                    type="password"
                                    id="confirmNewPassword"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="profile-input"
                                    required
                                />
                            </div>
                            <button type="submit" className="profile-button">Змінити пароль</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;