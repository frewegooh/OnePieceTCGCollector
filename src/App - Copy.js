import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth, firestore } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import Login from './components/Login';
import Register from './components/Register';
import CardList from './components/CardList';
import CardDetail from './components/CardDetail';
import Modal from './components/Modal';
import FilterSidebar from './components/FilterSidebar';
import DeckBuilder from './components/DeckBuilder';
import './App.css';

const App = () => {
    const [user, setUser] = useState(null);
    const [cards, setCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedColors, setSelectedColors] = useState([]);
    const [multicolorOnly, setMulticolorOnly] = useState(false);
    const [selectedGroupID, setSelectedGroupID] = useState(null);
    const [groupMap, setGroupMap] = useState({});
    const [displayedCards, setDisplayedCards] = useState(25);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [availableCostValues, setAvailableCostValues] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [selectedPowerValues, setSelectedPowerValues] = useState([]);
    const [availablePowerValues, setAvailablePowerValues] = useState([]);
    const [selectedCounterValues, setSelectedCounterValues] = useState([]);
    const [availableCounterValues, setAvailableCounterValues] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);


    //const handleSearchChange = (query) => {
    //    setSearchQuery(query);
    //};

    //const localImageUrl = (imageUrl) =>
    //    `http://localhost:5000/images/${imageUrl.split('/').pop().replace('_200w.jpg', '_400w.jpg')}`;

    //const downloadImage = async (imageUrl) => {
    //    const response = await fetch(`http://localhost:5000/download-image?imageUrl=${imageUrl}`);
    //    if (response.ok) {
    //        console.log("Image downloaded:", await response.text());
    //    } else {
    //        console.error("Failed to download image");
    //    }
    //};

    //const handleDownloadImages = async () => {
    //    try {
    //        const response = await fetch('http://localhost:5000/api/download-all-images', {
    //            method: 'POST',
    //       });
    //
    //        if (response.ok) {
   //             alert('Images downloaded successfully!');
   //         } else {
