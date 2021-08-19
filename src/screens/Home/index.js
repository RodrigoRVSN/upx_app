import React, { useEffect } from 'react';
import { BackHandler, Button, TouchableOpacity } from 'react-native';
import { HomeContainer, Title, ToSignOut } from './styles';
import { useAuth } from '../../hooks/useAuth';
import Background from '../../components/Background';
import BackAction from '../../components/BackAction';
import { Header } from '../../components/Header';
// import { Chart } from '../../components/Chart';
import { schedulePushNotification } from '../../service/schedulePushNotification';
import { sendPushNotification } from '../../service/sendPushNotifaction';

export default function Home() {
  const {
    userApp, handleSignOut, expoToken,
  } = useAuth();
  const { backAction } = BackAction();

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => BackHandler.removeEventListener('hardwareBackPress', backAction);
  }, []);

  return (
    <Background>
      <Header title="Início" />
      <HomeContainer>
        <Title>{userApp?.email}</Title>
        <Button
          title="Press to schedule a notification"
          onPress={async () => {
            await schedulePushNotification();
          }}
        />
        <Button
          title="Press to schedule a notification"
          onPress={async () => {
            await sendPushNotification(expoToken);
          }}
        />

        <TouchableOpacity onPress={() => handleSignOut()}>
          <ToSignOut>Sair :D.</ToSignOut>
        </TouchableOpacity>

      </HomeContainer>
    </Background>
  );
}