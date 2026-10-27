import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useStrings } from '@/i18n';
import { useAuth } from '@/lib/auth';

/// Everything behind the tabs requires a session. One guard on the group covers all of it.
/// Three destinations, each with an icon *and* a label: an icon alone is a guess.
export default function TabsLayout() {
  const { token } = useAuth();
  const s = useStrings();

  if (!token) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="discover"
        options={{
          title: s.tabs.discover,
          // Filled marks the active tab, outline the rest: one distinction, applied everywhere.
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} aria-hidden />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: s.tabs.chats,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={size} color={color} aria-hidden />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: s.tabs.me,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} aria-hidden />
          ),
        }}
      />
    </Tabs>
  );
}
