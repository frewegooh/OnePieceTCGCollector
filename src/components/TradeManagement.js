import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import CardList from './CardList';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

function TradeManagement({ getImageUrl }) {
    const [incomingTrades, setIncomingTrades] = useState([]);
    const [outgoingTrades, setOutgoingTrades] = useState([]);
    const [allCards, setAllCards] = useState([]);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [showCompletedTrades, setShowCompletedTrades] = useState(false);

    useEffect(() => {
        // Fetch all card data once
        const fetchAllCards = async () => {
            try {
                const response = await fetch(`${API_URL}/api/cards`);
                const cardData = await response.json();
                setAllCards(cardData);
            } catch (error) {
                console.error("Error fetching card data:", error);
            }
        };
        
        fetchAllCards();
    }, []);

    useEffect(() => {
        if (!currentUser || allCards.length === 0) return;

        const fetchTrades = async () => {
            // Fetch incoming trades
            const incomingQuery = query(
                collection(firestore, 'trades'),
                where('receiverId', '==', currentUser.uid)
            );
            
            // Fetch outgoing trades
            const outgoingQuery = query(
                collection(firestore, 'trades'),
                where('senderId', '==', currentUser.uid)
            );

            const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
                getDocs(incomingQuery),
                getDocs(outgoingQuery)
            ]);

            // Process incoming trades
            const processedIncomingTrades = await Promise.all(
                incomingSnapshot.docs
                    .filter(doc => doc.data().hiddenForReceiver !== true) // Filter in memory
                    .map(async (docSnapshot) => {
                    const tradeData = docSnapshot.data();
                    
                    // Enhance requested cards with full card data
                    const enhancedRequestedCards = await Promise.all(
                        tradeData.requestedCards.map(async (requestedCard) => {
                            const cardData = allCards.find(c => c.productId === requestedCard.cardId);
                            return {
                                id: requestedCard.cardId,
                                productId: requestedCard.cardId,
                                quantity: requestedCard.quantity,
                                imageUrl: cardData?.imageUrl || '',
                                name: cardData?.name || 'Unknown Card'
                            };
                        })
                    );
                    
                    // Enhance offered cards with full card data
                    const enhancedOfferedCards = await Promise.all(
                        tradeData.offeredCards.map(async (offeredCard) => {
                            const cardData = allCards.find(c => c.productId === offeredCard.cardId);
                            return {
                                id: offeredCard.cardId,
                                productId: offeredCard.cardId,
                                quantity: offeredCard.quantity,
                                imageUrl: cardData?.imageUrl || '',
                                name: cardData?.name || 'Unknown Card'
                            };
                        })
                    );
                    
                    // Get sender's display name
                    const senderDoc = await getDoc(doc(firestore, 'users', tradeData.senderId));
                    const senderName = senderDoc.exists() ? senderDoc.data().displayName || 'User' : 'Unknown User';
                    
                    return {
                        id: docSnapshot.id,
                        ...tradeData,
                        requestedCards: enhancedRequestedCards,
                        offeredCards: enhancedOfferedCards,
                        senderName
                    };
                })
            );
            
            // Process outgoing trades
            const processedOutgoingTrades = await Promise.all(
                outgoingSnapshot.docs
                    .filter(doc => doc.data().hiddenForSender !== true) // Filter in memory
                    .map(async (docSnapshot) => {
                    const tradeData = docSnapshot.data();
                    
                    // Enhance requested cards with full card data
                    const enhancedRequestedCards = await Promise.all(
                        tradeData.requestedCards.map(async (requestedCard) => {
                            const cardData = allCards.find(c => c.productId === requestedCard.cardId);
                            return {
                                id: requestedCard.cardId,
                                productId: requestedCard.cardId,
                                quantity: requestedCard.quantity,
                                imageUrl: cardData?.imageUrl || '',
                                name: cardData?.name || 'Unknown Card'
                            };
                        })
                    );
                    
                    // Enhance offered cards with full card data
                    const enhancedOfferedCards = await Promise.all(
                        tradeData.offeredCards.map(async (offeredCard) => {
                            const cardData = allCards.find(c => c.productId === offeredCard.cardId);
                            return {
                                id: offeredCard.cardId,
                                productId: offeredCard.cardId,
                                quantity: offeredCard.quantity,
                                imageUrl: cardData?.imageUrl || '',
                                name: cardData?.name || 'Unknown Card'
                            };
                        })
                    );
                    
                    // Get receiver's display name
                    const receiverDoc = await getDoc(doc(firestore, 'users', tradeData.receiverId));
                    const receiverName = receiverDoc.exists() ? receiverDoc.data().displayName || 'User' : 'Unknown User';
                    
                    return {
                        id: docSnapshot.id,
                        ...tradeData,
                        requestedCards: enhancedRequestedCards,
                        offeredCards: enhancedOfferedCards,
                        receiverName
                    };
                })
            );

            // Filter out completed trades if showCompletedTrades is false
            const filteredIncomingTrades = showCompletedTrades 
                ? processedIncomingTrades 
                : processedIncomingTrades.filter(trade => trade.status === 'pending');
                
            const filteredOutgoingTrades = showCompletedTrades 
                ? processedOutgoingTrades 
                : processedOutgoingTrades.filter(trade => trade.status === 'pending');

            setIncomingTrades(filteredIncomingTrades);
            setOutgoingTrades(filteredOutgoingTrades);
        };

        fetchTrades();
    }, [currentUser, allCards, showCompletedTrades]);

    const handleTradeResponse = async (tradeId, status) => {
        await updateDoc(doc(firestore, 'trades', tradeId), { status });
        // Refresh trades after update
        window.location.reload();
    };

    const handleHideTrade = async (tradeId, isIncoming) => {
        const updateField = isIncoming ? 'hiddenForReceiver' : 'hiddenForSender';
        await updateDoc(doc(firestore, 'trades', tradeId), { [updateField]: true });
        
        // Update local state to remove the hidden trade
        if (isIncoming) {
            setIncomingTrades(incomingTrades.filter(trade => trade.id !== tradeId));
        } else {
            setOutgoingTrades(outgoingTrades.filter(trade => trade.id !== tradeId));
        }
    };

    const handleHideAllCompletedTrades = async () => {
        // Hide all completed incoming trades
        const completedIncoming = incomingTrades.filter(trade => trade.status !== 'pending');
        await Promise.all(
            completedIncoming.map(trade => 
                updateDoc(doc(firestore, 'trades', trade.id), { hiddenForReceiver: true })
            )
        );
        
        // Hide all completed outgoing trades
        const completedOutgoing = outgoingTrades.filter(trade => trade.status !== 'pending');
        await Promise.all(
            completedOutgoing.map(trade => 
                updateDoc(doc(firestore, 'trades', trade.id), { hiddenForSender: true })
            )
        );
        
        // Update local state
        setIncomingTrades(incomingTrades.filter(trade => trade.status === 'pending'));
        setOutgoingTrades(outgoingTrades.filter(trade => trade.status === 'pending'));
    };

    if (!currentUser) {
        return (
            <div className="trade-management-login-required">
                <h2>Trade Management</h2>
                <p>You need to be logged in to manage your trades</p>
                <button 
                    onClick={() => navigate('/login')}
                    className="login-button"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    if (allCards.length === 0) {
        return <div>Loading card data...</div>;
    }

    // Count completed trades
    const completedTradesCount = 
        incomingTrades.filter(trade => trade.status !== 'pending').length +
        outgoingTrades.filter(trade => trade.status !== 'pending').length;

    return (
        <div className="trade-management">
            <h1>Trade Management</h1>
            
            <div className="trade-filters">
                <label>
                    <input
                        type="checkbox"
                        checked={showCompletedTrades}
                        onChange={() => setShowCompletedTrades(!showCompletedTrades)}
                    />
                    Show Completed Trades
                </label>
                
                {completedTradesCount > 0 && (
                    <button 
                        onClick={handleHideAllCompletedTrades}
                        className="hide-all-button"
                    >
                        Hide All Completed Trades ({completedTradesCount})
                    </button>
                )}
            </div>
            
            <section className="incoming-trades">
                <h2>Incoming Trade Offers</h2>
                {incomingTrades.length === 0 ? (
                    <p>No incoming trade offers</p>
                ) : (
                    incomingTrades.map(trade => (
                        <div key={trade.id} className="trade-card">
                            <div className="trade-details">
                                <h3 className="fullWidth">From: {trade.senderName}</h3>
                                <div className="tradeDetailsOffering">
                                    <h3>Cards They're Offering You:</h3>
                                    <CardList 
                                        cards={trade.offeredCards}
                                        getImageUrl={getImageUrl}
                                        showQuantity={true}
                                    />
                                </div>
                                <div className="tradeDetailsRequest">  
                                    <h3>Cards They Want From You:</h3>
                                    <CardList 
                                        cards={trade.requestedCards}
                                        getImageUrl={getImageUrl}
                                        showQuantity={true}
                                    />
                                    
                                    {trade.monetaryOffer > 0 && (
                                        <p>Money Offered: ${trade.monetaryOffer}</p>
                                    )}
                                 </div>
                            </div>
                            
                            <div className="trade-actions">
                                {trade.status === 'pending' ? (
                                    <>
                                        <button 
                                            onClick={() => handleTradeResponse(trade.id, 'accepted')}
                                            className="accept-button"
                                        >
                                            Accept
                                        </button>
                                        <button 
                                            onClick={() => handleTradeResponse(trade.id, 'rejected')}
                                            className="reject-button"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : (
                                    <div className="trade-status">
                                        Status: <span className={`status-${trade.status}`}>{trade.status}</span>
                                        <button 
                                            onClick={() => handleHideTrade(trade.id, true)}
                                            className="hide-button"
                                        >
                                            Hide Trade
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </section>

            <section className="outgoing-trades">
                <h2>Your Trade Offers</h2>
                {outgoingTrades.length === 0 ? (
                    <p>No outgoing trade offers</p>
                ) : (
                    outgoingTrades.map(trade => (
                        <div key={trade.id} className="trade-card">
                            <div className="trade-details">
                                <h3 className="fullWidth">To: {trade.receiverName}</h3>
                                <h4 className="fullWidth">Status: {trade.status}</h4>
                                <div className="tradeDetailsOffering">
                                    <h5>Cards You're Offering:</h5>
                                    <CardList 
                                        cards={trade.offeredCards}
                                        getImageUrl={getImageUrl}
                                        showQuantity={true}
                                    />
                                </div>

                                <div className="tradeDetailsRequest">  
                                    <h5 className="fullWidth">Cards You Want:</h5>
                                    <CardList 
                                        cards={trade.requestedCards}
                                        getImageUrl={getImageUrl}
                                        showQuantity={true}
                                    />
                                </div>
                                {trade.monetaryOffer > 0 && (
                                    <p>Money Offered: ${trade.monetaryOffer}</p>
                                )}
                            </div>
                            
                            {trade.status !== 'pending' && (
                                <div className="trade-actions">
                                    <button 
                                        onClick={() => handleHideTrade(trade.id, false)}
                                        className="hide-button"
                                    >
                                        Hide Trade
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}

export default TradeManagement;
