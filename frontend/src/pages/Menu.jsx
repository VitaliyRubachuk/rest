import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import '../css/Menu.css';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useMenuUpdate } from '../context/MenuUpdateContext';
import EditDishModal from '../components/EditDishModal';
import DishReviews from '../components/DishReviews';
import { useNavigate, Link } from 'react-router-dom';

const Menu = ({ setIsEditModalOpen, setIsReviewsModalOpen }) => {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart } = useContext(CartContext);
    const { user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isLocalEditModalOpen, setIsLocalEditModalOpen] = useState(false);
    const [editingDish, setEditingDish] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState('');
    const [isLocalReviewsModalOpen, setIsLocalReviewsModalOpen] = useState(false);
    const [currentDishId, setCurrentDishId] = useState(null);

    const [sortBy, setSortBy] = useState('none');

    const { menuUpdateTrigger, triggerMenuUpdate } = useMenuUpdate();

    useEffect(() => {
        setIsEditModalOpen(isLocalEditModalOpen);
    }, [isLocalEditModalOpen, setIsEditModalOpen]);

    useEffect(() => {
        setIsReviewsModalOpen(isLocalReviewsModalOpen);
    }, [isLocalReviewsModalOpen, setIsReviewsModalOpen]);

    const fetchMenu = useCallback(() => {
        setLoading(true);
        axios.get('http://localhost:8080/api/dishes')
            .then(res => {
                if (res.data && Array.isArray(res.data.dishes)) {
                    setMenu(res.data.dishes);
                    setError(null);
                } else {
                    setError('Неочікуваний формат даних меню.');
                    setMenu([]);
                }
            })
            .catch(err => {
                setError('Не вдалося завантажити меню. Будь ласка, спробуйте пізніше.');
                setMenu([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu, menuUpdateTrigger]);

    useEffect(() => {
        if (menu.length > 0) {
            const categories = [...new Set(menu.map(item => item.category))];
            categories.forEach(category => {
                const categoryClass = category.replace(/\s+/g, '-').toLowerCase();
                const categoryElement = document.querySelector(`.category.${categoryClass}`);
                if (categoryElement && !categoryElement.classList.contains('open')) {
                    categoryElement.classList.add('open');
                }
            });
        }
    }, [menu]);

    const handleCategoryClick = (event) => {
        const parent = event.target.parentElement;
        parent.classList.toggle('open');

        const filterInput = document.querySelector('.menu-filter');
        const filter = filterInput ? filterInput.value.toLowerCase() : '';

        parent.querySelectorAll('.menu-item').forEach(item => {
            const nameElement = item.querySelector('h4');
            if (nameElement) {
                const name = nameElement.textContent.toLowerCase();
                const isCategoryOpen = parent.classList.contains('open');
                if (name.includes(filter) && isCategoryOpen) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    };

    const handleFilterInput = (e) => {
        const filter = e.target.value.toLowerCase();
        document.querySelectorAll('.category').forEach(categoryElement => {
            categoryElement.querySelectorAll('.menu-item').forEach(item => {
                const nameElement = item.querySelector('h4');
                if (nameElement) {
                    const name = nameElement.textContent.toLowerCase();
                    const isCategoryOpen = categoryElement.classList.contains('open');
                    if (name.includes(filter) && isCategoryOpen) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    };

    const handleAddToCart = (dish) => {
        addToCart(dish);
    };

    const openEditModal = useCallback((dish) => {
        setEditingDish(dish);
        setIsLocalEditModalOpen(true);
    }, []);

    const closeEditModal = () => {
        setIsLocalEditModalOpen(false);
        setEditingDish(null);
    };

    const openReviewsModal = (dishId) => {
        setCurrentDishId(dishId);
        setIsLocalReviewsModalOpen(true);
    };

    const closeReviewsModal = () => {
        setIsLocalReviewsModalOpen(false);
        setCurrentDishId(null);
    };

    const handleDeleteDish = useCallback(async (dishId) => {
        if (!window.confirm(`Ви впевнені, що хочете видалити страву з ID ${dishId}?`)) {
            return;
        }

        setDeleteError('');
        setDeleteSuccess('');

        if (!user || !token) {
            setDeleteError("Помилка: Не вдалося отримати дані користувача або токен для виконання запиту. Спробуйте перелогінитись.");
            setTimeout(() => setDeleteError(''), 5000);
            if (logout) logout();
            return;
        }

        try {
            const response = await axios.delete(`http://localhost:8080/api/dishes/${dishId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 200) {
                setDeleteSuccess('Страва успішно видалена.');
                triggerMenuUpdate();
                setTimeout(() => setDeleteSuccess(''), 3000);
            } else {
                setDeleteError(`Неочікуваний успіх зі статусом ${response.status}`);
                setTimeout(() => setDeleteError(''), 5000);
            }

        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;

                if (status === 403) {
                    setDeleteError('Відмовлено у доступі (403). Можливо, ваш сеанс закінчився або ви не маєте ролі ADMIN. Спробуйте перелогінитись.');
                } else if (status === 401) {
                    setDeleteError('Неавторизовано (401). Будь ласка, увійдіть у систему знову.');
                    if (logout) logout();
                }
                else {
                    setDeleteError(errorData?.message || `Помилка сервера: ${status} ${error.response.statusText}`);
                }
            } else if (error.request) {
                setDeleteError('Помилка мережі: Сервер не відповідає.');
            } else {
                setDeleteError('Невідома помилка при відправці запиту.');
            }
            setTimeout(() => setDeleteError(''), 5000);
        }
    }, [user, token, triggerMenuUpdate, logout]);

    const getSortedMenu = () => {
        let sortedMenu = [...menu];

        switch (sortBy) {
            case 'priceAsc':
                sortedMenu.sort((a, b) => a.price - b.price);
                break;
            case 'priceDesc':
                sortedMenu.sort((a, b) => b.price - a.price);
                break;
            case 'nameAsc':
                sortedMenu.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'nameDesc':
                sortedMenu.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                break;
        }
        return sortedMenu;
    };

    const categories = menu.length > 0 ? [...new Set(getSortedMenu().map(item => item.category))] : [];

    const isUserLoggedIn = !!user;

    if (loading) {
        return (
            <div className="menu-page-wrapper">
                <div className="menu-page">
                    <p>Завантаження меню...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="menu-page-wrapper">
                <div className="menu-page">
                    <p className="error-message">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="menu-page-wrapper">
            <div className="menu-page">
                <h2>Меню ресторану</h2>
                <div className="menu-controls">
                    <input
                        type="text"
                        placeholder="Пошук страв..."
                        className="menu-filter"
                        onInput={handleFilterInput}
                    />
                    <div className="sort-container">
                        <select
                            id="sort-select"
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="none">Без сортування</option>
                            <option value="priceAsc">За ціною (від низької до високої)</option>
                            <option value="priceDesc">За ціною (від високої до низької)</option>
                            <option value="nameAsc">За назвою (А-Я)</option>
                            <option value="nameDesc">За назвою (Я-А)</option>
                        </select>
                    </div>
                </div>

                {!isUserLoggedIn && (
                    <p className="auth-prompt-message">
                        Щоб зробити замовлення, будь ласка,
                        <Link to="/login" className="auth-link"> увійдіть</Link> або
                        <Link to="/register" className="auth-link"> зареєструйтесь</Link>.
                    </p>
                )}

                {deleteError && <div className="error-message">{deleteError}</div>}
                {deleteSuccess && <div className="success-message">{deleteSuccess}</div>}

                <div id="menu">
                    {categories.map(category => (
                        <div className={`category ${category.replace(/\s+/g, '-').toLowerCase()}`} key={category}>
                            <h3
                                onClick={handleCategoryClick}
                                role="button"
                                tabIndex="0"
                                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(e); }}
                            >
                                {category}
                            </h3>
                            <div className="menu-items-container">
                                {getSortedMenu()
                                    .filter(dish => dish.category === category)
                                    .map(product => {
                                        const imageUrl = product.imageUrl;
                                        let finalSrc = '';

                                        if (imageUrl) {
                                            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                                                finalSrc = imageUrl;
                                            } else {
                                                finalSrc = `http://localhost:8080${imageUrl}`;
                                            }
                                        }

                                        return (
                                            <div className="menu-item" key={product.id}>
                                                {finalSrc && (
                                                    <img
                                                        src={finalSrc}
                                                        alt={product.name}
                                                        className="dish-image"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                                <div className="menu-item-content">
                                                    <h4>{product.name}</h4>
                                                    <p>Ціна: {parseFloat(product.price).toFixed(2)} грн</p>
                                                    <p>Опис: {product.description || "Опис відсутній"}</p>
                                                    <div className="button-container">
                                                        <button
                                                            className="neo-button"
                                                            onClick={() => handleAddToCart(product)}
                                                            disabled={!isUserLoggedIn}
                                                        >
                                                            Зробити замовлення
                                                        </button>
                                                        <button
                                                            className="neo-button"
                                                            aria-label={`Коментарі до ${product.name}`}
                                                            onClick={() => openReviewsModal(product.id)}
                                                        >
                                                            💬
                                                        </button>
                                                        {user?.role === 'ADMIN' && (
                                                            <>
                                                                <button
                                                                    className="neo-button admin-button"
                                                                    aria-label={`Редагувати ${product.name}`}
                                                                    onClick={() => openEditModal(product)}
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    className="neo-button delete-button admin-button"
                                                                    aria-label={`Видалити ${product.name}`}
                                                                    onClick={() => handleDeleteDish(product.id)}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                    {menu.length === 0 && !loading && !error && <p>Наразі меню порожнє.</p>}
                    {menu.length > 0 && categories.length === 0 && !loading && !error && <p>Страв, що відповідають фільтру, не знайдено.</p>}
                </div>
            </div>

            {isLocalEditModalOpen && editingDish && (
                <EditDishModal
                    isOpen={isLocalEditModalOpen}
                    onClose={closeEditModal}
                    dish={editingDish}
                    onDishUpdated={triggerMenuUpdate}
                />
            )}

            {isLocalReviewsModalOpen && (
                <DishReviews
                    dishId={currentDishId}
                    onClose={closeReviewsModal}
                />
            )}
        </div>
    );
};

export default Menu;