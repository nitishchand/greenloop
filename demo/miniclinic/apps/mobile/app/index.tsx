import { Text, View, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

type Patient = { id: number; name: string };

export default function PatientListScreen() {
  const router = useRouter();
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => (await fetch(`${API}/patients`)).json(),
  });

  return (
    <View style={styles.container} testID="patient-list-screen">
      <Text style={styles.title}>Today's patients</Text>
      {patients.length === 0 ? (
        <Text testID="patient-empty">No patients checked in yet.</Text>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <Text testID={`patient-row-${item.id}`} style={styles.row}>{item.name}</Text>
          )}
        />
      )}
      <Pressable
        testID="patient-add-button"
        style={styles.addButton}
        onPress={() => router.push('/add')}
      >
        <Text style={styles.addLabel}>Add patient</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  row: { paddingVertical: 8, fontSize: 16 },
  addButton: { padding: 14, borderRadius: 8, backgroundColor: '#222', alignItems: 'center' },
  addLabel: { color: '#fff' },
});
