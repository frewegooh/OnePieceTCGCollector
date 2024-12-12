import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth, firestore } from './firebase';
import {
    doc,
    setDoc,
    getDoc,
    writeBatch,
    query,
    collection,
    limit,
    startAfter,
    orderBy,
    getDocs,
} from 'firebase/firestore';
import Papa from 'papaparse';
import Login from './components/Login';
import Register from './components/Register';
import CardList from './components/CardList';
import CardDetail from './components/CardDetail';
import Modal from './components/Modal';
import FilterSidebar from './components/FilterSidebar';
import DeckBuilder from './components/DeckBuilder';
import './App.css';
import { onAuthStateChanged } from 'firebase/auth';

const App = () => {
    // --- State Variables ---
    const [user, setUser] = useState(null); // Current authenticated user
    const [cards, setCards] = useState([]); // All cards loaded
    const [filteredCards, setFilteredCards] = useState([]); // Cards after filtering
    const [selectedCard, setSelectedCard] = useState(null); // Card selected for details
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility
    const [searchQuery, setSearchQuery] = useState(''); // Search query
    const [displayedCards, setDisplayedCards] = useState(25); // Pagination for displayed cards
    const [selectedColors, setSelectedColors] = useState([]); // Selected colors for filtering
    const [selectedTypes, setSelectedTypes] = useState([]); // Selected card types
    const [selectedCostValues, setSelectedCostValues] = useState([]); // Cost filter values
    const [selectedPowerValues, setSelectedPowerValues] = useState([]); // Power filter values
    const [selectedAttributes, setSelectedAttributes] = useState([]); // Selected attributes
    const [availableColors, setAvailableColors] = useState([]); // Unique colors
    const [groupMap, setGroupMap] = useState({}); // Group data mapping


    const FilterSidebar = ({
        selectedColors,
        onColorChange,
        selectedTypes,
        onTypeChange,
        searchQuery,
        onSearchChange,
        onFilteredCardsChange, // Ensure this is declared here
    }) => {
        useEffect(() => {
            const filteredCards = // Apply filtering logic...
            onFilteredCardsChange && onFilteredCardsChange(filteredCards); // Call the handler safely
        }, [selectedColors, selectedTypes, searchQuery]);
    
        return <div>{/* Sidebar rendering */}</div>;
    };

    // --- Fetch All Card Data ---
    const fetchAllCardData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/cards'); // Replace with actual endpoint
            const allCardData = await response.json();

            // Process card data (add additional fields if needed)
            return allCardData.map((card) => ({
                ...card,
                groupID: card.groupId || card.group_id || card.groupID,
                extCounterplus: card.extCounterplus || card.counter_plus || 0,
            }));
        } catch (error) {
            console.error('Error fetching card data:', error);
            return [];
        }
    };
    // --- Load User Card Data ---
    const loadUserCardData = async (userId, allCardData) => {
        try {
            const cardsRef = collection(firestore, 'users', userId, 'cards');
            const snapshot = await getDocs(cardsRef);

            const userCardQuantities = snapshot.docs.reduce((acc, doc) => {
                acc[doc.id] = doc.data().quantity;
                return acc;
            }, {});

            // Merge user data into all card data
            return allCardData.map((card) => ({
                ...card,
                quantity: userCardQuantities[card.productID] || 0,
            }));
        } catch (error) {
            console.error('Error loading user card data:', error);
            return allCardData.map((card) => ({ ...card, quantity: 0 }));
        }
    };

    // --- Fetch and Merge All Cards ---
    useEffect(() => {
        const fetchAndSetCards = async () => {
            try {
                const userId = auth.currentUser?.uid;
                if (!userId) {
                    console.warn('User not authenticated.');
                    return;
                }

                const allCardData = await fetchAllCardData();
                const mergedCards = await loadUserCardData(userId, allCardData);

                setCards(mergedCards);
            } catch (error) {
                console.error('Error fetching and merging cards:', error);
            }
        };

        fetchAndSetCards();
    }, []);
    // --- Handle Infinite Scroll for Pagination ---
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                setDisplayedCards((prev) => prev + 25);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- Update Quantity for Cards ---
    const updateQuantity = async (productId, quantity) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                console.error('User is not authenticated.');
                return;
            }

            const cardDocRef = doc(firestore, 'users', userId, 'cards', productId);
            await setDoc(cardDocRef, { quantity }, { merge: true });

            // Update local state
            setCards((prevCards) =>
                prevCards.map((card) =>
                    card.productID === productId ? { ...card, quantity } : card
                )
            );
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    // --- Filters and Search ---
    useEffect(() => {
        const applyFilters = () => {
            const filtered = cards.filter((card) => {
                const matchesColor =
                    selectedColors.length === 0 ||
                    selectedColors.some((color) => (card.extColor || '').includes(color));

                const matchesType =
                    selectedTypes.length === 0 || selectedTypes.includes(card.extCardType);

                const matchesSearchQuery =
                    !searchQuery ||
                    Object.values(card).some((value) =>
                        value
                            ?.toString()
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                    );

                return matchesColor && matchesType && matchesSearchQuery;
            });

            setFilteredCards(filtered);
        };

        applyFilters();
    }, [cards, selectedColors, selectedTypes, searchQuery]);
    // --- Authentication Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (!user) {
                setCards([]);
                setFilteredCards([]);
            }
        });

        return () => unsubscribe();
    }, []);

    // --- Helper Functions ---
    const handleColorFilterChange = (colors) => setSelectedColors(colors);
    const handleTypeFilterChange = (types) => setSelectedTypes(types);
    const handleSearchQueryChange = (query) => setSearchQuery(query);

    // --- Render ---
    return (
        <Router>
            <div className="App" style={{ display: 'flex' }}>
                {user ? (
                    <>
                        <header>
                            <Link to="/">
                                <img src="/Logo-Horz.png" alt="Logo" className="menuLogo" />
                            </Link>
                            <nav>
                                <Link to="/">Home</Link>
                                <Link to="/deck-builder">Deck Builder</Link>
                                <button onClick={() => auth.signOut()}>Log Out</button>
                            </nav>
                        </header>
                        <section className="content">
                            <Routes>
                                <Route
                                    path="/"
                                    element={
                                        <>
                                            <FilterSidebar
                                                selectedColors={selectedColors}
                                                onColorChange={handleColorFilterChange}
                                                selectedTypes={selectedTypes}
                                                onTypeChange={handleTypeFilterChange}
                                                searchQuery={searchQuery}
                                                onSearchChange={handleSearchQueryChange}
                                                onFilteredCardsChange={onFilteredCardsChange}
                                            />
                                            <CardList
                                                cards={filteredCards.slice(0, displayedCards)}
                                                updateQuantity={updateQuantity}
                                            />
                                        </>
                                    }
                                />
                                <Route
                                    path="/deck-builder"
                                    element={<DeckBuilder cards={cards} />}
                                />
                            </Routes>
                        </section>
                    </>
                ) : (
                    <>
                        <Login />
                        <Register />
                    </>
                )}
                {isModalOpen && selectedCard && (
                    <Modal onClose={() => setIsModalOpen(false)}>
                        <CardDetail card={selectedCard} />
                    </Modal>
                )}
            </div>
        </Router>
    );
};

export default App;
