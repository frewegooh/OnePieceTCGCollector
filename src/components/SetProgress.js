import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const SetProgress = ({ cards, user }) => {
    const navigate = useNavigate();
    const [userCollection, setUserCollection] = useState({});
 
    const loadUserCardData = useCallback(async (userId) => {
        try {
            const docRef = doc(firestore, 'users', userId);
            const docSnap = await getDoc(docRef);
            //console.log('Firebase response:', docSnap.data());
            
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setUserCollection(userData.cardQuantities || {});
            }
        } catch (error) {
            //console.log('Error loading user data:', error);
        }
    }, []);
    
    useEffect(() => {
        if (user) {
            loadUserCardData(user.uid);
        }
    }, [user, loadUserCardData]);

    useEffect(() => {
        const fetchUserCollection = async () => {
            if (user) {
                const docRef = doc(firestore, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserCollection(docSnap.data().cardQuantities || {});
                }
            }
        };
        fetchUserCollection();
    }, [user]);

    const calculateSetProgress = (setId) => {
        const setCards = cards.filter(card => String(card.groupId) === String(setId));
        //console.log('Cards in set:', setCards);
        //console.log('User collection:', userCollection);

        const totalCardsInSet = setCards.length;
        // Count cards where the user has at least 1 copy
        const ownedCards = setCards.reduce((count, card) => {
            const isOwned = userCollection[card.productId] && userCollection[card.productId] > 0;
            //console.log(`Card ${card.productId}: ${isOwned ? 'owned' : 'not owned'}`);
            return isOwned ? count + 1 : count;
        }, 0);

        
        const progress = {
            percentage: totalCardsInSet ? (ownedCards / totalCardsInSet) * 100 : 0,
            owned: ownedCards,
            total: totalCardsInSet
        };

        //console.log('Progress for set:', progress);
        return progress;
    };

    const setNameToId = {
        'Royal Blood': '23766',
        'Emperors in the New World': '23589',
        'Premium Booster -The Best-': '23496',
        'Two Legends': '23462',
        '500 Years in the Future': '23387',
        'Wings of the Captain': '23272',
        'Awakening of the New Era': '23213',
        'Kingdoms of Intrigue': '23024',
        'Pillars of Strength': '22890',
        'Paramount War': '17698',
        'Romance Dawn': '3188',
        'Starter Deck 1: Straw Hat Crew': '3189',
        'Starter Deck 2: Worst Generation': '3191',
        'Starter Deck 3: The Seven Warlords of The Sea': '3192',
        'Starter Deck 4: Animal Kingdom Pirates': '3190',
        'Starter Deck 5: Film Edition': '17687',
        'Starter Deck 6: Absolute Justice': '17699',
        'Starter Deck 7: Big Mom Pirates': '22930',
        'Starter Deck 8: Monkey.D.Luffy': '22956',
        'Starter Deck 9: Yamato': '22957',
        'Ultra Deck: The Three Captains': '23243',
        'Starter Deck 11: Uta': '23250',
        'Starter Deck 12: Zoro and Sanji': '23348',
        'Ultra Deck: The Three Brothers': '23349',
        'Starter Deck 14: 3D2Y': '23489',
        'Starter Deck 15: RED Edward.Newgate': '23490',
        'Starter Deck 16: GREEN Uta': '23491',
        'Starter Deck 17: BLUE Donquixote Doflamingo': '23492',
        'Starter Deck 18: PURPLE Monkey.D.Luffy': '23493',
        'Starter Deck 19: BLACK Smoker': '23494',
        'Starter Deck 20: YELLOW Charlotte Katakuri': '23495',
        'Emperors in the New World: 2nd Anniversary Tournament Cards': '23590',
        'Two Legends Pre-Release Cards': '23737',
        '500 Years in the Future Pre-Release Cards': '23512',
        'Wings of the Captain Pre-Release Cards': '23424',
        'Awakening of the New Era: 1st Anniversary Tournament Cards': '23368',
        'Extra Booster: Anime 25th Collection': '23834',
        'Extra Booster: Memorial Collection': '23333',
        'Kingdoms of Intrigue Pre-Release Cards': '23297',
        'One Piece Collection Sets': '23304',
        'One Piece Demo Deck Cards': '23907',
        'One Piece Promotion Cards': '17675',
        'Paramount War Pre-Release Cards': '22934',
        'Pillars of Strength Pre-Release Cards': '23232',
        'Revision Pack Cards': '23890',
        'Super Pre-Release Starter Deck 1: Straw Hat Crew': '17659',
        'Super Pre-Release Starter Deck 2: Worst Generation': '17658',
        'Super Pre-Release Starter Deck 3: The Seven Warlords of the Sea': '17660',
        'Super Pre-Release Starter Deck 4: Animal Kingdom Pirates': '17661',
        'Royal Bloodlines': '23766'
    };

    //const handleSetClick = (setId) => {
    //    navigate('/collection', { 
    //        state: { 
    //            selectedGroupID: setId,
    //            initialOwnedOnly: true 
    //        } 
    //    });
    //};

    return (
        <div className="set-progress-container">
            {Object.entries(setNameToId)
                //.sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
                .map(([name, id]) => {
                    const progress = calculateSetProgress(id);
                    if (progress.total === 0) return null; // Skip sets with no cards
                    
                    return (
                        <div 
                            key={id} 
                            className="set-item"
                            onClick={() => {
                                navigate('/my-collection', { 
                                    state: { 
                                        selectedGroupID: id,
                                        initialOwnedOnly: true 
                                    } 
                                });
                            }}
                        >
                            <h3>{name}</h3>
                            <div className="progress-bar-container">
                                <div 
                                    className="progress-bar"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                            <div className="progress-text">
                                {progress.owned} / {progress.total} cards collected ({progress.percentage.toFixed(1)}%)
                            </div>
                        </div>
                    );
            })}
        </div>
    );
};

export default SetProgress;
