import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useMenuUpdate } from '../context/MenuUpdateContext';
import AddDishModal from '../components/AddDishModal';
import '../css/Header.css';
import logoImage from '../../image/logo.png';
import settingsIcon from '../../image/profile-user.png';

export default function Header() {
    const { user, logout } = useContext(AuthContext);
    const { cart } = useContext(CartContext);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isCreateDishModalOpen, setIsCreateDishModalOpen] = useState(false);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const adminPanelRef = useRef(null);
    const adminButtonRef = useRef(null);
    const settingsMenuRef = useRef(null);
    const settingsButtonRef = useRef(null);
    const navigate = useNavigate();

    const { triggerMenuUpdate } = useMenuUpdate();


    const toggleAdminPanel = () => {
        setIsAdminPanelOpen(!isAdminPanelOpen);
        if (adminButtonRef.current) {
            adminButtonRef.current.classList.toggle('active');
        }
        setIsSettingsMenuOpen(false);
    };

    const openCreateDishModal = () => {
        setIsCreateDishModalOpen(true);
        setIsAdminPanelOpen(false);
        if (adminButtonRef.current && adminButtonRef.current.classList.contains('active')) {
            adminButtonRef.current.classList.remove('active');
        }
    };

    const closeCreateDishModal = () => {
        setIsCreateDishModalOpen(false);
        console.log('Header: Add dish modal closed.');
    };


    const handleViewOrders = () => {
        navigate('/admin/orders');
        setIsAdminPanelOpen(false);
        if (adminButtonRef.current) {
            adminButtonRef.current.classList.remove('active');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSettingsMenu = () => {
        setIsSettingsMenuOpen(!isSettingsMenuOpen);
        setIsAdminPanelOpen(false);
    };

    const handleClickOutside = (event) => {
        if (adminPanelRef.current && !adminPanelRef.current.contains(event.target) && isAdminPanelOpen) {
            setIsAdminPanelOpen(false);
            if (adminButtonRef.current) {
                adminButtonRef.current.classList.remove('active');
            }
        }
        if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target) && isSettingsMenuOpen && settingsButtonRef.current && !settingsButtonRef.current.contains(event.target)) {
            setIsSettingsMenuOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [adminPanelRef, isAdminPanelOpen, settingsMenuRef, isSettingsMenuOpen, settingsButtonRef]);

    return (
        <header className="site-header">
            <div className="header-content">
                <div className="logo">
                    <Link to="/">
                        <img src={logoImage} alt="Логотип Il Gambero Rosso" />
                        <span>Il Gambero Rosso</span>
                    </Link>
                </div>
                <nav className="nav-buttons">
                    {user?.role === 'ADMIN' && (
                        <div className="admin-dropdown" ref={adminPanelRef}>
                            <button onClick={toggleAdminPanel} ref={adminButtonRef}>Admin Panel</button>
                            {isAdminPanelOpen && (
                                <ul className="admin-menu">
                                    <li>
                                        <button onClick={openCreateDishModal} className="admin-menu-button">Створити страву</button>
                                    </li>
                                    <li>
                                        <Link to="/admin/tables" className="admin-menu-button">Керування столиками</Link>
                                    </li>
                                    <li>
                                        <button onClick={handleViewOrders} className="admin-menu-button">Переглянути замовлення</button>
                                    </li>
                                </ul>
                            )}
                        </div>
                    )}
                    <Link to="/menu">Меню</Link>
                    <Link to="/tables">Столики</Link>
                    <Link to="/cart" className="cart-link">
                        Кошик ({cart.reduce((total, item) => total + (item.quantity || 0), 0)})
                    </Link>
                    <div className="settings-dropdown" ref={settingsMenuRef}>
                        <button onClick={toggleSettingsMenu} ref={settingsButtonRef}>
                            <img src={settingsIcon} alt="Налаштування" className="settings-icon" />
                        </button>
                        {isSettingsMenuOpen && (
                            <ul className="settings-menu admin-menu">
                                {user ? (
                                    <>
                                        <li><Link to="/profile">Профіль</Link></li>
                                        <li className="menu-separator"></li>
                                        <li><Link to="/my-orders">Мої замовлення</Link></li>
                                        <li><Link to="/my-tables">Мої столики</Link></li>
                                        <li className="menu-separator"></li>
                                        <li><button onClick={handleLogout} className="nav-buttons-button">Вийти</button></li>
                                    </>
                                ) : (
                                    <>
                                        <li><Link to="/login">Вхід</Link></li>
                                        <li><Link to="/register">Реєстрація</Link></li>
                                    </>
                                )}
                            </ul>
                        )}
                    </div>
                </nav>
            </div>

            {isCreateDishModalOpen && (
                <AddDishModal
                    isOpen={isCreateDishModalOpen}
                    onClose={closeCreateDishModal}
                    onDishAdded={triggerMenuUpdate}
                />
            )}
        </header>
    );
}