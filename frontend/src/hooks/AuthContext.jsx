import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Fetch additional user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    };

    const register = async (email, password, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update display name
        await updateProfile(firebaseUser, { displayName: name });

        // Create user document in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), {
            uid: firebaseUser.uid,
            name: name,
            email: email,
            createdAt: serverTimestamp()
        });

        // Fetch the user data we just created
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
            setUserData(userDoc.data());
        }

        return firebaseUser;
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserData(null);
    };

    const getToken = async () => {
        if (user) {
            return await user.getIdToken();
        }
        return null;
    };

    const value = {
        user,
        userData,
        loading,
        login,
        register,
        logout,
        getToken
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
