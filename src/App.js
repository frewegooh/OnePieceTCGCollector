import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth,firestore } from './firebase';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';
import API_URL from './config';
import { useAuth } from './contexts/AuthContext';
import { getImageUrl } from './config';
import LoadingSpinner from './components/LoadingSpinner';
import Footer from './components/Footer';
import CardDetailPage from './components/CardDetailPage';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import ReactGA from 'react-ga4';
import ScrollToTop from './components/ScrollToTop';
const WantedCards = lazy(() => import('./components/WantedCards'));
const TradingHub = lazy(() => import('./components/TradingHub'));
const TradeManagement = lazy(() => import('./components/TradeManagement'));
const PublicWishlist = lazy(() => import('./components/PublicWishlist'));
const TradeNotifications = lazy(() => import('./components/TradeNotifications'));
const PublicCollection = lazy(() => import('./components/PublicCollection'));

const App = () => {
    const { currentUser } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const ADMIN_USER_ID = 'uuBS4Z3PcHNLZyzNKfWLw2Oyrg52';
    const Home = lazy(() => import('./components/Home'));
    const DeckBuilder = lazy(() => import('./components/DeckBuilder'));
    const DeckLibrary = lazy(() => import('./components/DeckLibrary'));
    const DeckView = lazy(() => import('./components/DeckView'));
    const DeckEditor = lazy(() => import('./components/DeckEditor'));
    const MyCollection = lazy(() => import('./components/MyCollection'));
    const [cards, setCards] = useState([]);
    const [user, setUser] = useState(null);
    const [showOwnedOnly, setShowOwnedOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const SetProgress = lazy(() => import('./components/SetProgress'));
    const TermsOfService = lazy(() => import('./components/TermsOfService'));
    const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
    const [userQuantities, setUserQuantities] = useState({});
    const [userWishList, setUserWishList] = useState({});

    useEffect(() => {
        ReactGA.initialize('G-HHW1SFVVBB');
    }, []);

    const trackTCGPlayerClick = (cardName) => {
        ReactGA.event({
            category: 'Outbound Link',
            action: 'Click TCGPlayer Link',
            label: cardName
        });
    };

    // Generate Username
    const generateUsername = () => {
        const adjectives = ['Swift', 'Brave', 'Mighty', 'Noble', 'Royal', 'Wild', 'Bold', 'Epic'];
        const nouns = ['Pirate', 'Captain', 'Warrior', 'Hunter', 'Knight', 'Dragon', 'Phoenix', 'Tiger'];
        const number = Math.floor(Math.random() * 1000);
        
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${number}`;
    };
    
    // Asign Usernames
    const handleAssignUsernames = async () => {
        const usersRef = collection(firestore, 'users');
        const snapshot = await getDocs(usersRef);
        let updatedCount = 0;
        
        for (const userDoc of snapshot.docs) {
            if (!userDoc.data().displayName) {
                const username = generateUsername();
                await setDoc(doc(firestore, 'users', userDoc.id), {
                    ...userDoc.data(),
                    displayName: username
                }, { merge: true });
                updatedCount++;
            }
        }
        
        alert(`Updated ${updatedCount} users with new usernames`);
    };

    useEffect(() => {
        const fetchUserQuantities = async () => {
            if (currentUser) {
                const docRef = doc(firestore, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserQuantities(docSnap.data().cardQuantities || {});
                }
            }
        };
        fetchUserQuantities();
    }, [currentUser]);


     // Add the cards loading effect
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/cards`);
                const allCards = await response.json();
                setCards(allCards);
            } catch (error) {
                console.error('Error fetching cards:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                const docRef = doc(firestore, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserQuantities(docSnap.data().cardQuantities || {});
                    setUserWishList(docSnap.data().wishList || {});  // Add this line
                }
            }
        };
        fetchUserData();
    }, [currentUser]);

    // Add user auth effect
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return unsubscribe;
    }, []);

    const handleDownloadImages = async () => {
        try {
            const response = await fetch(`${API_URL}/api/download-all-images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (response.ok) {
                alert(`Download complete!\nNew downloads: ${result.successful}\nSkipped existing: ${result.skipped}\nTotal processed: ${result.total}`);
            } else {
                alert(`Download status:\n${result.error}\n${result.details || ''}`);
            }
        } catch (error) {
            alert('Network connection error - check console for details');
        }
    };


    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/cards`);
            const allCards = await response.json();
            setCards(allCards);
        } catch (error) {
            console.error('Error fetching cards:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Update the useEffect to use the extracted function
    useEffect(() => {
        fetchData();
    }, []);

    // Add this function alongside handleDownloadImages
    const handleCheckNewCards = async () => {
        try {
            const response = await fetch(`${API_URL}/api/check-new-cards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            const result = await response.json();
            
            if (result.success) {
                const updateMessage = result.updates.length > 0 
                    ? `Updates found:\n${result.updates.map(u => `${u.filename}: ${u.newEntries} new cards`).join('\n')}`
                    : 'No new cards found';
                alert(updateMessage);
                
                // Force refresh of card data
                fetchData();
            } else {
                alert('Check failed: ' + result.error);
            }
        } catch (error) {
            alert('Network connection error - check console for details');
        }
    };
    // Update Owned Card Quantity
    const updateQuantity = async (cardId, newQuantity) => {
        console.log('=== Update Quantity Operation Start ===');
        console.log('Input:', { cardId, newQuantity });
        console.log('Current States:', {
            userQuantities,
            userWishList,
            currentUser: currentUser?.uid
        });
    
        if (!currentUser) return;
        const docRef = doc(firestore, 'users', currentUser.uid);
        
        try {
            // Get current Firebase data
            const docSnap = await getDoc(docRef);
            const currentData = docSnap.exists() ? docSnap.data() : {};
            console.log('Current Firebase Data:', currentData);
    
            // Create new quantities object
            const updatedQuantities = { ...currentData.cardQuantities };
            if (newQuantity > 0) {
                updatedQuantities[cardId] = newQuantity;
            } else {
                delete updatedQuantities[cardId];
            }
    
            // Prepare update with preserved wishList
            const dataToUpdate = {
                wishList: currentData.wishList || {},
                cardQuantities: updatedQuantities
            };
            
            console.log('Data to Write:', dataToUpdate);
            await setDoc(docRef, dataToUpdate);
            
            // Update local state
            setUserQuantities(updatedQuantities);
            
            // Verify final state
            const verifySnap = await getDoc(docRef);
            console.log('=== Final Firebase State ===');
            console.log(verifySnap.data());
            
        } catch (error) {
            console.error('Firebase error:', error);
        }
    };
    
    const updateWishList = async (cardId, newQuantity) => {
        //console.log('updateWishList starting:', { cardId, newQuantity, userQuantities });
        if (!currentUser) return;
    
        const docRef = doc(firestore, 'users', currentUser.uid);
        const updatedWishList = { ...userWishList };
        
        if (newQuantity > 0) {
            updatedWishList[cardId] = newQuantity;
        } else {
            delete updatedWishList[cardId];
        }
    
        setUserWishList(updatedWishList);
        
        try {
            const dataToUpdate = {
                cardQuantities: userQuantities,
                wishList: updatedWishList
            };
            //console.log('Sending to Firebase:', dataToUpdate);
            
            await setDoc(docRef, dataToUpdate, { merge: true });
            //console.log('Firebase update complete');
        } catch (error) {
            //console.error('Firebase update error:', error);
            setUserWishList(prevWishList => ({ ...prevWishList }));
        }
    };

    return (
        <Router>
            <ScrollToTop />
                <div className="App">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                            <div className='bodyContentHolder'>
                                <div className="navHolder">
                                    <header>
                                        <Link className='menuLogo' to="/" onClick={() => {
                                            if (window.location.pathname === '/') window.location.reload();
                                        }}>
                                            <img src="/Logo-Horz.webp" alt="Logo" className="menuLogo" />
                                        </Link>
                                        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                        <nav className={isMenuOpen ? 'nav-active' : ''}>
                                            
                                            <div className="dropdown">
                                                <span className='dropDownTitle'>Cards <i className="fa-solid fa-angle-down"></i></span>
                                                <div className="dropdown-content">
                                                    <Link to="/my-collection" onClick={() => setIsMenuOpen(false)}>My Collection</Link>
                                                    <Link to="/sets" onClick={() => setIsMenuOpen(false)}>Set Progress</Link>
                                                    <Link to="/wanted-cards" onClick={() => setIsMenuOpen(false)}>Wanted Cards</Link>
                                                </div>
                                            </div>

                                            <div className="dropdown">
                                                <span className='dropDownTitle'>Decks <i className="fa-solid fa-angle-down"></i></span>
                                                <div className="dropdown-content">
                                                    <Link to="/deck-builder" onClick={() => setIsMenuOpen(false)}>Deck Builder</Link>
                                                    <Link to="/my-decks" onClick={() => setIsMenuOpen(false)}>My Decks</Link>                                                    
                                                </div>
                                            </div>

                                            <div className="dropdown">
                                                <span className='dropDownTitle'>Trading <i className="fa-solid fa-angle-down"></i></span>
                                                <div className="dropdown-content">
                                                    <Link to="/trading" onClick={() => setIsMenuOpen(false)}>Trading Hub</Link>
                                                    <Link to="/trades" onClick={() => setIsMenuOpen(false)}>My Trades</Link>
                                                </div>
                                            </div>
                                            <TradeNotifications />
                                            {currentUser ? (
                                                <Link 
                                                    className="logoutButton" 
                                                    onClick={() => {
                                                        auth.signOut();
                                                        setIsMenuOpen(false);
                                                        window.location.reload();
                                                    }}
                                                >
                                                    Log Out
                                                </Link>
                                            ) : (
                                                <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                                            )}
                                            {currentUser && currentUser.uid === ADMIN_USER_ID && (
                                                <div className="dropdown">
                                                    <span className='dropDownTitle'>Admin</span>
                                                    <div className="dropdown-content">
                                                        
                                                            <>
                                                            <button onClick={handleDownloadImages} style={{ marginTop: '20px' }}>
                                                                Download Images
                                                            </button>
                                                            <button onClick={handleCheckNewCards} style={{ marginTop: '20px' }}>
                                                                Check New Cards
                                                            </button>
                                                            <button onClick={handleAssignUsernames} style={{ marginTop: '20px' }}>
                                                                Assign Missing Usernames
                                                            </button>
                                                            </>
                                                        
                                                    </div>
                                                </div>
                                            )}
                                        </nav>
                                    </header>
                                </div>
                                <section className="secBody">
                                    {isLoading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <Routes>
                                            <Route path="/" element={<Home getImageUrl={getImageUrl} />} />
                                            <Route path="/my-collection" element={
                                                <MyCollection 
                                                    getImageUrl={getImageUrl} 
                                                    userQuantities={userQuantities} 
                                                    updateQuantity={updateQuantity}
                                                    updateWishList={updateWishList}  
                                                    userWishList={userWishList}      
                                                    setUserWishList={setUserWishList}
                                                    trackTCGPlayerClick={trackTCGPlayerClick}
                                                />
                                            } />
                                            <Route path="/sets" element={<SetProgress cards={cards} user={currentUser} />} />
                                            <Route path="/collection" element={<MyCollection getImageUrl={getImageUrl} />} />
                                            <Route path="/deck-builder" element={
                                                cards.length > 0 ? (
                                                    <DeckBuilder 
                                                        cards={cards} 
                                                        user={user}
                                                        showOwnedOnly={showOwnedOnly}
                                                        userQuantities={userQuantities}
                                                        onOwnedOnlyChange={() => setShowOwnedOnly(!showOwnedOnly)}
                                                        getImageUrl={getImageUrl}
                                                        trackTCGPlayerClick={trackTCGPlayerClick}
                                                    />
                                                ) : (
                                                    <div>Loading...</div>
                                                )
                                            } />
                                                <Route path="/my-decks" element={<DeckLibrary user={currentUser} getImageUrl={getImageUrl} />} />
                                                <Route path="/deck/:deckId" element={
                                                    <DeckView 
                                                        getImageUrl={getImageUrl}
                                                        userQuantities={userQuantities}
                                                        updateWishList={updateWishList}
                                                    />
                                                } />
                                                <Route path="/deck/edit/:deckId" element={
                                                    cards.length > 0 ? (
                                                        <DeckEditor 
                                                            cards={cards} 
                                                            user={currentUser}
                                                            getImageUrl={getImageUrl}
                                                            trackTCGPlayerClick={trackTCGPlayerClick}
                                                        />
                                                    ) : (
                                                        <div>Loading...</div>
                                                    )
                                                } />
                                                <Route path="/trading" element={<TradingHub getImageUrl={getImageUrl} />} />
                                                <Route path="/trades" element={
                                                    <TradeManagement 
                                                        getImageUrl={getImageUrl}
                                                    />
                                                } />
                                                <Route 
                                                    path="/users/:userId/collection" 
                                                    element={<PublicCollection getImageUrl={getImageUrl} />} 
                                                />
                                                <Route 
                                                    path="/users/:userId/wishlist" 
                                                    element={<PublicWishlist getImageUrl={getImageUrl} />} 
                                                />
                                                <Route path="/login" element={<Login />} />
                                                <Route path="/register" element={<Register />} />
                                                <Route path="/terms" element={<TermsOfService />} />
                                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                                <Route path="/card/:cardId" element={
                                                    <CardDetailPage 
                                                        getImageUrl={getImageUrl}
                                                        trackTCGPlayerClick={trackTCGPlayerClick}
                                                        updateWishList={updateWishList}
                                                        userWishList={userWishList}
                                                    />
                                                }/>
                                                <Route 
                                                    path="/wanted-cards" 
                                                    element={
                                                        <WantedCards
                                                            getImageUrl={getImageUrl}
                                                            trackTCGPlayerClick={trackTCGPlayerClick}
                                                            updateWishList={updateWishList}
                                                            userWishList={userWishList}
                                                        />
                                                    }
                                                />
                                            </Routes>
                                        </Suspense>
                                    )}
                                </section>
                            </div>
                    )}
                    <Footer />
                </div>
        </Router>
    );
};

export default App;
