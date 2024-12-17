// src/components/CardDetail.js
import React from 'react';
//import { formatCardText } from '../utils/textUtils';
import DOMPurify from 'dompurify';
import { getImageUrl } from '../config';

export const formatCardTextWithHTML = (text) => {
    const formattedText = text.replace(/\[(.*?)\]/g, (_, match) => {
        const className = `card-text-${match.substring(0, 3).toLowerCase()}`;
        return `<span class="${className}">[${match}]</span>`;
    });

    return DOMPurify.sanitize(formattedText);
};


const CardDetail = ({ card, onPrevious, onNext }) => {
    if (!card) return null; // If no card is selected, don't render anything

    return (
        <div className="cardDetailPopup">
            <div className="navigation">
                {onPrevious && (
                    <button onClick={onPrevious} className="navArrow leftArrow">
                        ◄
                    </button>
                )}
                {onNext && (
                    <button onClick={onNext} className="navArrow rightArrow">
                        ►
                    </button>
                )}
            </div>


        <div style={{ padding: '1rem' }} className='cardInfoPop'>
            <div className='imgHolder'>
            <img src={getImageUrl(card.imageUrl)} alt={card.cleanName} />

                {card.marketPrice !== undefined && (
                        <p><strong>Market Price:</strong> ${card.marketPrice}</p>
                )}

                {/* Go To Product button */}
                {card.url && (
                    <a 
                        href={card.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block',
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: '4px',
                        }}
                    >
                            View On TCGPlayer
                    </a>
                    )}
            </div>
            <div className='cardInfo'>

                <p><strong>Name:</strong> {card.name}</p>   

                {card.extColor && (
                    <p><strong>Color:</strong> {card.extColor.replace(/;/g, ' | ')}</p>
                )}         

                {card.extAttribute && (
                    <p><strong>Attribute:</strong> {card.extAttribute}</p>
                )}     

                {card.extCost && (
                    <p><strong>Cost:</strong> {card.extCost}</p>
                )}

                {card.extCardType && (
                    <p><strong>Type:</strong> {card.extCardType}</p>
                )}

                {card.extPower && (
                    <p><strong>Power:</strong> {card.extPower}</p>
                )}

                {card.extCounterplus && (
                    <p><strong>Counter:</strong> {card.extCounterplus}</p>
                )}

                {card.extSubtypes && (
                    <p><strong>Subtypes:</strong> {card.extSubtypes.replace(/;/g, ' | ')}</p>
                )}

                {card.extRarity && (
                    <p><strong>Rarity:</strong> {card.extRarity}</p>
                )}

                {card.extNumber && (
                    <p><strong>Number:</strong> {card.extNumber}</p>
                )}

                {card.extDescription && card.extDescription !== 'No description available.' && (
                    <p>
                        <strong>Description:</strong>
                        <span
                            dangerouslySetInnerHTML={{
                                __html: formatCardTextWithHTML(card.extDescription), // Safely render HTML
                            }}
                        />
                    </p>
                )}

            </div>
        </div>
        </div>
    );
};

export default CardDetail;
