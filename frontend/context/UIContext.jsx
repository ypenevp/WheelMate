import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
    const [modal, setModal] = useState(null); 

    const openLogin  = () => setModal('login');
    const openSignup = () => setModal('signup');
    const closeModal = () => setModal(null);

    return (
        <UIContext.Provider value={{ modal, openLogin, openSignup, closeModal }}>
            {children}
        </UIContext.Provider>
    );
}

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within UIProvider');
    return context;
};