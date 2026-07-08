import { Text, View, StyleSheet } from 'react-native';

// Screen roots always carry a `<screen>-screen` testID (see conventions.md) so E2E flows
// can assert arrival.
export default function HomeScreen() {
  return (
    <View style={styles.container} testID="home-screen">
      <Text testID="home-title">{'{{PROJECT_NAME}}'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
