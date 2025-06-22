import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  getFirestore,
  doc,
  onSnapshot,
} from "@react-native-firebase/firestore";

interface FirestoreUserData {
  createdAt?: string;
  currentRoomId?: string;
  email?: string;
  name?: string;
  profilePic: string;
  totalTime?: number;
  uid: string;
  username: string;
  lastActive: string;
}

interface UserContextType {
  user: FirebaseAuthTypes.User | null;
  setUser: React.Dispatch<React.SetStateAction<FirebaseAuthTypes.User | null>>;
  initializing: boolean;
  firestoreUser: FirestoreUserData | null;
  setFirestoreUser: React.Dispatch<React.SetStateAction<FirestoreUserData | null>>;
}
const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUserData | null>(null);
  const db = getFirestore();

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined;
    const unsubscribe = auth().onAuthStateChanged((currentUser) => {
      console.log("Auth state changed: ", currentUser);
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        unsubscribeUserDoc = onSnapshot(userRef, (userDoc) => {
          const data = userDoc.data();
          if (data) {
            setFirestoreUser({
              createdAt: data.createdAt ?? "",
              currentRoomId: data.currentRoomId ?? "",
              email: data.email ?? currentUser.email ?? "",
              name: data.name ?? currentUser.displayName ?? "",
              profilePic: data.profilePic ?? "",
              totalTime: data.totalTime ?? 0,
              uid: data.uid ?? currentUser.uid,
              username: data.username ?? "",
              lastActive: data.lastActive?.toMillis?.() ?? "",
            });
            console.log(`updated firestore user: ${firestoreUser}`);
          }
        });
      } else {
        setFirestoreUser(null);
      }

      if (initializing) setInitializing(false);
    });

    return () => {
      unsubscribe();
      unsubscribeUserDoc?.();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ user, setUser, initializing, firestoreUser, setFirestoreUser }}
    >
      {children}
    </UserContext.Provider>
  );
};
