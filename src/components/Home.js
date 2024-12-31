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


    const processLeadersByExtNumber = (decks) => {
        const leaderGroups = {};
        decks.forEach(deck => {
            if (deck.leader) {
                const extNumber = deck.leader.extNumber;
                if (!leaderGroups[extNumber]) {
                    leaderGroups[extNumber] = {
                        count: 0,
                        name: deck.leader.name,
                        extNumber: extNumber,
                        extColor: deck.leader.extColor
                    };
                }
                leaderGroups[extNumber].count++;
            }
        });
        return leaderGroups;
    };


    const { currentUser } = useAuth();
    const [cards, setCards] = useState([]);
    const [decks, setDecks] = useState([]);
    const [selectedLeader, setSelectedLeader] = useState('');
    const [selectedColors, setSelectedColors] = useState([]);
    const [leaderDistribution, setLeaderDistribution] = useState({});
    const [userCollection, setUserCollection] = useState([]);
    const navigate = useNavigate();
    //const [multicolorOnly, setMulticolorOnly] = useState(false);
    const leaderGroups = processLeadersByExtNumber(decks);
    //console.log('Leader Groups:', leaderGroups);

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
    
    const createLinearGradient = (color1, color2, index, total) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const segmentAngle = (2 * Math.PI) / total;
        const startAngle = segmentAngle * index;
        const endAngle = startAngle + segmentAngle;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const gradient = ctx.createLinearGradient(
            centerX + Math.cos(startAngle) * 100,
            centerY + Math.sin(startAngle) * 100,
            centerX + Math.cos(endAngle) * 100,
            centerY + Math.sin(endAngle) * 100
        );
        
        gradient.addColorStop(0, color1);
        gradient.addColorStop(0.5, color1);
        gradient.addColorStop(0.5, color2);
        gradient.addColorStop(1, color2);
        
        return gradient;
    };

    const colorMap = {
        'Red': '#b11c1e',
        'Blue': '#2085bd',
        'Green': '#208c6a',
        'Purple': '#7e3a83',
        'Black': '#262422',
        'Yellow': '#fae731'
    };

    const pieChartData = {
        labels: Object.values(leaderGroups).map(leader => `${leader.name} (${leader.count})`),
        datasets: [{
            data: Object.values(leaderGroups).map(leader => leader.count),
            backgroundColor: Object.values(leaderGroups).map((leader, index, array) => {
                //console.log('Processing colors for:', leader.name, leader.extColor);
                const colors = Array.isArray(leader.extColor) ? 
                    leader.extColor : 
                    (typeof leader.extColor === 'string' ? leader.extColor.split(';') : []);
                
                if (!colors || colors.length === 0) return '#CCCCCC';
                if (colors.length === 1) return colorMap[colors[0]];
                return createLinearGradient(colorMap[colors[0]], colorMap[colors[1]], index, array.length);
            }),
            borderWidth: 1
        }]
    };
    //console.log('Pie Chart Data:', pieChartData);


    // Update the leader dropdown options
    const leaderOptions = Object.values(leaderGroups).map(leader => (
        <option key={leader.extNumber} value={leader.extNumber}>
            {leader.name} ({leader.count})
        </option>
    ));


    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                onClick: null,
                labels: {
                    generateLabels: (chart) => {
                        const data = chart.data;
                        return data.labels.map((label, index) => {
                            const leader = Object.values(leaderGroups)[index];
                            const colors = Array.isArray(leader.extColor) ? 
                                leader.extColor : 
                                (typeof leader.extColor === 'string' ? leader.extColor.split(';') : []);
    
                            return {
                                text: label,
                                fillStyle: colors.length > 1 ? 
                                    createLinearGradient(colorMap[colors[0]], colorMap[colors[1]], index, data.labels.length) : 
                                    colorMap[colors[0]],
                                strokeStyle: '#fff',
                                lineWidth: 2,
                                hidden: false,
                                index: index
                            };
                        });
                    }
                }
            }
        }
    };
    


    const filteredDecks = decks.filter(deck => {
        const leaderMatch = !selectedLeader || 
            (deck.leader && deck.leader.extNumber === selectedLeader);
        const colorMatch = selectedColors.length === 0 || 
            selectedColors.some(color => deck.colors.includes(color));
        
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
               // console.log('Error loading user card data:', error);
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
                setCards(cardsData);
                //console.log('Cards Data:', cardsData[0]);
                
                // Create a map of productId to card name for quick lookup
                const cardMap = cardsData.reduce((acc, card) => {
                    acc[card.productId] = {
                        name: card.name,
                        imageUrl: card.imageUrl,
                        colors: Array.isArray(card.extColor) ? card.extColor : [],
                        extNumber: card.extNumber,
                        extColor: card.extColor 
                    };
                    return acc;
                }, {});
                //console.log('Card Map Example:', cardMap[Object.keys(cardMap)[0]]);

                // Fetch decks and map leader IDs to names
                const decksQuery = query(collection(firestore, 'decks'));
                const querySnapshot = await getDocs(decksQuery);
                const deckData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const leaderCard = cardMap[data.leaderId];
                    //console.log('Raw extColor:', leaderCard?.extColor);
                    return {
                        id: doc.id,
                        ...data,
                        leader: {
                            name: leaderCard?.name,
                            imageUrl: leaderCard?.imageUrl,
                            colors: leaderCard?.colors,
                            extNumber: leaderCard?.extNumber,
                            extColor: leaderCard?.extColor
                        }
                    };
                });
                
                setDecks(deckData);
                
                const distribution = deckData.reduce((acc, deck) => {
                    if (deck.leader) {
                        acc[deck.leader.extNumber] = (acc[deck.leader.extNumber] || 0) + 1;
                    }
                    return acc;
                }, {});
                setLeaderDistribution(distribution);
            } catch (error) {
                console.log('Error fetching decks:', error);
            }
        };
    
        fetchDecks();
    }, []);

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
                        className='showDecksSelectLeader'
                        value={selectedLeader}
                        onChange={(e) => setSelectedLeader(e.target.value)}
                    >
                        <option value="">All Leaders</option>
                        {Object.values(leaderGroups).map(leader => (
                            <option key={leader.extNumber} value={leader.extNumber}>
                                {leader.name} ({leader.count})
                            </option>
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
                            {deck.leader.imageUrl && (
                                <img 
                                    src={getImageUrl(deck.leader.imageUrl)}
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
