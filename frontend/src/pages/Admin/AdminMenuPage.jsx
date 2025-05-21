import React, { useState } from 'react';
import Menu from '../Menu';
import AddDishModal from '../../components/AddDishModal';
import { useMenuUpdate } from '../../context/MenuUpdateContext';
import { AuthContext } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminMenuPage = ({ setIsAddDishModalOpen, setIsEditModalOpen, setIsReviewsModalOpen }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, loading } = React.useContext(AuthContext);
    const { triggerMenuUpdate } = useMenuUpdate();

    React.useEffect(() => {
        setIsAddDishModalOpen(isModalOpen);
    }, [isModalOpen, setIsAddDishModalOpen]);

    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Завантаження даних користувача...</div>;
    }

    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleDishAdded = () => {
        triggerMenuUpdate();
        closeModal();
    };

    return (
        <div className="admin-menu-page-wrapper">
            <div className="admin-menu-page-content">
                <h2>Панель адміністратора меню</h2>
                <button onClick={openModal}>Додати нову страву</button>
                {isModalOpen && (
                    <AddDishModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        onDishAdded={triggerMenuUpdate}
                        setIsAddDishModalOpen={setIsAddDishModalOpen}
                    />
                )}
                <Menu
                    setIsEditModalOpen={setIsEditModalOpen}
                    setIsReviewsModalOpen={setIsReviewsModalOpen}
                />
            </div>
        </div>
    );
};

export default AdminMenuPage;