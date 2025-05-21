import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import '../css/AddDishModal.css';
import { AuthContext } from '../context/AuthContext';
import { useMenuUpdate } from '../context/MenuUpdateContext';

const EditDishModal = ({ isOpen, onClose, dish, onDishUpdated }) => {
    const [name, setName] = useState(dish.name);
    const [category, setCategory] = useState(dish.category);
    const [price, setPrice] = useState(dish.price);
    const [description, setDescription] = useState(dish.description || '');
    const [imageUrl, setImageUrl] = useState(dish.imageUrl || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(dish.imageUrl || '');
    const [imageSourceType, setImageSourceType] = useState(
        dish.imageUrl && (dish.imageUrl.startsWith('http://') || dish.imageUrl.startsWith('https://')) ? 'url' : 'file'
    );

    const { token } = useContext(AuthContext);
    const { triggerMenuUpdate } = useMenuUpdate();

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isOpen && dish) {
            setName(dish.name);
            setCategory(dish.category);
            setPrice(dish.price);
            setDescription(dish.description || '');
            setImageUrl(dish.imageUrl || '');
            setImageFile(null);
            setImagePreview(dish.imageUrl || '');
            setImageSourceType(
                dish.imageUrl && (dish.imageUrl.startsWith('http://') || dish.imageUrl.startsWith('https://')) ? 'url' : 'file'
            );
            setError('');
            setSuccessMessage('');
        }
    }, [isOpen, dish]);

    useEffect(() => {
        if (imageSourceType === 'file' && imageFile) {
            setImagePreview(URL.createObjectURL(imageFile));
        } else if (imageSourceType === 'url' && imageUrl) {
            setImagePreview(imageUrl);
        } else if (imageSourceType === 'file' && !imageFile && dish.imageUrl && !(dish.imageUrl.startsWith('http://') || dish.imageUrl.startsWith('https://'))) {
            setImagePreview(`http://localhost:8080${dish.imageUrl}`);
        } else if (imageSourceType === 'url' && !imageUrl && dish.imageUrl && (dish.imageUrl.startsWith('http://') || dish.imageUrl.startsWith('https://'))) {
            setImagePreview(dish.imageUrl);
        }
        else {
            setImagePreview('');
        }
    }, [imageFile, imageUrl, imageSourceType, dish.imageUrl]);

    const handleImageFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setError('');
        } else {
            setImageFile(null);
            if (file) {
                setError('Будь ласка, виберіть файл зображення (JPEG, PNG, GIF).');
            }
        }
        setImageUrl('');
    };

    const handleImageUrlChange = (event) => {
        setImageUrl(event.target.value);
        setImageFile(null);
        setError('');
    };


    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!name || !category || !price) {
            setError('Будь ласка, заповніть обов\'язкові поля: назва, категорія, ціна.');
            return;
        }

        const formData = new FormData();

        const dishData = {
            id: dish.id,
            name,
            category,
            price: parseFloat(price).toFixed(2),
            description,
        };

        if (imageSourceType === 'file') {
            if (imageFile) {
                formData.append('image', imageFile);
            } else if (dish.imageUrl && !(dish.imageUrl.startsWith('http://') || dish.imageUrl.startsWith('https://'))) {
                dishData.imageUrl = dish.imageUrl;
            } else {
                dishData.imageUrl = null;
            }
        } else if (imageSourceType === 'url') {
            dishData.imageUrl = imageUrl;
        }

        formData.append('dish', new Blob([JSON.stringify(dishData)], { type: 'application/json' }));

        try {
            const response = await axios.put(`http://localhost:8080/api/dishes/${dish.id}`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                setSuccessMessage('Страва успішно оновлена!');
                triggerMenuUpdate();
                setTimeout(() => {
                    onClose();
                    if (onDishUpdated) onDishUpdated();
                }, 1500);
            } else {
                const errorData = response.data || {};
                let errorMessage = errorData.message || 'Помилка при оновленні страви.';
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorMessage = errorData.errors.map(err => err.field ? `${err.field}: ${err.defaultMessage}` : err.defaultMessage || err).join('; ');
                } else if (typeof errorData.error === 'string') {
                    errorMessage = errorData.error;
                }
                setError(errorMessage);
            }
        } catch (err) {
            console.error('Помилка оновлення страви:', err);
            if (err.response) {
                const status = err.response.status;
                if (status === 401 || status === 403) {
                    setError('Неавторизовано. Будь ласка, увійдіть знову.');
                } else {
                    setError(err.response.data?.message || `Помилка сервера: ${status}`);
                }
            } else if (err.request) {
                setError('Помилка мережі: Сервер не відповідає.');
            } else {
                setError('Невідома помилка при відправці запиту.');
            }
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Редагувати страву</h2>
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="edit-name">Назва:</label>
                        <input type="text" id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-category">Категорія:</label>
                        <input type="text" id="edit-category" value={category} onChange={(e) => setCategory(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-price">Ціна (грн):</label>
                        <input type="number" id="edit-price" value={price} step="0.01" min="0.01" onChange={(e) => setPrice(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-description">Опис:</label>
                        <textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>Виберіть джерело зображення:</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    value="file"
                                    checked={imageSourceType === 'file'}
                                    onChange={() => {
                                        setImageSourceType('file');
                                        setImageUrl('');
                                    }}
                                />
                                Завантажити файл
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="url"
                                    checked={imageSourceType === 'url'}
                                    onChange={() => {
                                        setImageSourceType('url');
                                        setImageFile(null);
                                    }}
                                />
                                Вставити URL
                            </label>
                        </div>
                    </div>

                    {imageSourceType === 'file' && (
                        <div className="form-group">
                            <label htmlFor="edit-image-file">Фото страви (файл):</label>
                            <input
                                type="file"
                                id="edit-image-file"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleImageFileChange}
                            />
                        </div>
                    )}

                    {imageSourceType === 'url' && (
                        <div className="form-group">
                            <label htmlFor="edit-image-url">Фото страви (URL):</label>
                            <input
                                type="text"
                                id="edit-image-url"
                                value={imageUrl}
                                onChange={handleImageUrlChange}
                                placeholder="Наприклад: https://example.com/image.jpg"
                            />
                        </div>
                    )}

                    {imagePreview && (
                        <div className="image-preview">
                            <img src={imagePreview} alt="Попередній перегляд" />
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="submit">Зберегти зміни</button>
                        <button type="button" onClick={onClose}>Скасувати</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDishModal;