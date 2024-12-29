import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import API_URL from '../config';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import MultiSelectDropdown from './MultiSelectDropdown';


ChartJS.register(ArcElement, Tooltip, Legend);

const Home = ({ getImageUrl }) => {
    const { currentUser } = useAuth();
    const [cards, setCards] = useState([]);
    const [decks, setDecks] = useState([]);
    const [selectedLeader, setSelectedLeader] = useState('');
    const [selectedColors, setSelectedColors] = useState([]);
    const [leaderDistribution, setLeaderDistribution] = useState({});
    const [userCollection, setUserCollection] = useState([]);
    const navigate = useNavigate();
    //const [multicolorOnly, setMulticolorOnly] = useState(false);

    //const onMulticolorChange = (checked) => {
    //    setMulticolorOnly(checked);
    //};

    // Fetch cards and collection data
    useEffect(() => {
        const loadUserCardData = async () => {

            try {
                const docRef = doc(firestore, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                const cardsResponse = await fetch(`${API_URL}/api/cards`);
                const cardsData = await cardsResponse.json();
                
                const userQuantities = docSnap.exists() ? docSnap.data().cardQuantities || {} : {};
                
                const cardsWithQuantities = cardsData.map(card => ({
                    ...card,
                    quantity: userQuantities[card.productId] || 0
                }));
    
                setCards(cardsWithQuantities);
                setUserCollection(cardsWithQuantities.filter(card => card.quantity > 0));
            } catch (error) {
                console.log('Error loading user card data:', error);
            }
        };
    
        loadUserCardData();
    }, [currentUser]); // Empty dependency array means it runs once on mount
    


    const pieChartData = {
        labels: Object.keys(leaderDistribution),
        datasets: [{
            data: Object.values(leaderDistribution),
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
            ],
            borderWidth: 1
        }]
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                onClick: null, // Disables legend clicking
                labels: {
                    sort: null // Disables sorting
                }
            }
        }
    };
    


    const filteredDecks = decks.filter(deck => {
        const leaderMatch = !selectedLeader || deck.leader === selectedLeader;
        const colorMatch = selectedColors.length === 0 || 
            (deck.colors && selectedColors.every(color => deck.colors.includes(color)));
        return leaderMatch && colorMatch;
    });

    // Inside your component:
    useEffect(() => {
        const loadUserCardData = async () => {
            if (!currentUser) return;
    
            try {
                const docRef = doc(firestore, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                const cardsResponse = await fetch(`${API_URL}/api/cards`);
                const cardsData = await cardsResponse.json();
                
                const userQuantities = docSnap.exists() ? docSnap.data().cardQuantities || {} : {};
                
                const cardsWithQuantities = cardsData.map(card => ({
                    ...card,
                    quantity: userQuantities[card.productId] || 0
                }));
    
                setCards(cardsWithQuantities);
                setUserCollection(cardsWithQuantities.filter(card => card.quantity > 0));
            } catch (error) {
                console.log('Error loading user card data:', error);
            }
        };
    
        loadUserCardData();
    }, [currentUser]);

    // Fetch decks
    useEffect(() => {
        const fetchDecks = async () => {    
            try {
                // First get all cards to have a reference for leader names
                const cardsResponse = await fetch(`${API_URL}/api/cards`);
                const cardsData = await cardsResponse.json();
                
                // Create a map of productId to card name for quick lookup
                const cardMap = cardsData.reduce((acc, card) => {
                    acc[card.productId] = {
                        name: card.name,
                        imageUrl: card.imageUrl,
                        colors: card.extColor ? card.extColor.split(';') : []
                    };
                    return acc;
                }, {});
    
                // Fetch decks and map leader IDs to names
                const decksQuery = query(collection(firestore, 'decks'));
                const querySnapshot = await getDocs(decksQuery);
                const deckData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const leaderCard = cardMap[data.leaderId];
                    return {
                        id: doc.id,
                        ...data,
                        leader: leaderCard?.name || 'Unknown Leader',
                        leaderImageUrl: leaderCard?.imageUrl,
                        colors: leaderCard?.colors || []
                    };
                });
                
                setDecks(deckData);
                
                const distribution = deckData.reduce((acc, deck) => {
                    acc[deck.leader] = (acc[deck.leader] || 0) + 1;
                    return acc;
                }, {});
                setLeaderDistribution(distribution);
            } catch (error) {
                console.log('Error fetching decks:', error);
            }
        };
    
        fetchDecks();
    }, []);


    //const handleDeckClick = (deckId) => {
    //    navigate(`/deck/${deckId}`);
    //};

    return (
        <div className="home-container">
            <div className="collection-value">
                <h2>Total Collection Value</h2>
                <div className="total-value">
                    ${userCollection.reduce((total, card) => {
                        const price = parseFloat(card.marketPrice) || 0;
                        const quantity = card.quantity || 0;
                        return total + (price * quantity);
                    }, 0).toFixed(2)}
                </div>
            </div>

            <div className="deck-statistics">
                <h2>Deck Statistics</h2>
                <div className="stats-container">
                    <div className="pie-chart">
                        <Pie data={pieChartData} options={pieOptions} />
                    </div>
                </div>


                <div className="filters">
                    <select 
                        value={selectedLeader}
                        onChange={(e) => setSelectedLeader(e.target.value)}
                    >
                        <option value="">All Leaders</option>
                        {Object.keys(leaderDistribution).map(leader => (
                            <option key={leader} value={leader}>{leader}</option>
                        ))}
                    </select>
                    
                    <div className="color-options">
                        <MultiSelectDropdown
                            title="Color"
                            options={['Green', 'Purple', 'Black', 'Red', 'Blue', 'Yellow']}
                            selectedOptions={selectedColors}
                            onOptionChange={setSelectedColors}
                            //additionalOption={true}
                            //additionalOptionLabel="Multicolor Only"
                            //additionalOptionChecked={multicolorOnly}
                            //onAdditionalOptionChange={onMulticolorChange}
                        />
                    </div>
                </div>

                <div className="decks-grid">
                {filteredDecks.map(deck => (
                        <div 
                            key={deck.id} 
                            className="deck-preview"
                            onClick={() => navigate(`/deck/${deck.id}`)}
                        >
                            {deck.leaderImageUrl && (
                                <img 
                                    src={getImageUrl(deck.leaderImageUrl)}
                                    alt="Deck Leader"
                                    className="deck-preview-image"
                                />
                            )}
                            <h2>{deck.name}</h2>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
