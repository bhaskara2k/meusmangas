import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import * as firestoreService from '../services/firestoreService';

export interface UserData {
  username: string;
  themeColor: string;
  photoURL: string;
}

interface UserContextType {
  session: User | null;
  user: User | null;
  userData: UserData | null;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserData>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const data = await firestoreService.getUserData(currentUser.uid);
        if (data) {
          setUserData(data as UserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserData>) => {
    if (!user) return;
    await firestoreService.updateUserData(user.uid, data);
    setUserData(prev => prev ? { ...prev, ...data } : (data as UserData));
  };

  const value = {
    session: user,
    user,
    userData,
    logout,
    updateProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};