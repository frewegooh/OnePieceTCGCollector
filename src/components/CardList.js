import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPrompt from './LoginPrompt';
import { getImageUrl } from '../config';

const CardList = ({ 
    cards, 
    updateQuantity, 
    onSecondaryButtonClick, 
    onPrimaryButtonClick,
    secondaryButtonLabel, 
    primaryButtonLabel,
    enableCardClick,
    showQuantity = true,    
}) => {
    const { currentUser } = useAuth();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const getLocalImageUrl = (url) => {
        const imageName = url.split('/').pop().replace('_200w.jpg', '_400w.jpg');
        return `${process.env.PUBLIC_URL}/images/${imageName}`;
    };

    useEffect(() => {
        //console.log('CardList mounted/updated with cards:', cards?.length);
    }, [cards]);

    if (!cards?.length) {
        return <div>No Cards Found</div>;
    }

    const handleQuantityUpdate = (productId, newQuantity) => {
        if (currentUser) {
            updateQuantity(productId, newQuantity);
        } else {
            setShowLoginPrompt(true);
        }
    };   

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
                            <img 
                                src={getImageUrl(card.imageUrl)} 
                                alt={card.cleanName} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSecondaryButtonClick(card);
                                }}
                                style={{ cursor: 'pointer' }}
                            />
                            <h3>{card.cleanName}</h3>
                            {showQuantity && updateQuantity && (
                                <div style={{ marginTop: '10px' }}>
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
};

export default CardList;
