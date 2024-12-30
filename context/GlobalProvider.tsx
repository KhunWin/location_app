import { getCurrentUser } from "@/lib/appwrite";
import React, { createContext, useContext, useState, useEffect } from "react";
// import { getCurrentUser } from "../lib/appwrite";

// Define the interface for your context value
interface GlobalContextType {
    isLoggedIn: boolean;
    setIsLoggedIn: (value: boolean) => void;
    user: any; // Replace 'any' with your user type if available
    setUser: (user: any) => void; // Replace 'any' with your user type
    isLoading: boolean;
}

// Create default context value
const defaultContextValue: GlobalContextType = {
    isLoggedIn: false,
    setIsLoggedIn: () => {},
    user: null,
    setUser: () => {},
    isLoading: true
};


// const GlobalContext = createContext();
const GlobalContext = createContext<GlobalContextType>(defaultContextValue);

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getCurrentUser()
        .then((res) => {
            if (res) {
                setIsLoggedIn(true);
                setUser(res);
            } else {
                setIsLoggedIn(false);
                setUser(null)
            }
        })
        .catch((error) => {
            console.log(error);
        })
        .finally(() => {
            setIsLoading(false);
        })

    }, []);

    return (
        <GlobalContext.Provider 
        value={{
            isLoggedIn,
            setIsLoggedIn,
            user,
            setUser,
            isLoading

        }}
        >
            {children}
        </GlobalContext.Provider>
    )
}

export default GlobalProvider;