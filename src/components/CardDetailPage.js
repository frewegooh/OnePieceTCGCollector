import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
//import CardDetail from './CardDetail';
import DOMPurify from 'dompurify';
import API_URL from '../config';
import { firestore } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import LoginPrompt from './LoginPrompt';
import { getTCGPlayerUrl } from '../utils/urlUtils'


export const formatCardTextWithHTML = (text) => {
    const formattedText = text.replace(/\[(.*?)\]/g, (_, match) => {
        const className = `card-text-${match.substring(0, 3).toLowerCase()}`;
        return `<span class="${className}">[${match}]</span>`;
    });

    return DOMPurify.sanitize(formattedText);
};

const CardDetailPage = ({ getImageUrl, trackTCGPlayerClick, updateWishList, userWishList }) => {
    const { cardId } = useParams();
    const [card, setCard] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [decksUsingCard, setDecksUsingCard] = useState([]);
    const [relatedCards, setRelatedCards] = useState([]);
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [quantity, setQuantity] = useState(0);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    <LoginPrompt 
        open={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)} 
    />

    // Add this useEffect to fetch quantity
    useEffect(() => {
        const fetchQuantity = async () => {
            if (!currentUser || !cardId) return;
            
            const docRef = doc(firestore, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setQuantity(userData.cardQuantities?.[cardId] || 0);
            }
        };

        fetchQuantity();
    }, [currentUser, cardId]);

    // Add quantity update handler
    const handleQuantityUpdate = async (newQuantity) => {
        if (!currentUser) {
            setShowLoginPrompt(true);
            return;
        }

        const userRef = doc(firestore, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        const userData = docSnap.exists() ? docSnap.data() : {};
        
        await setDoc(userRef, {
            ...userData,
            cardQuantities: {
                ...(userData.cardQuantities || {}),
                [cardId]: newQuantity
            }
        });
        
        setQuantity(newQuantity);
    };


    // Add this useEffect to fetch decks
    useEffect(() => {
        const fetchDecksUsingCard = async () => {
            if (!card?.extNumber) return;
            
            // Get all cards response to find related productIds
            const allCardsResponse = await fetch(`${API_URL}/api/cards`);
            const allCards = await allCardsResponse.json();
            
            // Get all productIds that share the same extNumber
            const relatedProductIds = allCards
                .filter(c => c.extNumber === card.extNumber)
                .map(c => c.productId);
            
            // Query decks and filter by any matching productId
            const decksQuery = query(collection(firestore, 'decks'));
            const querySnapshot = await getDocs(decksQuery);
            const decksWithCard = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(deck => 
                    deck.cardIds.some(deckCard => relatedProductIds.includes(deckCard.productId)) ||
                    relatedProductIds.includes(deck.leaderId)
                );
            setDecksUsingCard(decksWithCard);
        };
    
        fetchDecksUsingCard();
    }, [card?.extNumber]);

    // Add this useEffect to fetch related cards
    useEffect(() => {
        const fetchRelatedCards = async () => {
            if (!card?.extNumber) return;
            
            const allCardsResponse = await fetch(`${API_URL}/api/cards`);
            const allCards = await allCardsResponse.json();
            const related = allCards.filter(c => 
                c.extNumber === card.extNumber && 
                c.productId !== card.productId
            );
            setRelatedCards(related);
        };

        fetchRelatedCards();
    }, [card]);

    useEffect(() => {
        const fetchCard = async () => {
            try {
                // Using the exact endpoint that works in other components
                const allCardsResponse = await fetch(`${API_URL}/api/cards`);
                const allCards = await allCardsResponse.json();
                const cardData = allCards.find(card => card.productId === cardId);
                
                if (cardData) {
                    setCard(cardData);
                    if (cardData.imageUrl) {
                        const resolvedUrl = await getImageUrl(cardData.imageUrl);
                        setImageUrl(resolvedUrl);
                    }
                }
            } catch (error) {
                console.error('Error fetching card:', error);
            }
        };
        fetchCard();
    }, [cardId, getImageUrl]);

    if (!card) return <div>Loading...</div>;

    return (
        <div className="card-detail-page">
            <LoginPrompt 
                open={showLoginPrompt} 
                onClose={() => setShowLoginPrompt(false)} 
            />
            <div style={{ padding: '1rem' }} className='cardInfoPop'>
                <p className='cardDetailTitle'>{card.name}</p>   
                <div className='imgHolder'>
                    {imageUrl && <img src={imageUrl} alt={card.cleanName} />}
                    <div className='tcgPlayerBttn'>
                        {card.url && (
                            <a 
                                href={getTCGPlayerUrl(card.productId)}
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={() => trackTCGPlayerClick(card.name)}
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
                <div className='cardInfo'>

                <div style={{ marginTop: '10px' }}>
                    <label>
                        <strong>Cards Owned:</strong>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleQuantityUpdate(parseInt(e.target.value, 10) || 0)}
                            style={{ width: '50px', marginLeft: '5px' }}
                            min="0"
                        />
                    </label>
                </div>

                <div style={{ marginTop: '10px' }}>
                    <label>
                        <strong>Wanted:</strong>
                        <input
                            type="number"
                            value={userWishList?.[cardId] || 0}
                            onChange={(e) => updateWishList(cardId, parseInt(e.target.value, 10) || 0)}
                            style={{ width: '50px', marginLeft: '5px' }}
                            min="0"
                        />
                    </label>
                </div>

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
                                    __html: formatCardTextWithHTML(card.extDescription)
                                }}
                            />
                        </p>
                    )}
                </div>
            </div>

            <div className="related-content">
                {relatedCards.length > 0 && (
                    <div className="related-cards-section">
                        <h2>Alternative Art Versions</h2>
                        <div className="cards-grid">
                            {relatedCards.map(relatedCard => (
                                <div key={relatedCard.productId} className="card-preview">
                                    <img 
                                        src={getImageUrl(relatedCard.imageUrl)} 
                                        alt={relatedCard.name}
                                        onClick={() => navigate(`/card/${relatedCard.productId}`)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                {decksUsingCard.length > 0 && (
                    <div className="decks-section">
                        <h2>Decks Using This Card</h2>
                        <div className="decks-grid">
                            {decksUsingCard.map(deck => (
                                <div 
                                    key={deck.id} 
                                    className="deck-preview"
                                    onClick={() => navigate(`/deck/${deck.id}`)}
                                >
                                    <h3>{deck.name}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
};

export default CardDetailPage;
