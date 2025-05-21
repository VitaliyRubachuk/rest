import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import '../../css/AuthStyles.css';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const registerResponse = await axios.post('http://localhost:8080/api/users', {
                name, email, password, role: 'USER'
            });

            await login(email, password);

        } catch (err) {
            console.error("Register: Помилка при реєстрації або логіні після реєстрації:", err);

            if (err.response && err.response.data) {
                if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                    setError('Помилка валідації: ' + err.response.data.errors.join('; '));
                } else if (err.response.data.error) {
                    setError(err.response.data.error);
                } else {
                    setError(`Помилка реєстрації: ${err.response.status} ${err.response.statusText || ''}`);
                }
            } else if (err.request) {
                setError('Помилка мережі: Сервер не відповідає.');
            }
            else {
                setError('Сталася неочікувана помилка при реєстрації або логіні. Спробуйте пізніше.');
            }
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-title">Реєстрація</h2>
            {error && <p className="auth-error">{error}</p>}
            <form onSubmit={handleSubmit} className="auth-form">
                <input type="text" placeholder="Ім'я" value={name} onChange={(e) => setName(e.target.value)} required className="auth-input" />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
                <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required className="auth-input" />
                <button type="submit" className="auth-button">Зареєструватися</button>
            </form>
        </div>
    );
}