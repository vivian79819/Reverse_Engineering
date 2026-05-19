import { StyleSheet, Text, View } from 'react-native';

type Props = {
  reason?: 'frida' | 'root' | 'generic';
};

const MESSAGES: Record<NonNullable<Props['reason']>, { title: string; body: string }> = {
  frida: {
    title: 'Security check failed',
    body:
      'Dynamic analysis tooling (such as Frida) was detected. Close those tools and restart the app.',
  },
  root: {
    title: 'Security check failed',
    body: 'This app cannot run on a rooted or compromised device.',
  },
  generic: {
    title: 'Security check failed',
    body: 'This environment is not allowed to run the app.',
  },
};

export function SecurityBlockedScreen({ reason = 'frida' }: Props) {
  const copy = MESSAGES[reason];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    color: '#a0a0a0',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
