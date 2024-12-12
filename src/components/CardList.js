import React, { useEffect } from 'react';

const getLocalImageUrl = (url) =>
    `http://localhost:5000/images/${url.split('/').pop().replace('_200w.jpg', '_400w.jpg')}`;

const CardList = ({ 
    cards, 
    updateQuantity, 
    onSecondaryButtonClick, 
    onPrimaryButtonClick,
    secondaryButtonLabel, 
    primaryButtonLabel,
    enableCardClick,
    showQuantity = true // Add this prop with default value
}) => {
    useEffect(() => {
        //console.log('CardList mounted/updated with cards:', cards?.length);
    }, [cards]);

    if (!cards?.length) {
        //console.log('Rendering loading state because cards length is:', cards?.length);
        return <div>No Cards Found</div>;
    }

    

    return (
        <div>
            <ul>
                {cards.map((card, index) => (
                    <li
                        key={card.productId || index}
                        className="cardListCard"
                        style={{ cursor: 'pointer' }}
                    >
                        
                        <img src={getLocalImageUrl(card.imageUrl)} alt={card.cleanName} />
                        <h3>{card.cleanName}</h3>
                        {showQuantity && updateQuantity && (
                            <div style={{ marginTop: '10px' }}>
                                <label>
                                    Owned:
                                    <input
                                        type="number"
                                        value={card.quantity || 0}
                                        onChange={(e) => updateQuantity(card.productId, parseInt(e.target.value, 10) || 0)}
                                        style={{ width: '50px', marginLeft: '5px' }}
                                        min="0"
                                        onClick={(e) => e.stopPropagation()}Q
                                    />
                                </label>
                            </div>
                        )}
                        <div className="card-buttons">
                            {primaryButtonLabel && onPrimaryButtonClick && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    onPrimaryButtonClick(card);
                                }}>
                                    {primaryButtonLabel}
                                </button>
                            )}
                            {secondaryButtonLabel && onSecondaryButtonClick && (
                                <button onClick={(e) => {
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
    );
};
export default CardList;
