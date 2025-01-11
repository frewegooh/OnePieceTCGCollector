import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPrompt from './LoginPrompt';
import { getImageUrl } from '../config';

const LazyImage = React.memo(({ card, imageUrls, ...props }) => {
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        if (imgRef.current && !isInView) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [isInView]);

    return (
        <div ref={imgRef} className="image-container">
            {isInView && (
                <img
                    src={getImageUrl(card.imageUrl)}
                    alt={card.cleanName}
                    className="card-image loaded"
                    {...props}
                />
            )}
            {!isInView && <div className="image-placeholder" />}
        </div>
    );
});

function CardList({ 
    cards, 
    updateQuantity, 
    onSecondaryButtonClick, 
    onPrimaryButtonClick,
    secondaryButtonLabel, 
    primaryButtonLabel, 
    enableCardClick, 
    showQuantity = true, 
    deckQuantities = {} 
}) {
    const { currentUser } = useAuth();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [imageUrls, setImageUrls] = useState({});

    useEffect(() => {
        const loadImages = async () => {
            const newImageUrls = {};
            for (const card of cards) {
                if (!imageUrls[card.productId]) {
                    const resolvedUrl = await getImageUrl(card.imageUrl);
                    newImageUrls[card.productId] = resolvedUrl;
                }
            }
            if (Object.keys(newImageUrls).length > 0) {
                setImageUrls(prev => ({...prev, ...newImageUrls}));
            }
            setIsLoading(false);
        };
        
        loadImages();
    }, [cards, imageUrls]);

    const handleQuantityUpdate = (productId, newQuantity) => {
        if (currentUser) {
            updateQuantity(productId, newQuantity);
        } else {
            setShowLoginPrompt(true);
        }
    };

    if (isLoading) return <div>Loading Cards...</div>;
    if (!cards?.length) return <div>No Cards Found</div>;

    return (
        <>
            <div>
                <ul>
                    {cards.map((card, index) => (
                        <li
                            key={card.productId || index}
                            className="cardListCard"
                            style={{ cursor: 'pointer' }}
                        >
                            {deckQuantities[card.productId] > 0 && (
                                <div className="deck-quantity">
                                    {deckQuantities[card.productId]}
                                </div>
                            )}
                            
                            <LazyImage 
                                card={card}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSecondaryButtonClick(card);
                                }}
                                style={{ cursor: 'pointer' }}
                            />
                            <h5 className='cardTitle'>{card.cleanName}</h5>
                            {showQuantity && updateQuantity && (
                                <div className='OwnedField'>
                                    <label>
                                        Owned:
                                        <input
                                            type="number"
                                            value={card.quantity || 0}
                                            onChange={(e) => handleQuantityUpdate(card.productId, parseInt(e.target.value, 10) || 0)}
                                            style={{ width: '50px', marginLeft: '5px' }}
                                            min="0"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </label>
                                </div>
                            )}
                            <div className="card-buttons">
                                {primaryButtonLabel && onPrimaryButtonClick && (
                                    <button className='detailsBttn' onClick={(e) => {
                                        e.stopPropagation();
                                        onPrimaryButtonClick(card);
                                    }}>
                                        {primaryButtonLabel}
                                    </button>
                                )}
                                {secondaryButtonLabel && onSecondaryButtonClick && (
                                    <button className='viewBttn' onClick={(e) => {
                                        e.stopPropagation();
                                        onSecondaryButtonClick(card);
                                    }}>
                                        {secondaryButtonLabel}
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <LoginPrompt 
                open={showLoginPrompt} 
                onClose={() => setShowLoginPrompt(false)} 
            />
        </>
    );
}

export default React.memo(CardList);
