// src/components/Login.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const googleProvider = new GoogleAuthProvider();

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            console.log("Logged in with Google!");
        } catch (error) {
            setError("Failed to log in with Google");
            console.error("Google login error:", error);
        }
    };


    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in!");
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                setError("Incorrect password. Please try again.");
            } else if (error.code === 'auth/user-not-found') {
                setError("No account found with this email.");
            } else if (error.code === 'auth/invalid-email') {
                setError("The email address is not valid.");
            } else {
                setError("Failed to log in. Please check your credentials.");
            }
            console.error("Error logging in:", error);
        }
    };

    return (
        
        <div className='loginBody'>
            
            <div className='logoHolder'>
                <img src="/Logo-Horz.png" alt="Logo" className="menuLogo" />
            </div>
            <h2>Welcome Back!</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>
                <button type="submit" className="full-width">Login</button>
            </form>
            <div className="social-login">
                <p className="divider-text">Or, Login with</p>
                <button onClick={handleGoogleLogin} className="full-width">
                    Login with Google
                </button>
            </div>
        </div>
    );
};

export default Login;
