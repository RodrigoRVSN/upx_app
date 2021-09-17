import React, {
  useState,
  createContext,
  useEffect,
  useRef,
  ReactNode,
  SetStateAction,
  Dispatch,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as GoogleAuthentication from 'expo-google-app-auth';
import firebase from 'firebase';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { database } from '../config/firebase';
import { config } from '../config/google';
import { registerForPushNotificationsAsync } from '../service/registerForPushNotificationsAsync';
import { RouteProp } from '@react-navigation/core';
import { StackNavigationProp } from '@react-navigation/stack';

interface ProfileScreenRouteProp {
  navigation: any;
}

export type User = {
  email: string;
  accessToken?: string;
  photoUrl?: string;
};

type AuthContextData = {
  userApp: User;
  setUserApp: Dispatch<SetStateAction<User>>;
  handleSignOut: () => void;
  handleGoogleSignIn: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  expoToken: String;
  setExpoToken: Dispatch<SetStateAction<String>>;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

function AuthProvider({ children }: AuthProviderProps) {
  const [userApp, setUserApp] = useState<User>({} as User);

  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [expoToken, setExpoToken] = useState<String>('' as String);

  /* Carrega informações do usuário salvas */
  async function loadUserStorageData() {
    const storage = await AsyncStorage.getItem('@app:user');
    if (storage) {
      const userLogged = JSON.parse(storage);
      setUserApp(userLogged);
    }
  }

  /* Chama a função de carregar as informações */
  useEffect(() => {
    loadUserStorageData();
  }, []);

  /* Notificações */
  const [notification, setNotification] = useState({});
  const notificationListener = useRef({} as any);
  const responseListener = useRef({} as any);

  /* Gera o token */
  useEffect(() => {
    if (userApp) {
      registerForPushNotificationsAsync(userApp).then(token =>
        setExpoToken(token as string),
      );
      notificationListener.current =
        Notifications.addNotificationReceivedListener(notif => {
          setNotification(notif);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(response => {
          console.log(response);
        });
    }
    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current!,
      );
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, [userApp]);

  /* Sair da conta */
  async function handleSignOut() {
    setLoading(true);
    const { accessToken } = userApp;

    if (accessToken) {
      await GoogleAuthentication.logOutAsync({ accessToken, ...config })
        .then(async () => {
          setUserApp({} as User);
          await AsyncStorage.removeItem('@app:user');
        })
        .catch(error =>
          console.log(`Falha ao sair da conta do google: ${error}`),
        )
        .finally(() => {
          setLoading(false);
        });
    }

    firebase
      .auth()
      .signOut()
      .then(async () => {
        setUserApp({} as User);
        await AsyncStorage.removeItem('@app:user');
      })
      .catch(error =>
        console.log(`Falha ao sair da conta do firebase: ${error}`),
      )
      .finally(() => {
        setLoading(false);
      });

    await database.collection('usersToken').doc(`${userApp.email}`).delete();
  }

  /* Logar com o google */
  const handleGoogleSignIn = () => {
    setLoading(true);
    GoogleAuthentication.logInAsync(config)
      .then(async logInResult => {
        if (logInResult.type === 'success') {
          const { idToken, accessToken, user } = logInResult;
          const credential = firebase.auth.GoogleAuthProvider.credential(
            idToken,
            accessToken,
          );
          await AsyncStorage.setItem('@app:user', JSON.stringify(user));
          setUserApp(user as User);
          if (userApp.email && expoToken) {
            await database
              .collection('usersToken')
              .doc(`${userApp.email}`)
              .set({
                email: userApp.email,
                expoToken,
              });
          }

          firebase.auth().signInWithCredential(credential);
          navigation.navigate('Home');
        }
      })
      .catch(error => {
        console.log(`Falha ao realizar login! ${error}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  return (
    <AuthContext.Provider
      value={{
        userApp,
        setUserApp,
        handleSignOut,
        handleGoogleSignIn,
        loading,
        setLoading,
        expoToken,
        setExpoToken,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider };