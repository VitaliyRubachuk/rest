import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../css/AddDishModal.css';

const AddDishModal = ({ onClose, isOpen, onDishAdded, setIsAddDishModalOpen }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [imageSourceType, setImageSourceType] = useState('file');

    const { token } = useContext(AuthContext);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (setIsAddDishModalOpen) {
            setIsAddDishModalOpen(isOpen);
        }
        if (!isOpen) {
            setName('');
            setCategory('');
            setPrice('');
            setDescription('');
            setImageFile(null);
            setImageUrl('');
            setImagePreview('');
            setImageSourceType('file');
            setError('');
            setSuccessMessage('');
        }
    }, [isOpen, setIsAddDishModalOpen]);

    useEffect(() => {
        if (imageSourceType === 'file' && imageFile) {
            setImagePreview(URL.createObjectURL(imageFile));
        } else if (imageSourceType === 'url' && imageUrl) {
            setImagePreview(imageUrl);
        } else {
            setImagePreview('');
        }
        if (error.includes('зображення')) {
            setError('');
        }
    }, [imageFile, imageUrl, imageSourceType]);


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

        if (imageSourceType === 'file' && !imageFile) {
            setError('Будь ласка, виберіть файл зображення.');
            return;
        }
        if (imageSourceType === 'url' && !imageUrl) {
            setError('Будь ласка, введіть URL зображення.');
            return;
        }
        if (imageSourceType === 'file' && imageFile && !imageFile.type.startsWith('image/')) {
            setError('Будь ласка, виберіть коректний файл зображення (JPEG, PNG, GIF).');
            return;
        }


        const formData = new FormData();

        const dishData = {
            name,
            category,
            price: parseFloat(price).toFixed(2),
            description,
        };

        if (imageSourceType === 'file' && imageFile) {
            formData.append('image', imageFile);
        } else if (imageSourceType === 'url' && imageUrl) {
            dishData.imageUrl = imageUrl;
        }

        formData.append('dish', new Blob([JSON.stringify(dishData)], { type: 'application/json' }));


        try {
            const response = await fetch('http://localhost:8080/api/dishes', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                setSuccessMessage('Страва успішно створена!');
                setTimeout(() => {
                    onClose();
                    window.location.reload();
                }, 1500);
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Помилка при розборі відповіді сервера.' }));
                let errorMessage = errorData.message || 'Помилка при створенні страви.';
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    errorMessage = errorData.errors.map(err => err.field ? `${err.field}: ${err.defaultMessage}` : err.defaultMessage || err).join('; ');
                } else if (typeof errorData.error === 'string') {
                    errorMessage = errorData.error;
                }
                setError(errorMessage);
            }
        } catch (err) {
            setError('Сталася помилка мережі або сервера. Спробуйте пізніше.');
            console.error('Помилка створення страви:', err);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Створити страву</h2>
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Назва:</label>
                        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="category">Категорія:</label>
                        <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="price">Ціна (грн):</label>
                        <input type="number" id="price" value={price} step="0.01" min="0.01" onChange={(e) => setPrice(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Опис:</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>Виберіть джерело зображення:</label>
                        <div className="radio-group">
                            <label>
                                <input
                                    type="radio"
                                    value="file"
                                    checked={imageSourceType === 'file'}
                                    onChange={() => setImageSourceType('file')}
                                />
                                Завантажити файл
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="url"
                                    checked={imageSourceType === 'url'}
                                    onChange={() => setImageSourceType('url')}
                                />
                                Вставити URL
                            </label>
                        </div>
                    </div>

                    {imageSourceType === 'file' && (
                        <div className="form-group">
                            <label htmlFor="image-file">Фото страви (файл):</label>
                            <input
                                type="file"
                                id="image-file"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleImageFileChange}
                            />
                        </div>
                    )}

                    {imageSourceType === 'url' && (
                        <div className="form-group">
                            <label htmlFor="image-url">Фото страви (URL):</label>
                            <input
                                type="text"
                                id="image-url"
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
                        <button type="submit">Зберегти</button>
                        <button type="button" onClick={onClose}>Скасувати</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDishModal;