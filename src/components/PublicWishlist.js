import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import CardList from './CardList';
import { useAuth } from '../contexts/AuthContext';
import WishlistTradeOffer from './WishlistTradeOffer';
import '../styles/Trading.css';

function PublicWishlist({ getImageUrl }) {
    const { userId } = useParams();
    const [wishlistCards, setWishlistCards] = useState([]);
    const [userData, setUserData] = useState(null);
    const { currentUser } = useAuth();
    const [selectedCard, setSelectedCard] = useState(null);
    const [showTradeModal, setShowTradeModal] = useState(false);

    useEffect(() => {
        const fetchWishlist = async () => {
            const userDoc = await getDoc(doc(firestore, 'users', userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData(data);
                
                // Transform wishlist data into card format
                const wishlistItems = Object.entries(data.wishList || {}).map(([cardId, quantity]) => ({
                    id: cardId,
                    quantity,
                    wanted: true
                }));
                setWishlistCards(wishlistItems);
            }
        };
        fetchWishlist();
    }, [userId]);

    const handleTradeOffer = (card) => {
        setSelectedCard(card);
        setShowTradeModal(true);
    };

    return (
        <div className="public-wishlist">
            <h2>{userData?.displayName}'s Wishlist</h2>
            <CardList 
                cards={wishlistCards}
                getImageUrl={getImageUrl}
                onSecondaryButtonClick={handleTradeOffer}
                secondaryButtonLabel="Offer Trade"
                showQuantity={true}
            />
            {showTradeModal && (
                <WishlistTradeOffer
                    card={selectedCard}
                    onClose={() => setShowTradeModal(false)}
                    targetUserId={userId}
                    getImageUrl={getImageUrl}
                />
            )}
        </div>
    );
}

export default PublicWishlist;
