import { useState } from 'react';
import { Text, View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function AddPatientScreen() {
  const [name, setName] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async () =>
      fetch(`${API}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      router.back();
    },
  });

  return (
    <View style={styles.container} testID="add-patient-screen">
      <Text style={styles.title}>Add patient</Text>
      <TextInput
        testID="patient-name-input"
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Patient name"
        autoFocus
      />
      <Pressable
        testID="patient-save-button"
        style={styles.saveButton}
        onPress={() => { if (name.trim()) save.mutate(); }}
      >
        <Text style={styles.saveLabel}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  saveButton: { padding: 14, borderRadius: 8, backgroundColor: '#222', alignItems: 'center' },
  saveLabel: { color: '#fff' },
});
