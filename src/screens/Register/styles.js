import styled from 'styled-components/native';
import { StyleSheet } from 'react-native';

export const HomeContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const Title = styled.Text`
  text-align: center;
  font-size: 16px;
  color: ${(props) => props.theme.colors.white};
  margin-bottom: 60px;
`;

export const ToLogin = styled.Text`
  color: ${(props) => props.theme.colors.white};
  margin-top: 15px;
`;

export const styles = StyleSheet.create({
  container: { flex: 1 },
});
