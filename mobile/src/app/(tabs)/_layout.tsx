import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useConversations, useRequestCount } from '@/api/hooks';
import { TabBar } from '@/components/TabBar';
import { useStrings } from '@/i18n';
import { useAuth } from '@/lib/auth';

/// Everything behind the tabs requires a session. One guard on the group covers all of it.
/// Three destinations, each with an icon *and* a label: an icon alone is a guess.
export default function TabsLayout() {
  const { token } = useAuth();
  const s = useStrings();
  const requests = useRequestCount(!!token).data ?? 0;
  // shortcut: sums the inbox pages loaded so far (the first 20 chats), a count endpoint when inboxes outgrow one page
  const unread = useConversations(!!token).items.reduce((sum, chat) => sum + Number(chat.unreadCount ?? 0), 0);
  const waiting = requests + unread;

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
          // Waiting requests and unread messages live on the Chats tab. The badge is drawn only;
          // the label says what it counts.
          tabBarBadge: waiting ? (waiting > 9 ? '9+' : waiting) : undefined,
          tabBarAccessibilityLabel: waiting
            ? [s.tabs.chats, requests && s.requests.count(requests), unread && s.chats.unread(unread)]
                .filter(Boolean)
                .join(', ')
            : undefined,
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
