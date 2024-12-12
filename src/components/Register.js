// src/components/Register.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async () => {
        setError(''); // Clear previous error
        try {
            // Use createUserWithEmailAndPassword with auth as the first argument
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("User registered!");
        } catch (error) {
            // Display descriptive error messages based on Firebase error codes
            if (error.code === 'auth/weak-password') {
                setError("Password is too weak. Please use a stronger password.");
            } else if (error.code === 'auth/email-already-in-use') {
                setError("This email is already in use. Please try a different email.");
            } else if (error.code === 'auth/invalid-email') {
                setError("The email address is not valid.");
            } else {
                setError("Failed to register. Please check your input.");
            }
            console.error("Error registering:", error);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleRegister}>Register</button>
        </div>
    );
};

export default Register;
