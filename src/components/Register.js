// src/components/Register.js
import React, { useState } from 'react';
import { auth, firestore } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

const generateUsername = () => {
    const adjectives = ['Swift', 'Brave', 'Mighty', 'Noble', 'Royal', 'Wild', 'Bold', 'Epic'];
    const nouns = ['Pirate', 'Captain', 'Warrior', 'Hunter', 'Knight', 'Dragon', 'Phoenix', 'Tiger'];
    const number = Math.floor(Math.random() * 1000);
    
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${number}`;
};



const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const generateNewUsername = () => {
        setUsername(generateUsername());
    };

    const handleRegister = async () => {
        setError('');
        setSuccess('');
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!username.trim()) {
            setError("Username is required");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Create user document with chosen username
            await setDoc(doc(firestore, 'users', userCredential.user.uid), {
                displayName: username,
                email: email,
                cardQuantities: {},
                wishList: {}
            });
            
            setSuccess("Registration complete! You can now log in.");
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setUsername('');
        } catch (error) {
            if (error.code === 'auth/weak-password') {
                setError("Password is too weak. Please use a stronger password.");
            } else if (error.code === 'auth/email-already-in-use') {
                setError("This email is already in use. Please try a different email.");
            } else if (error.code === 'auth/invalid-email') {
                setError("The email address is not valid.");
            } else {
                setError("Failed to register. Please check your input and try again.");
            }
            console.error("Error registering:", error);
        }
    };

    return (
        <div className='loginBody'>
            <h2>Register</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <div className="form-group">
                <label>Username</label>
                <div className="username-input-group">
                    <input
                        type="text"
                        placeholder="Choose a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button 
                        type="button" 
                        onClick={generateNewUsername}
                        className="generate-username-btn"
                    >
                        Generate Random
                    </button>
                </div>
            </div>
            <div className="form-group">
                <label>Email</label>
                <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Password</label>
                <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Confirm Password</label>
                <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
            <button onClick={handleRegister}>Register</button>

            <div className='registerLogin'>
                <p>Already have an account? <Link to="/login">Login here</Link></p>
            </div>
        </div>
    );
};

export default Register;