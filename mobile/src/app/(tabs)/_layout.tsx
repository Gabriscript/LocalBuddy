import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useRequestCount } from '@/api/hooks';
import { TabBar } from '@/components/TabBar';
import { useStrings } from '@/i18n';
import { useAuth } from '@/lib/auth';

/// Everything behind the tabs requires a session. One guard on the group covers all of it.
/// Three destinations, each with an icon *and* a label: an icon alone is a guess.
export default function TabsLayout() {
  const { token } = useAuth();
  const s = useStrings();
  const requests = useRequestCount(!!token).data ?? 0;

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
          // Waiting requests live on the Chats tab. The badge is drawn only; the label says it.
          tabBarBadge: requests ? (requests > 9 ? '9+' : requests) : undefined,
          tabBarAccessibilityLabel: requests ? `${s.tabs.chats}, ${s.requests.count(requests)}` : undefined,
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
