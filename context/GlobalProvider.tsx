// import { getCurrentUser } from "@/lib/appwrite";
// import React, { createContext, useContext, useState, useEffect } from "react";
// // import { getCurrentUser } from "../lib/appwrite";
// import { NotificationProvider } from './NotificationContext';

// // Define the interface for your context value
// interface GlobalContextType {
//     isLoggedIn: boolean;
//     setIsLoggedIn: (value: boolean) => void;
//     user: any; // Replace 'any' with your user type if available
//     setUser: (user: any) => void; // Replace 'any' with your user type
//     isLoading: boolean;
// }

// // Create default context value
// const defaultContextValue: GlobalContextType = {
//     isLoggedIn: false,
//     setIsLoggedIn: () => {},
//     user: null,
//     setUser: () => {},
//     isLoading: true
// };


// // const GlobalContext = createContext();
// const GlobalContext = createContext<GlobalContextType>(defaultContextValue);

// export const useGlobalContext = () => useContext(GlobalContext);

// const GlobalProvider = ({ children }) => {
//     const [isLoggedIn, setIsLoggedIn] = useState(false);
//     const [user, setUser] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         getCurrentUser()
//         .then((res) => {
//             if (res) {
//                 setIsLoggedIn(true);
//                 setUser(res);
//             } else {
//                 setIsLoggedIn(false);
//                 setUser(null)
//             }
//         })
//         .catch((error) => {
//             console.log(error);
//         })
//         .finally(() => {
//             setIsLoading(false);
//         })

//     }, []);

//     // return (
//     //     <GlobalContext.Provider 
//     //     value={{
//     //         isLoggedIn,
//     //         setIsLoggedIn,
//     //         user,
//     //         setUser,
//     //         isLoading

//     //     }}
//     //     >
//     //         {children}
//     //     </GlobalContext.Provider>
//     // )

//     return (
//         <NotificationProvider>
//             <GlobalContext.Provider 
//                 value={{
//                     isLoggedIn,
//                     setIsLoggedIn,
//                     user,
//                     setUser,
//                     isLoading
//                 }}
//             >
//                 {children}
//             </GlobalContext.Provider>
//         </NotificationProvider>
//     )
// }

// export default GlobalProvider;


import { getCurrentUser } from "@/lib/appwrite";
import React, { createContext, useContext, useState, useEffect } from "react";
import { NotificationProvider } from './NotificationContext';
import { databases, appwriteConfig } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';

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

const GlobalContext = createContext<GlobalContextType>(defaultContextValue);

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userNotifications, setUserNotifications] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = await getCurrentUser();
                
                if (currentUser) {
                    setIsLoggedIn(true);
                    setUser(currentUser);
                    
                    // Fetch user-specific notifications if needed
                    // This is where you would load notifications from your database
                    // based on the user's role (student or teacher)
                    
                    // Example: If you want to fetch notifications for this specific user
                    // const userNotifications = await databases.listDocuments(
                    //     appwriteConfig.databaseId,
                    //     'notifications', // You would need to create this collection
                    //     [Query.equal('recipientId', currentUser.$id)]
                    // );
                    // setUserNotifications(userNotifications.documents);
                } else {
                    setIsLoggedIn(false);
                    setUser(null);
                }
            } catch (error) {
                console.log("Error fetching user data:", error);
                setIsLoggedIn(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return (
        <NotificationProvider>
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
        </NotificationProvider>
    );
};

export default GlobalProvider;