import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../css/DishReviews.css';

const StarRating = ({ rating, onRatingChange, clickable = false }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const displayRating = clickable ? hoverRating || rating : rating;

    return (
        <div className="star-rating">
            {[...Array(5)].map((star, index) => {
                index += 1;
                return (
                    <span
                        key={index}
                        className={index <= displayRating ? "star filled" : "star"}
                        onClick={() => clickable && onRatingChange(index)}
                        onMouseEnter={() => clickable && setHoverRating(index)}
                        onMouseLeave={() => clickable && setHoverRating(0)}
                    >
                        &#9733;
                    </span>
                );
            })}
        </div>
    );
};

const DishReviews = ({ dishId, onClose }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newReview, setNewReview] = useState({ comment: '', rating: 5 });
    const [editingReview, setEditingReview] = useState(null);
    const [editData, setEditData] = useState({ comment: '', rating: 5 });
    const [submitError, setSubmitError] = useState('');
    const { user, token } = useContext(AuthContext);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const config = token ? {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                } : {};

                const response = await axios.get(`http://localhost:8080/api/reviews/dish/${dishId}`, config);
                setReviews(response.data.reviews || []);
                setError('');
            } catch (err) {
                console.error('Помилка завантаження відгуків:', err);
                setError('Не вдалося завантажити відгуки');
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [dishId, token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewReview(prev => ({ ...prev, [name]: value }));
    };

    const handleRatingChange = (newRating) => {
        setNewReview(prev => ({ ...prev, rating: newRating }));
    };

    const handleEditRatingChange = (newRating) => {
        setEditData(prev => ({ ...prev, rating: newRating }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || !token) {
            setSubmitError('Будь ласка, увійдіть, щоб залишити відгук');
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:8080/api/reviews',
                { dishId, ...newReview },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setReviews(prev => [response.data.createdReview, ...prev]);
            setNewReview({ comment: '', rating: 5 });
            setSubmitError('');
        } catch (err) {
            console.error('Помилка додавання відгуку:', err);
            setSubmitError(err.response?.data?.errors ? err.response.data.errors.join(', ') : err.response?.data?.error || 'Не вдалося додати відгук');
        }
    };

    const handleEditReview = (review) => {
        if (user && String(user.id) === String(review.userId)) {
            setEditingReview(review.id);
            setEditData({ comment: review.comment, rating: review.rating });
        } else {
            console.warn('Спроба редагувати чужий відгук без дозволу (фронтенд-перевірка).');
        }
    };

    const handleUpdateReview = async (e) => {
        e.preventDefault();

        if (!user || !token) {
            setSubmitError('Будь ласка, увійдіть для редагування відгуку');
            return;
        }

        try {
            const response = await axios.put(
                `http://localhost:8080/api/reviews/${editingReview}`,
                {
                    comment: editData.comment,
                    rating: parseInt(editData.rating)
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setReviews(prev => prev.map(review =>
                review.id === editingReview ? response.data.updatedReview : review
            ));
            setEditingReview(null);
            setSubmitError('');
        } catch (err) {
            console.error('Помилка оновлення відгуку:', err);
            console.error('Помилка оновлення відгуку (деталі):', err.response?.data);
            setSubmitError(err.response?.data?.errors ? err.response.data.errors.join(', ') : err.response?.data?.error || 'Не вдалося оновити відгук. Перевірте, чи це ваш відгук.');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Ви впевнені, що хочете видалити цей відгук?')) return;

        if (!user || !token || user.role !== 'ADMIN') {
            setSubmitError('У вас немає прав для видалення цього відгуку.');
            return;
        }

        try {
            await axios.delete(`http://localhost:8080/api/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReviews(prev => prev.filter(review => review.id !== reviewId));
            setSubmitError('');
        } catch (err) {
            console.error('Помилка видалення відгуку:', err);
            setSubmitError(err.response?.data?.error || 'Не вдалося видалити відгук');
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('reviews-modal')) {
            onClose();
        }
    };

    if (loading) {
        return <div className="reviews-modal"><div className="reviews-loading">Завантаження відгуків...</div></div>;
    }

    return (
        <div className="reviews-modal" onClick={handleOverlayClick}>
            <div className="reviews-content">
                <button className="reviews-close-btn" onClick={onClose}>×</button>
                <h3>Відгуки про страву</h3>

                {user ? (
                    <form onSubmit={handleSubmit} className="review-form">
                        <div className="form-group">
                            <label>Ваша оцінка:</label>
                            <StarRating rating={newReview.rating} onRatingChange={handleRatingChange} clickable={true} />
                        </div>
                        <div className="form-group">
                            <label>Ваш відгук:
                                <textarea
                                    name="comment"
                                    value={newReview.comment}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Залиште свій відгук тут..."
                                />
                            </label>
                        </div>
                        {submitError && <div className="error-message">{submitError}</div>}
                        <button type="submit" className="submit-btn">Надіслати відгук</button>
                    </form>
                ) : (
                    <p className="error-message">Будь ласка, увійдіть, щоб залишити відгук.</p>
                )}

                {error && <div className="error-message">{error}</div>}

                <div className="reviews-list">
                    {reviews.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#ccc' }}>Ще немає відгуків про цю страву. Будьте першим!</p>
                    ) : (
                        reviews.map(review => (
                            <div key={review.id} className="review-item">
                                <div className="review-header">
                                    <div>
                                        <span className="review-author">
                                            {user && String(user.id) === String(review.userId) ? "Ви" : (review.userName || `Користувач #${review.userId}`)}
                                        </span>
                                        <span className="review-date">
                                            &nbsp;({new Date(review.createdAt).toLocaleDateString()})
                                        </span>
                                    </div>
                                    <div className="review-actions">
                                        {user && String(user.id) === String(review.userId) && (
                                            <button
                                                className="edit-btn"
                                                onClick={() => handleEditReview(review)}
                                                title="Редагувати відгук"
                                            >
                                                ✏️
                                            </button>
                                        )}
                                        {user?.role === 'ADMIN' && (
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteReview(review.id)}
                                                title="Видалити відгук"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {editingReview === review.id ? (
                                    <form onSubmit={handleUpdateReview} className="edit-review-form">
                                        <div className="form-group">
                                            <label>Оцінка:</label>
                                            <StarRating rating={editData.rating} onRatingChange={handleEditRatingChange} clickable={true} />
                                        </div>
                                        <div className="form-group">
                                            <label>Коментар:
                                                <textarea
                                                    value={editData.comment}
                                                    onChange={(e) => setEditData(prev => ({
                                                        ...prev,
                                                        comment: e.target.value
                                                    }))}
                                                    rows="3"
                                                />
                                            </label>
                                        </div>
                                        <div className="edit-actions">
                                            <button type="button" onClick={() => setEditingReview(null)}>
                                                Скасувати
                                            </button>
                                            <button type="submit">Зберегти зміни</button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <StarRating rating={review.rating} />
                                        <p className="review-text">{review.comment}</p>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DishReviews;