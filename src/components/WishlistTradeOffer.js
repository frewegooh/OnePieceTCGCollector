import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import CardList from './CardList';
import '../styles/Trading.css';

function WishlistTradeOffer({ card, onClose, targetUserId, getImageUrl }) {
    const [myCards, setMyCards] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [monetaryOffer, setMonetaryOffer] = useState(0);
    const { currentUser } = useAuth();
    const [targetUserName, setTargetUserName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            // Fetch target user's name
            const userDoc = await getDoc(doc(firestore, 'users', targetUserId));
            if (userDoc.exists()) {
                setTargetUserName(userDoc.data().displayName || 'User');
            }

            // Fetch current user's cards
            const myDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
            if (myDoc.exists()) {
                const userData = myDoc.data();
                const cards = Object.entries(userData.cardQuantities || {})
                    .filter(([_, quantity]) => quantity > 0)
                    .map(([id, quantity]) => ({
                        id,
                        quantity
                    }));
                setMyCards(cards);
            }
        };
        fetchData();
    }, [currentUser.uid, targetUserId]);

    const handleSubmitOffer = async () => {
        const tradeOffer = {
            senderId: currentUser.uid,
            senderName: currentUser.displayName || 'Anonymous',
            receiverId: targetUserId,
            receiverName: targetUserName,
            requestedCards: [{ cardId: card.id, quantity: card.quantity }],
            offeredCards: selectedCards.map(card => ({
                cardId: card.id,
                quantity: 1
            })),
            monetaryOffer,
            status: 'pending',
            timestamp: new Date(),
            isWishlistTrade: true
        };

        await addDoc(collection(firestore, 'trades'), tradeOffer);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="wishlist-trade-offer">
                <h2>Make Trade Offer to {targetUserName}</h2>
                
                <div className="wanted-card-section">
                    <h3>Requested Card:</h3>
                    <CardList 
                        cards={[card]}
                        getImageUrl={getImageUrl}
                        showQuantity={true}
                    />
                </div>

                <div className="offer-section">
                    <h3>Your Offer:</h3>
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

                    <div className="card-selection">
                        <h4>Select Cards to Offer:</h4>
                        <CardList 
                            cards={myCards}
                            getImageUrl={getImageUrl}
                            onCardSelect={(card) => {
                                if (!selectedCards.find(c => c.id === card.id)) {
                                    setSelectedCards([...selectedCards, card]);
                                }
                            }}
                            selectedCards={selectedCards}
                            showQuantity={true}
                        />
                    </div>
                </div>

                <div className="selected-cards">
                    <h4>Selected Cards:</h4>
                    <CardList 
                        cards={selectedCards}
                        getImageUrl={getImageUrl}
                        onCardSelect={(card) => {
                            setSelectedCards(selectedCards.filter(c => c.id !== card.id));
                        }}
                        showQuantity={true}
                    />
                </div>

                <div className="modal-actions">
                    <button 
                        onClick={handleSubmitOffer}
                        disabled={selectedCards.length === 0 && monetaryOffer === 0}
                    >
                        Submit Offer
                    </button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </Modal>
    );
}

export default WishlistTradeOffer;
