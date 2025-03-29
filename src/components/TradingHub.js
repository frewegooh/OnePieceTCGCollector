import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import TradeOfferModal from './TradeOfferModal';

const zipCodeCache = {};

function TradingHub({ getImageUrl }) {
    const [users, setUsers] = useState([]);
    const [cards, setCards] = useState([]);
    const [searchType, setSearchType] = useState('cards'); // 'cards' or 'users'
    const [searchTerm, setSearchTerm] = useState('');
    const [wantedCards, setWantedCards] = useState([]);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [zipCode, setZipCode] = useState('');
    const [distance, setDistance] = useState(50); // Default 50 miles
    //const [userLocations, setUserLocations] = useState({});
    const [filteredResults, setFilteredResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch all cards
    useEffect(() => {
        if (!currentUser) return;
        const fetchCards = async () => {
            const response = await fetch(`${API_URL}/api/cards`);
            const cardData = await response.json();
            setCards(cardData);
        };
        fetchCards();
    }, [currentUser]);


    // Fetch users and their collections/wishlists
    useEffect(() => {
        if (!currentUser) return;

        const fetchUsers = async () => {
            const usersQuery = query(collection(firestore, 'users'));
            const snapshot = await getDocs(usersQuery);
            const userData = snapshot.docs
                .filter(doc => doc.id !== currentUser?.uid)
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    cardQuantities: doc.data().cardQuantities || {},
                    wishList: doc.data().wishList || {}
                }));
            setUsers(userData);

            const allWantedCards = userData.reduce((acc, user) => {
                Object.entries(user.wishList).forEach(([cardId, quantity]) => {
                    if (!acc[cardId]) {
                        acc[cardId] = [];
                    }
                    acc[cardId].push({ userId: user.id, displayName: user.displayName, quantity });
                });
                return acc;
            }, {});
            setWantedCards(allWantedCards);
        };
        fetchUsers();
    }, [currentUser]);

    // Add these helper functions inside the component
    const getZipCodeCoordinates = useCallback(async (zipCode) => {
        if (zipCodeCache[zipCode]) {
            return zipCodeCache[zipCode];
        }
    
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=USA&format=json`
        );
        const data = await response.json();
        
        if (data.length > 0) {
            const coords = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
            zipCodeCache[zipCode] = coords;
            return coords;
        }
        return null;
    }, []);

    // Calculate distance between zip codes
    const calculateDistance = useCallback(async (zip1, zip2) => {
        const coords1 = await getZipCodeCoordinates(zip1);
        const coords2 = await getZipCodeCoordinates(zip2);
        
        if (!coords1 || !coords2) return Infinity;
    
        const R = 3959;
        const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
        const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }, [getZipCodeCoordinates]);

    useEffect(() => {
        const getFilteredContent = async () => {
            // First filter by distance if zip code is provided
            let filteredUsers = users;
            
            if (zipCode) {
                const usersWithDistance = await Promise.all(
                    users.map(async (user) => {
                        if (!user.zipCode) return { ...user, distance: Infinity };
                        const dist = await calculateDistance(zipCode, user.zipCode);
                        return { ...user, distance: dist };
                    })
                );
                
                filteredUsers = usersWithDistance.filter(user => 
                    user.distance <= parseInt(distance)
                );
            }
        
            if (searchType === 'cards') {
                // Filter the wantedCards based on search term
                const filteredWantedCardEntries = Object.entries(wantedCards)
                    .filter(([cardId, users]) => {
                        const card = cards.find(c => c.productId === cardId);
                        // Only include cards that match the search term
                        return card && card.name && card.name.toLowerCase().includes(searchTerm.toLowerCase());
                    });
                
                // Return the filtered entries as an array of card objects with their owners
                return filteredWantedCardEntries.map(([cardId, users]) => {
                    const card = cards.find(c => c.productId === cardId);
                    return {
                        ...card,
                        owners: users.map(user => ({
                            id: user.userId,
                            displayName: user.displayName
                        }))
                    };
                });
            } else {
                // Original user filtering logic
                return filteredUsers.filter(user => 
                    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
        };
    
        const updateFilteredContent = async () => {
            setIsLoading(true);
            const results = await getFilteredContent();
            setFilteredResults(results);
            setIsLoading(false);
        };
        updateFilteredContent();
    }, [searchTerm, searchType, zipCode, distance, users, cards, wantedCards, calculateDistance]);

    // Add useEffect to handle filtering
    // useEffect(() => {
    //     const updateFilteredContent = async () => {
    //         setIsLoading(true);
    //         const results = await getFilteredContent();
    //         setFilteredResults(results);
    //         setIsLoading(false);
    //     };
    //     updateFilteredContent();
    // }, [searchTerm, searchType, zipCode, distance, getFilteredContent]);

    useEffect(() => {
        if (currentUser) {
            const fetchUserZipCode = async () => {
                const userRef = doc(firestore, 'users', currentUser.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists() && userDoc.data().zipCode) {
                    setZipCode(userDoc.data().zipCode);
                }
            };
            fetchUserZipCode();
        }
    }, [currentUser]);

    // Add this early return for non-authenticated users
    if (!currentUser) {
        return (
            <div className="trading-hub-login-required">
                <h2>Trading Hub</h2>
                <p>You need to be logged in to use this feature</p>
                <button 
                    onClick={() => navigate('/login')}
                    className="login-button"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    const handleTradeInitiate = (card, ownerId) => {
        const cardWithValidImage = {
            ...card,
            id: card.productId || card.id,
            imageUrl: card.imageUrl || '',
            name: card.name || ''
        };
        setSelectedCard(cardWithValidImage);
        setSelectedUserId(ownerId);
        setShowTradeModal(true);
    };

    // handle location request
    const requestLocation = async () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const data = await response.json();
                const zipCode = data.address.postcode;
    
                const userRef = doc(firestore, 'users', currentUser.uid);
                await setDoc(userRef, {
                    zipCode: zipCode
                }, { merge: true });
                
                setZipCode(zipCode);
            });
        }
    };
    


    return (
        <div className="trading-hub">
            <h1>Trading Hub</h1>
            
            <div className="search-controls">
                <select 
                    value={searchType} 
                    onChange={(e) => setSearchType(e.target.value)}
                    className="search-type-select"
                >
                    <option value="cards">Search by Cards</option>
                    <option value="users">Search by Users</option>
                </select>
                <input
                    type="text"
                    placeholder={searchType === 'cards' ? "Search cards..." : "Search users..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <div className="location-filters">
                    <button 
                            onClick={requestLocation}
                            className="location-button"
                        >
                            Use My Location
                    </button>
                    <input
                        type="text"
                        placeholder="Enter your zip code"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="zip-input"
                    />
                    <select 
                        value={distance} 
                        onChange={(e) => setDistance(e.target.value)}
                        className="distance-select"
                    >
                        <option value="10">10 miles</option>
                        <option value="25">25 miles</option>
                        <option value="50">50 miles</option>
                        <option value="100">100 miles</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-indicator">Loading results...</div>
            ) : (
                searchType === 'cards' ? (
                    <div className="cards-grid">
                        {filteredResults.length > 0 ? (
                            filteredResults.map(card => (
                                <div key={card.productId} className="card-item">
                                    <img src={getImageUrl(card.imageUrl)} alt={card.name} />
                                    <h3>{card.name}</h3>
                                    <div className="card-owners">
                                        <h4>Available from:</h4>
                                        {card.owners.map(owner => (
                                            <button 
                                                key={owner.id}
                                                onClick={() => handleTradeInitiate(card, owner.id)}
                                                className="owner-button"
                                            >
                                                {owner.displayName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">No cards found matching your search criteria</div>
                        )}
                    </div>
                ) : (
                    <div className="users-grid">
                        {filteredResults.length > 0 ? (
                            filteredResults.map((user, index) => (
                                <div key={user.id || `user-${index}`} className="user-card">
                                    <h3>{user.displayName || 'Anonymous User'}</h3>
                                    <div className="user-stats">
                                        <p>Collection: {user.cardQuantities ? Object.keys(user.cardQuantities).length : 0} cards</p>
                                        <p>Wishlist: {user.wishList ? Object.keys(user.wishList).length : 0} cards</p>
                                    </div>
                                    <div className="user-actions">
                                        <button onClick={() => navigate(`/users/${user.id}/collection`)}>
                                            View Collection
                                        </button>
                                        <button onClick={() => navigate(`/users/${user.id}/wishlist`)}>
                                            View Wishlist
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">No users found matching your search criteria</div>
                        )}
                    </div>
                )
            )}

            <div className="wanted-cards-section">
                <h2>Most Wanted Cards</h2>
                <div className="wanted-cards-grid">
                    {Object.entries(wantedCards)
                        .sort((a, b) => b[1].length - a[1].length)
                        .slice(0, 10)
                        .map(([cardId, users]) => {
                            const card = cards.find(c => c.productId === cardId);
                            return card ? (
                                <div key={cardId} className="wanted-card-item">
                                    <img src={getImageUrl(card.imageUrl)} alt={card.name} />
                                    <h3>{card.name}</h3>
                                    <p>Wanted by {users.length} traders</p>
                                </div>
                            ) : null;
                        })}
                </div>
            </div>
            {showTradeModal && (
                <TradeOfferModal
                    card={selectedCard}
                    onClose={() => setShowTradeModal(false)}
                    targetUserId={selectedUserId}
                    getImageUrl={getImageUrl}
                />
            )}
        </div>
    );
}

export default TradingHub;
