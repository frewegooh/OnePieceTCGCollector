import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import CardList from './CardList';
import API_URL from '../config';

function TradeOfferModal({ card, onClose, targetUserId, getImageUrl }) {
    // IF NOT WORKING THIS IS THE ISSUE const [myCards, setMyCards] = useState([]);
    const [targetUserCards, setTargetUserCards] = useState([]);
    const [selectedTargetCards, setSelectedTargetCards] = useState([]);
    const [selectedCardQuantities, setSelectedCardQuantities] = useState({});
    const [monetaryOffer, setMonetaryOffer] = useState(0);
    const { currentUser } = useAuth();
    const [targetUserName, setTargetUserName] = useState('');

    // Fetch both users' cards
    useEffect(() => {
        const fetchCards = async () => {
            // Fetch all card data
            const response = await fetch(`${API_URL}/api/cards`);
            const allCards = await response.json();
            
            // Fetch target user's cards
            const targetUserDoc = await getDoc(doc(firestore, 'users', targetUserId));
            if (targetUserDoc.exists()) {
                const targetUserData = targetUserDoc.data();
                setTargetUserName(targetUserData.displayName || 'User');
                
                const targetCardsData = Object.entries(targetUserData.cardQuantities || {})
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([id, quantity]) => {
                        const cardData = allCards.find(c => c.productId === id);
                        return {
                            id,
                            quantity,
                            imageUrl: cardData?.imageUrl || '',
                            name: cardData?.name || '',
                            productId: id
                        };
                    });
                setTargetUserCards(targetCardsData);
            }
        };
        
        fetchCards();
    }, [currentUser, targetUserId]);
    
    const handleSubmitOffer = async () => {
        const tradeOffer = {
            senderId: currentUser.uid,
            receiverId: targetUserId,
            // Cards the current user is offering to the target user (the card they wanted)
            offeredCards: [{ cardId: card.id, quantity: 1 }],
            // Cards the current user is requesting from the target user
            requestedCards: selectedTargetCards.map(card => ({
                cardId: card.id,
                quantity: selectedCardQuantities[card.id] || 1
            })),
            monetaryOffer,
            status: 'pending',
            timestamp: new Date()
        };
    
        await addDoc(collection(firestore, 'trades'), tradeOffer);
        onClose();
    };

    const handleSelectTargetCard = (card) => {
        // Check if card is already selected
        const isAlreadySelected = selectedTargetCards.some(c => c.id === card.id);
        
        if (isAlreadySelected) {
            // Remove card if already selected
            setSelectedTargetCards(selectedTargetCards.filter(c => c.id !== card.id));
            
            // Remove quantity for this card
            const newQuantities = {...selectedCardQuantities};
            delete newQuantities[card.id];
            setSelectedCardQuantities(newQuantities);
        } else {
            // Add card if not selected
            setSelectedTargetCards([...selectedTargetCards, card]);
            
            // Initialize quantity to 1
            setSelectedCardQuantities({
                ...selectedCardQuantities,
                [card.id]: 1
            });
        }
    };

    const updateSelectedCardQuantity = (cardId, newQuantity) => {
        // Ensure quantity is at least 1
        const quantity = Math.max(1, newQuantity);
        
        // Update the quantity for this card
        setSelectedCardQuantities({
            ...selectedCardQuantities,
            [cardId]: quantity
        });
    };

    const removeSelectedCard = (cardId) => {
        setSelectedTargetCards(selectedTargetCards.filter(card => card.id !== cardId));
        
        // Remove quantity for this card
        const newQuantities = {...selectedCardQuantities};
        delete newQuantities[cardId];
        setSelectedCardQuantities(newQuantities);
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="trade-offer-modal">
                <h2>Create Trade Offer</h2>
                
                <div className="trade-sections-container">
                    <div className="left-section">
                        <h3>Card {targetUserName} Wants:</h3>
                        <CardList 
                            cards={[{
                                ...card,
                                id: card.productId || card.id,
                                imageUrl: card.imageUrl || ''
                            }]}
                            getImageUrl={getImageUrl}
                            showQuantity={false}
                            onSecondaryButtonClick={() => {}}
                        />
                        
                        <div className="monetary-offer">
                            <label>Money Offer ($):</label>
                            <input 
                                type="number"
                                value={monetaryOffer}
                                onChange={(e) => setMonetaryOffer(Number(e.target.value))}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        {/* Always show the selected cards section for troubleshooting */}
                        <div className="selected-cards-section">
                            <h3>Selected Cards from {targetUserName}:</h3>
                            <div className="selected-cards-list">
                                {selectedTargetCards.length > 0 ? (
                                    selectedTargetCards.map(card => (
                                        <div key={card.id} className="selected-card-item">
                                            <img 
                                                src={getImageUrl(card.imageUrl)} 
                                                alt={card.name} 
                                                className="selected-card-image"
                                            />
                                            <div className="selected-card-details">
                                                <p>{card.name}</p>
                                                <div className="selected-card-actions">
                                                    <div className="quantity-control">
                                                        <label>Quantity:</label>
                                                        <input
                                                            type="number"
                                                            value={selectedCardQuantities[card.id] || 1}
                                                            onChange={(e) => updateSelectedCardQuantity(card.id, parseInt(e.target.value, 10))}
                                                            min="1"
                                                            max={card.quantity || 99}
                                                            style={{ width: '50px', marginLeft: '5px' }}
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => removeSelectedCard(card.id)}
                                                        className="remove-card-btn"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No cards selected yet. Click on cards from the right section to select them.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="right-section">
                        <h3>Cards You Want From {targetUserName}:</h3>
                        <div className="card-selection cardListCSS">
                            <CardList 
                                cards={targetUserCards.map(card => ({
                                    ...card,
                                    productId: card.id,
                                    id: card.id,
                                    imageUrl: card.imageUrl || '',
                                    name: card.name || ''
                                }))}
                                getImageUrl={getImageUrl}
                                onSecondaryButtonClick={handleSelectTargetCard}
                                secondaryButtonLabel="Select Card"
                                selectedCards={selectedTargetCards}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="modal-actions">
                    <button onClick={handleSubmitOffer}>Submit Offer</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </Modal>
    );
}

export default TradeOfferModal;
