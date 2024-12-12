// src/components/Login.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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
        <div>
            <h2>Login</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;
