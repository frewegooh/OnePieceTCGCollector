import React, { useState, useEffect, useCallback } from 'react';
import { auth, firestore } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import CardList from './CardList';
import CardDetail from './CardDetail';
import Modal from './Modal';
import FilterSidebar from './FilterSidebar';
import API_URL from '../config';
import LoginPrompt from './LoginPrompt';

const MyCollection = ({ getImageUrl }) => {
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
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
    const [showOwnedOnly, setShowOwnedOnly] = useState(false);
    const [selectedCostValues, setSelectedCostValues] = useState([]);

    // Keep all the existing useEffects and functions from App.js related to collection management
    useEffect(() => {
        if (cards.length > 0) {
            const uniqueCosts = [...new Set(cards.map(card => parseInt(card.extCost, 10)).filter(cost => !isNaN(cost)))];
            setAvailableCostValues(uniqueCosts.sort((a, b) => a - b));

            const uniquePowers = [...new Set(cards.map(card => card.extPower).filter(power => power !== undefined && power !== null))];
            setAvailablePowerValues(uniquePowers.sort((a, b) => a - b));
    
            const uniqueAttributes = [...new Set(cards.map(card => card.extAttribute).filter(attr => attr))];
            setAvailableAttributes(uniqueAttributes.sort());

            const uniqueCounters = [...new Set(cards.map(card => card.extCounterplus).filter(counter => counter !== undefined))];
            setAvailableCounterValues(uniqueCounters.sort((a, b) => a - b));
        }
    }, [cards]);

    // Include all other collection-related functions and effects from App.js
    const loadUserCardData = useCallback(async (userId) => {
        const allCardData = await loadAllCardData();
        const docRef = doc(firestore, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        let userQuantities = {};
        if (docSnap.exists()) {
            userQuantities = docSnap.data().cardQuantities || {};
        }
        
        const cardsWithQuantities = allCardData.map(card => ({
            ...card,
            quantity: userQuantities[card.productId] || 0
        }));
        
        setCards(cardsWithQuantities);
        setFilteredCards(cardsWithQuantities);
    }, []);

    // Add loadAllCardData function
const loadAllCardData = async () => {
    try {
        const response = await fetch(`${API_URL}/api/cards`);
        const allCardData = await response.json();

        // Create a mapping of set IDs to their priority
        const setPriorities = {
            '23589': 1, // OP09
            '23462': 2, // OP08
            '23387': 3, // OP07
            '23272': 4, // OP06
            '23213': 5,  // OP05
            '23024': 6,  // OP04
            '22890': 7,  // OP03
            '17698': 8,  // OP02
            '3188': 9,  // OP01
            '3189': 10,  // ST01
            '3191': 11,  // ST02
            '3192': 12,  // ST03
            '3190': 13,  // ST04
            '17687': 14,  // ST05
            '17699': 15,  // ST06
            '22930': 16,  // ST07
            '22956': 17,  // ST08
            '22957': 18,  // ST09
            '23243': 19,  // ST10
            '23250': 20,  // ST11
            '23348': 21,  // ST12
            '23349': 22,  // ST13
            '23489': 23,  // ST14
            '23490': 24,  // ST15
            '23491': 25,  // ST16
            '23492': 26,  // ST17
            '23493': 27,  // ST18
            '23494': 28,  // ST19
            '23495': 29,  // ST20
            '23512': 30,  // ST20
        };

        return allCardData.sort((a, b) => {
            const priorityA = setPriorities[a.groupId] || 999;
            const priorityB = setPriorities[b.groupId] || 999;
            return priorityA - priorityB;
        });
    } catch (error) {
        console.error("Error fetching card data:", error);
        return [];
    }
};

// Add handleColorFilterChange function
const handleColorFilterChange = (updatedColors) => {
    setSelectedColors(updatedColors);
};

// Add updateQuantity function
const updateQuantity = async (cardId, newQuantity) => {
    if (!user) return;

    const docRef = doc(firestore, 'users', user.uid);
    try {
        const docSnap = await getDoc(docRef);
        const currentQuantities = docSnap.exists() ? docSnap.data().cardQuantities || {} : {};
        const updatedQuantities = {};
        
        for (const [id, qty] of Object.entries(currentQuantities)) {
            if (id !== cardId && qty > 0) {
                updatedQuantities[id] = qty;
            }
        }

        if (newQuantity > 0) {
            updatedQuantities[cardId] = newQuantity;
        }

        await setDoc(docRef, { cardQuantities: updatedQuantities });

        setCards(prevCards => 
            prevCards.map(card => 
                card.productId === cardId ? { ...card, quantity: newQuantity } : card
            )
        );
        setFilteredCards(prevCards => 
            prevCards.map(card => 
                card.productId === cardId ? { ...card, quantity: newQuantity } : card
            )
        );
    } catch (error) {
        console.error('Firebase update error:', error);
    }
};

        // Add card navigation handlers
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

        useEffect(() => {
            const fetchData = async () => {
                const allCards = await loadAllCardData();
                // Sort cards by priority sets
                const sortedCards = allCards.sort((a, b) => {
                    const prioritySets = ['OP09', 'OP08', 'OP07', 'OP06', 'ST01'];
                    const indexA = prioritySets.indexOf(a.groupId);
                    const indexB = prioritySets.indexOf(b.groupId);
                    
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    
                    return 0;
                });
                setCards(sortedCards);
                setFilteredCards(sortedCards);
            };
            fetchData();
        }, []);

        useEffect(() => {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                setUser(user);
                if (user) {
                    await loadUserCardData(user.uid);
                }
            });
            return unsubscribe;
        }, [loadUserCardData]);

        useEffect(() => {
            if (cards.length > 0) {
                const uniqueColors = [...new Set(cards.flatMap((card) => card.extColor?.split(';') || []))];
                setAvailableColors(uniqueColors);
            }
        }, [cards]);


        useEffect(() => {
            const filtered = cards.filter((card) => {    
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
        
                const matchesSearchQuery = searchQuery.trim().toLowerCase()
                    ? Object.values(card).some((value) =>
                          value &&
                          value.toString().toLowerCase().includes(searchQuery.trim().toLowerCase())
                      )
                    : true;
        
                const matchesType =
                    selectedTypes.length === 0 || selectedTypes.includes(card.extCardType);
        
                const matchesCounter =
                    selectedCounterValues.length === 0 || selectedCounterValues.includes(card.extCounterplus);
        
                const matchesCost =
                    selectedCostValues.length === 0 ||
                    (card.extCost &&
                        !isNaN(Number(card.extCost)) &&
                        selectedCostValues.includes(String(card.extCost)));
        
                const matchesPower =
                    selectedPowerValues.length === 0 || selectedPowerValues.includes(card.extPower);
        
                const matchesGroup = !selectedGroupID || String(card.groupId) === String(selectedGroupID);
        
                const matchesAttribute =
                    selectedAttributes.length === 0 ||
                    selectedAttributes.includes(card.extAttribute);
        
                const matchesOwned = !showOwnedOnly || card.quantity > 0;        
        
                return (
                    matchesColor &&
                    matchesSearchQuery &&
                    matchesType &&
                    matchesCost &&
                    matchesPower &&
                    matchesGroup &&
                    matchesAttribute &&
                    matchesCounter &&
                    matchesOwned
                );
            });
        
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
            showOwnedOnly
        ]);

        useEffect(() => {
            const fetchGroupData = async () => {
                const response = await fetch('/OnePieceCardGameGroups.csv');
                const csvText = await response.text();
                const parsedData = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
        
                const groups = parsedData.reduce((map, group) => {
                    if (group.groupId && group.name) {
                        map[group.groupId] = group.name;
                    }
                    return map;
                }, {});
                
                setGroupMap(groups);
            };
            fetchGroupData();
        }, []);


        // Infinite Scroll
        useEffect(() => {
            const cardListContainer = document.querySelector('.collectionPage.cardListCSS');
            if (cardListContainer) {
                let timeoutId;
                const handleScroll = () => {
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    timeoutId = setTimeout(() => {
                        const { scrollTop, scrollHeight, clientHeight } = cardListContainer;
                        if (scrollTop + clientHeight >= scrollHeight - 50) {
                            setDisplayedCards(prevDisplayedCards => prevDisplayedCards + 25);
                        }
                    }, 150);
                };
                cardListContainer.addEventListener('scroll', handleScroll);
                return () => {
                    cardListContainer.removeEventListener('scroll', handleScroll);
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                };
            }
        }, []);

        useEffect(() => {
            const handleScroll = () => {
                if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
                    setDisplayedCards(prevDisplayedCards => prevDisplayedCards + 25);
                }
            };
        
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }, []);

    return (
        <>
            <div className='myCollectionPage'>
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
                        showOwnedOnly={showOwnedOnly}
                        onOwnedOnlyChange={() => setShowOwnedOnly(!showOwnedOnly)}
                    />
                </div>

                <div className="collectionPage cardListCSS">
                    <div className="total-value">
                        Total Collection Value: $
                            {cards.reduce((total, card) => {
                                const price = parseFloat(card.marketPrice) || 0;
                                const quantity = card.quantity || 0;
                                return total + (price * quantity);
                            }, 0).toFixed(2)}
                    </div>
                    <CardList
                        cards={filteredCards.slice(0, displayedCards)}
                        updateQuantity={updateQuantity}
                        onSecondaryButtonClick={handleViewDetails}
                        secondaryButtonLabel="View Details"
                        enableCardClick={true}
                        showQuantity={true}
                        getImageUrl={getImageUrl}
                    />
                </div>
            </div>

            <LoginPrompt 
                open={showLoginPrompt} 
                onClose={() => setShowLoginPrompt(false)} 
            />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedCard && (
                    <CardDetail 
                        card={selectedCard} 
                        onPrevious={handlePreviousCard} 
                        onNext={handleNextCard} 
                    />
                )}
            </Modal>
        </>
    );
};

export default MyCollection;
