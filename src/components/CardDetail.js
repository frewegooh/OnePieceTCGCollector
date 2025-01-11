// src/components/CardDetail.js
import React, { useState, useEffect } from 'react';
//import { formatCardText } from '../utils/textUtils';
import DOMPurify from 'dompurify';
import { getImageUrl } from '../config';
import { useNavigate } from 'react-router-dom';
import { getTCGPlayerUrl } from '../utils/urlUtils';


export const formatCardTextWithHTML = (text) => {
    const formattedText = text.replace(/\[(.*?)\]/g, (_, match) => {
        const className = `card-text-${match.substring(0, 3).toLowerCase()}`;
        return `<span class="${className}">[${match}]</span>`;
    });

    return DOMPurify.sanitize(formattedText);
};


const CardDetail = ({ card, onPrevious, onNext, trackTCGPlayerClick }) => {
    const [showInfo, setShowInfo] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [showShareMessage, setShowShareMessage] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadImage = async () => {
            if (card?.imageUrl) {
                const resolvedUrl = await getImageUrl(card.imageUrl);
                setImageUrl(resolvedUrl);
            }
        };
        loadImage();
    }, [card]);

    if (!card) return null; // If no card is selected, don't render anything

    return (
        <div className="cardDetailPopup">
            <i 
                className="fas fa-share-alt share-icon"
                onClick={() => {
                    const shareUrl = `${window.location.origin}/card/${card.productId}`;
                    navigator.clipboard.writeText(shareUrl);
                    setShowShareMessage(true);
                    setTimeout(() => setShowShareMessage(false), 2000);
                }}
                title="Share Card"
            />
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
                <p className='cardDetailTitle'>{card.name}</p>   
                <div className='imgHolder'>
                

                {imageUrl && <img src={imageUrl} alt={card.cleanName} />}
                {/* Go To Product button */}
                <div className='tcgPlayerBttn'>
                    {card.url && (
                        <a 
                            href={getTCGPlayerUrl(card.productId)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={() => trackTCGPlayerClick && trackTCGPlayerClick(card.name)}
                            style={{
                                display: 'inline-block',
                                marginTop: '1rem',
                                color: 'blue',
                                textDecoration: 'underline',
                            }}
                        >
                        
                            {card.marketPrice !== undefined && (
                                <p><strong>TCGPlayer:</strong> ${card.marketPrice}</p>
                            )}
                        
                        </a>
                        
                    )}
                </div>
            </div>
            {showInfo && (
                <div className='cardInfo'>

                    {card.extColor && (
                        <p><strong>Color:</strong> {
                            Array.isArray(card.extColor) ? 
                                card.extColor.join(' | ') : 
                                (typeof card.extColor === 'string' ? 
                                    card.extColor.replace(/;/g, ' | ') : 
                                    '')
                        }</p>
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
                )}
                <button 
                    onClick={() => setShowInfo(!showInfo)}
                    className="toggle-info-button"
                >
                    {showInfo ? 'Hide Info' : 'Quick Info'}
                </button>

                <button 
                        onClick={() => navigate(`/card/${card.productId}`)}
                        className="view-full-page-button"
                    >
                        All Card Info
                </button>


                {showShareMessage && (
                    <div className="share-message">
                        Link Copied
                        <style>
                        {`
                            .share-message {
                                position: fixed;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                background-color: rgba(0, 0, 0, 0.8);
                                color: white;
                                padding: 20px;
                                border-radius: 5px;
                                z-index: 1000;
                            }
                        `}
                        </style>
                    </div>
                )}

        </div>
        </div>
    );
};

export default React.memo(CardDetail);
