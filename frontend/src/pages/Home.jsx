import React, { useState, useEffect } from 'react';
import '../css/Home.css';

const gallery1Images = [
    '/image/gallery/dish1.jpg',
    '/image/gallery/dish2.jpg',
    '/image/gallery/dish3.jpg',
    '/image/gallery/dish4.jpg',
    '/image/gallery/dish5.jpg',
];

const gallery2Images = [
    '/image/gallery/interior1.jpg',
    '/image/gallery/interior2.jpg',
    '/image/gallery/interior3.jpg',
];

const Home = () => {
    const [currentImage1, setCurrentImage1] = useState(0);
    const [currentImage2, setCurrentImage2] = useState(0);

    useEffect(() => {
        const interval1 = setInterval(() => {
            setCurrentImage1((prevIndex) =>
                (prevIndex + 1) % gallery1Images.length
            );
        }, 3000);

        const interval2 = setInterval(() => {
            setCurrentImage2((prevIndex) =>
                (prevIndex + 1) % gallery2Images.length
            );
        }, 3000);

        return () => {
            clearInterval(interval1);
            clearInterval(interval2);
        };
    }, []);

    return (
        <div className="home-container">
            <div className="gallery-frame neo-element top-left">
                <div className="gallery-slideshow">
                    {gallery1Images.map((image, index) => (
                        <img
                            key={index}
                            src={image}
                            alt={`Dish ${index + 1}`}
                            className={`gallery-image ${index === currentImage1 ? 'active' : ''}`}
                        />
                    ))}
                </div>
            </div>

            <div className="hero-content">
                <h1>Ласкаво просимо до Il Gambero Rosso!</h1>
                <p>Відкрийте для себе справжній смак Італії. Ми пропонуємо вишукані страви, приготовані з любов'ю та найсвіжіших інгредієнтів, у затишній атмосфері.</p>
                <div className="hero-buttons">
                    <a href="/menu" className="neo-button">Наше меню</a>
                    <a href="/tables" className="neo-button">Забронювати столик</a>
                </div>
            </div>

            <div className="gallery-frame neo-element bottom-right">
                <div className="gallery-slideshow">
                    {gallery2Images.map((image, index) => (
                        <img
                            key={index}
                            src={image}
                            alt={`Interior ${index + 1}`}
                            className={`gallery-image ${index === currentImage2 ? 'active' : ''}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;