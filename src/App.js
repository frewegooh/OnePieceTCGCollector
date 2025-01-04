import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { auth } from './firebase';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';
import API_URL from './config';
import { useAuth } from './contexts/AuthContext';
import { getImageUrl } from './config';
import LoadingSpinner from './components/LoadingSpinner';
import Footer from './components/Footer';
import CardDetailPage from './components/CardDetailPage';

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

    return (
        <Router>
            <div className="App">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                        <div className='bodyContentHolder'>
                            <div className="navHolder">
                                <header>
                                    <Link to="/" onClick={() => {
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
                                        <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
                                        <div className="dropdown">
                                            <span className='dropDownTitle'>Card Collection <i class="fa-solid fa-angle-down"></i></span>
                                            <div className="dropdown-content">
                                                <Link to="/my-collection" onClick={() => setIsMenuOpen(false)}>My Collection</Link>
                                                <Link to="/sets" onClick={() => setIsMenuOpen(false)}>Set Progress</Link>
                                            </div>
                                        </div>

                                        <div className="dropdown">
                                        <span className='dropDownTitle'>Decks <i className="fa-solid fa-angle-down"></i></span>
                                            <div className="dropdown-content">
                                                <Link to="/my-decks" onClick={() => setIsMenuOpen(false)}>My Decks</Link>
                                                <Link to="/deck-builder" onClick={() => setIsMenuOpen(false)}>Deck Builder</Link>
                                            </div>
                                        </div>
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
                                            <button onClick={handleDownloadImages} style={{ marginTop: '20px' }}>
                                                Download Images
                                            </button>
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
                                        <Route path="/my-collection" element={<MyCollection getImageUrl={getImageUrl} />} />
                                        <Route path="/sets" element={<SetProgress cards={cards} user={currentUser} />} />
                                        <Route path="/collection" element={<MyCollection getImageUrl={getImageUrl} />} />
                                        <Route path="/deck-builder" element={
                                            cards.length > 0 ? (
                                                <DeckBuilder 
                                                    cards={cards} 
                                                    user={user}
                                                    showOwnedOnly={showOwnedOnly}
                                                    onOwnedOnlyChange={() => setShowOwnedOnly(!showOwnedOnly)}
                                                    getImageUrl={getImageUrl}
                                                />
                                            ) : (
                                                <div>Loading...</div>
                                            )
                                        } />
                                            <Route path="/my-decks" element={<DeckLibrary user={currentUser} getImageUrl={getImageUrl} />} />
                                            <Route path="/deck/:deckId" element={<DeckView getImageUrl={getImageUrl} />} />
                                            <Route path="/deck/edit/:deckId" element={
                                                cards.length > 0 ? (
                                                    <DeckEditor 
                                                        cards={cards} 
                                                        user={currentUser}
                                                        getImageUrl={getImageUrl}
                                                    />
                                                ) : (
                                                    <div>Loading...</div>
                                                )
                                            } />
                                            <Route path="/login" element={<Login />} />
                                            <Route path="/register" element={<Register />} />
                                            <Route path="/terms" element={<TermsOfService />} />
                                            <Route path="/privacy" element={<PrivacyPolicy />} />
                                            <Route path="/card/:cardId" element={<CardDetailPage getImageUrl={getImageUrl} />} />
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
