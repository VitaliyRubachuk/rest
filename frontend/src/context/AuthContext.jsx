import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUserFromToken = () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const decodedToken = jwtDecode(storedToken);
                    const currentTime = Date.now() / 1000;
                    if (decodedToken.exp < currentTime) {
                        console.warn("Термін дії токена минув.");
                        logout();
                        return;
                    }

                    setUser({
                        id: decodedToken.id,
                        email: decodedToken.sub,
                        role: decodedToken.role,
                        name: decodedToken.name || '',
                    });
                    setToken(storedToken);
                } catch (error) {
                    console.error("Помилка декодування токена:", error);
                    logout();
                }
            }
            setLoading(false);
        };

        loadUserFromToken();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', { email, password });
            const data = response.data;

            localStorage.setItem('token', data.accessToken);
            setToken(data.accessToken);
            const decodedToken = jwtDecode(data.accessToken);
            setUser({
                id: decodedToken.id,
                email: decodedToken.sub,
                role: decodedToken.role,
                name: decodedToken.name || '',
            });
            navigate('/');
        } catch (error) {
            console.error("Помилка під час логіну:", error.response?.status, error.response?.data || error.message);
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    // Оновлена функція updateUser для обробки нового токена
    const updateUser = (updatedUserData, newToken = null) => {
        setUser(prevUser => ({
            ...prevUser,
            ...updatedUserData
        }));
        if (newToken) {
            localStorage.setItem('token', newToken);
            setToken(newToken);
        }
    };


    const isAuthenticated = !!user;

    const value = { user, token, login, logout, loading, isAuthenticated, updateUser };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {loading && <div>Завантаження...</div>}
        </AuthContext.Provider>
    );
};