import React, { createContext, useState, useContext } from 'react';

export const MenuUpdateContext = createContext(null);

export const MenuUpdateProvider = ({ children }) => {
    const [menuUpdateTrigger, setMenuUpdateTrigger] = useState(0);

    const triggerMenuUpdate = () => {
        setMenuUpdateTrigger(prev => prev + 1);
        console.log('MenuUpdateContext: Triggered menu update');
    };

    return (
        <MenuUpdateContext.Provider value={{ menuUpdateTrigger, triggerMenuUpdate }}>
            {children}
        </MenuUpdateContext.Provider>
    );
};

export const useMenuUpdate = () => {
    const context = useContext(MenuUpdateContext);
    if (!context) {
        throw new Error('useMenuUpdate must be used within a MenuUpdateProvider');
    }
    return context;
};