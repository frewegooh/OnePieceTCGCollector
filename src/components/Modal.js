import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={styles.overlay}>
            <div className="modal-content" style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" style={styles.closeButton} onClick={onClose}>
                    X
                </button>
                {children}
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflow: 'auto',
    },
    modal: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '80%',
        width: '425px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        position: 'absolute',
        top: '20px',
    },
    closeButton: {
        /* background: 'red',
        color: 'white',
        border: 'none',
        borderRadius: '4px', */
        padding: '5px 10px',
        cursor: 'pointer',
        position: 'absolute',
        top: '-10px',
        right: '0px',
        fontSize: '14px'
    },
};

export default Modal;
