// src/components/Register.js
import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async () => {
        setError('');
        
        // Check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log("User registered!");
        } catch (error) {
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
            <div className='logoHolder'>
                <img src="/Logo-Horz.png" alt="Logo" className="menuLogo" />
            </div>

            <h2>Register</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
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
        </div>
    );
};
export default Register;