//                alert('Failed to download images.');
//            }
//        } catch (error) {
//            console.error('Error downloading images:', error);
//            alert('Error downloading images.');
//        }
//    };
    
    useEffect(() => {
        if (cards.length > 0) {
            // Extract unique cost values
            const uniqueCosts = [...new Set(cards.map(card => parseInt(card.extCost, 10)).filter(cost => !isNaN(cost)))];
            setAvailableCostValues(uniqueCosts.sort((a, b) => a - b)); // Ensure sorted numbers

            // Extract unique power values
            const uniquePowers = [...new Set(cards.map(card => card.extPower).filter(power => power !== undefined && power !== null))];
            setAvailablePowerValues(uniquePowers.sort((a, b) => a - b));
    
            // Extract unique attribute values
            const uniqueAttributes = [...new Set(cards.map(card => card.extAttribute).filter(attr => attr))];
            setAvailableAttributes(uniqueAttributes.sort());

            // Extract unique counter values
            const uniqueCounters = [...new Set(cards.map(card => card.extCounterplus).filter(counter => counter !== undefined))];
            setAvailableCounterValues(uniqueCounters.sort((a, b) => a - b));
        }
    }, [cards]);

    //const handleCostChange = (value) => {
    //    const updatedCosts = selectedCostValues.includes(value)
    //        ? selectedCostValues.filter((v) => v !== value) // Remove if already selected
    //        : [...selectedCostValues, value]; // Add if not selected
    //
    //    setSelectedCostValues(updatedCosts);
    //};

    const loadUserCardData = useCallback(async (userId) => {
        // First load all card data
        const allCardData = await loadAllCardData();
        
        // Then get user's quantities from Firebase
        const docRef = doc(firestore, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        let userQuantities = {};
        if (docSnap.exists()) {
            userQuantities = docSnap.data().cardQuantities || {};
        }
        
        // Merge card data with user quantities
        const cardsWithQuantities = allCardData.map(card => ({
            ...card,
            quantity: userQuantities[card.productId] || 0
        }));
        
        setCards(cardsWithQuantities);
        setFilteredCards(cardsWithQuantities);
    }, []);


    useEffect(() => {
        const fetchGroupData = async () => {
            const groups = await loadGroupData();
            setGroupMap(groups);
        };
        fetchGroupData();
    }, []);


    const loadGroupData = async () => {
        const response = await fetch('/OnePieceCardGameGroups.csv');
        const csvText = await response.text();
        const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;


        const groupMap = parsedData.reduce((map, group) => {
            if (group.groupId && group.name) {
                map[group.groupId] = group.name;
            }
            return map;
        }, {});

        return groupMap;
    };

    const loadAllCardData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/cards');
            const allCardData = await response.json();
            
            // Log the first few cards to verify groupIds
            //console.log('First few cards before filtering:', allCardData.slice(0, 3));
            
            return allCardData;
        } catch (error) {
            console.error("Error fetching card data:", error);
            return [];
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            const allCards = await loadAllCardData();
            setCards(allCards);
            setFilteredCards(allCards);
        };
        fetchData();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                setDisplayedCards(prevDisplayedCards => prevDisplayedCards + 25);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    //const saveUserCardData = async (userId, updatedCards) => {
    //    try {
    //        const docRef = doc(firestore, 'users', userId);
    //        await setDoc(docRef, { cards: updatedCards });
    //    } catch (error) {
    //        console.error("Error saving card data:", error);
    //    }
    //};

    const [selectedCostValues, setSelectedCostValues] = useState([]);
    //const availableCosts = Array.from(new Set(cards.map((card) => card.extCost))).sort((a, b) => a - b);

    //const handleGroupFilterChange = (groupId) => {
    //    setSelectedGroupID(groupId);
    //};

    const handleViewDetails = (card) => {
        const cardIndex = filteredCards.findIndex(c => c.productId === card.productId);
        setSelectedCard({ ...card, index: cardIndex });
        setIsModalOpen(true);
    };
    
    const handlePreviousCard = () => {
        if (selectedCard && selectedCard.index > 0) {
            const previousCard = filteredCards[selectedCard.index - 1];
            setSelectedCard({ ...previousCard, index: selectedCard.index - 1 });
        }
    };
    
    const handleNextCard = () => {
        if (selectedCard && selectedCard.index < filteredCards.length - 1) {
            const nextCard = filteredCards[selectedCard.index + 1];
            setSelectedCard({ ...nextCard, index: selectedCard.index + 1 });
        }
    };




    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCard(null);
    };

    const updateQuantity = async (cardId, newQuantity) => {
    if (!user) return;

    const docRef = doc(firestore, 'users', user.uid);
    await setDoc(docRef, {
        cardQuantities: {
            [cardId]: newQuantity
        }
    }, { merge: true });

    setCards(prevCards => 
        prevCards.map(card => 
            card.productId === cardId 
                ? { ...card, quantity: newQuantity }
                : card
        )
    );
};


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user && cards.length === 0) {  // Only load if we don't have cards
                await loadUserCardData(user.uid);
            }
        });
        return unsubscribe;
    }, [loadUserCardData, cards.length]);

    useEffect(() => {
        const filtered = cards.filter((card) => {    
            // Log the current filtering state
            console.log('Filtering card:', {
                name: card.name,
                groupId: card.groupId,
                selectedGroupID
            });
            
            
            const cardGroupId = card.groupId?.toString();
            const selectedId = selectedGroupID?.toString();

            const cardColors = card.extColor ? card.extColor.split(';') : [];
            const matchesColor = (() => {
                if (multicolorOnly) {
                    const isMulticolor = cardColors.length > 1;
                    if (!isMulticolor) return false;
                    if (selectedColors.length > 0) {
                        return selectedColors.some((color) => cardColors.includes(color));
                    }
                    return true;
                }
                return (
                    selectedColors.length === 0 ||
                    selectedColors.some((color) => cardColors.includes(color))
                );
            })();
    
            // Search Query
            const matchesSearchQuery = searchQuery.trim().toLowerCase()
                ? Object.values(card).some((value) =>
                      value &&
                      value.toString().toLowerCase().includes(searchQuery.trim().toLowerCase())
                  )
                : true;
    
            // Card Type
            const matchesType =
                selectedTypes.length === 0 || selectedTypes.includes(card.extCardType);

            // Counter 
            const matchesCounter =
                selectedCounterValues.length === 0 || selectedCounterValues.includes(card.extCounterplus);


            // Cost
            const matchesCost =
            selectedCostValues.length === 0 ||
            (card.extCost &&
                !isNaN(Number(card.extCost)) &&
                selectedCostValues.includes(String(card.extCost)));
    
            // Power
            const matchesPower =
                selectedPowerValues.length === 0 || selectedPowerValues.includes(card.extPower);

    
            // Group
            const matchesGroup =
                !selectedGroupID || String(card.groupID) === String(selectedGroupID);
    
            // Attributes
            const matchesAttribute =
                selectedAttributes.length === 0 ||
                selectedAttributes.includes(card.extAttribute);
    
            const isMatch =
                matchesColor &&
                matchesSearchQuery &&
                matchesType &&
                matchesCost &&
                matchesPower &&
                matchesGroup &&
                matchesAttribute &&
                matchesCounter;

            return isMatch &&  matchesType && matchesCost && matchesPower && matchesCounter ;;
        });
    

        console.log('Filtered results:', filtered.length);
        setFilteredCards(filtered);
        
    }, [
        selectedColors,
        selectedCostValues,
        selectedPowerValues,
        selectedGroupID,
        cards,
        multicolorOnly,
        searchQuery,
        selectedTypes,
        selectedAttributes,
        selectedCounterValues,
    ]);
    
    

    const handleColorFilterChange = (updatedColors) => {
        setSelectedColors(updatedColors);
    };
    

    
    //const handleTypeFilterChange = (updatedTypes) => {
    //    setSelectedTypes(updatedTypes); // Update state with the flat array
    //};
    
    //const handlePowerChange = (updatedPowers) => {
    //    setSelectedPowerValues(updatedPowers); // Update state with the flat array
    //};
    
    //const handleAttributeChange = (updatedAttributes) => {
    //    setSelectedAttributes(updatedAttributes);
    //};


    useEffect(() => {
        if (cards.length > 0) {
            const uniqueColors = [...new Set(cards.flatMap((card) => card.extColor?.split(';') || []))];
            setAvailableColors(uniqueColors);
        }
    }, [cards]);


    /* End */
    

    return (
        <Router>
            <div className="App" style={{ display: 'flex' }}>
                {user ? (
                    <div>
                        <div className="navHolder">
                            <header>
                                <Link to="/">
                                    <img src="/Logo-Horz.png" alt="Logo" className="menuLogo" />
                                </Link>
                                <nav>
                                    <Link to="/">Home</Link>
                                    <Link to="/deck-builder">Deck Builder
                                    </Link>
                                    <Link className="logoutButton" onClick={() => auth.signOut()}>
                                        Log Out
                                    </Link>

                                    {/* <button onClick={handleDownloadImages} style={{ marginTop: '20px' }}>
                                        Download Images
                                    </button> */}
                                </nav>
                            </header>
                        </div>
                        <section className="secBody">
                            <Routes>
                                <Route
                                    path="/"
                                    element={
                                        <>
                                            <div className="sideFilterPar">
                                            <FilterSidebar
                                                cards={cards}
                                                onFilteredCardsChange={setFilteredCards}
                                                selectedColors={selectedColors}
                                                onColorChange={handleColorFilterChange}
                                                availableColors={availableColors}
                                                multicolorOnly={multicolorOnly}
                                                onMulticolorChange={() => setMulticolorOnly(!multicolorOnly)}
                                                searchQuery={searchQuery}
                                                onSearchChange={setSearchQuery}
                                                selectedTypes={selectedTypes}
                                                onTypeChange={setSelectedTypes}
                                                availableTypes={['Character', 'Event', 'Stage', 'Leader']}
                                                selectedCostValues={selectedCostValues}
                                                onCostChange={setSelectedCostValues}
                                                availableCostValues={availableCostValues}
                                                selectedPowerValues={selectedPowerValues}
                                                onPowerChange={setSelectedPowerValues}
                                                availablePowerValues={availablePowerValues}
                                                selectedCounterValues={selectedCounterValues}
                                                onCounterChange={setSelectedCounterValues}
                                                availableCounterValues={availableCounterValues}
                                                selectedAttributes={selectedAttributes}
                                                onAttributeChange={setSelectedAttributes}
                                                availableAttributes={availableAttributes}
                                                selectedGroupID={selectedGroupID}
                                                onGroupChange={setSelectedGroupID}
                                                groupMap={groupMap}
                                            />
                                            </div>

                                            <div className="rightCardPanel">
                                                <div className="cardListCSS">
                                                    <CardList
                                                        cards={filteredCards.slice(0, displayedCards)}
                                                        updateQuantity={updateQuantity}
                                                        onSecondaryButtonClick={handleViewDetails}
                                                        secondaryButtonLabel="View Details"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    }
                                />
                                <Route path="/deck-builder" element={<DeckBuilder cards={cards} />} />
                            </Routes>
                        </section>
                    </div>
                ) : (
                    <div>
                        <Login />
                        <Register />
                    </div>
                )}
                <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                    {selectedCard && (
                        <CardDetail 
                            card={selectedCard} 
                            onPrevious={handlePreviousCard} 
                            onNext={handleNextCard} 
                        />
                    )}
                </Modal>
            </div>
        </Router>
    );
};

export default App;
