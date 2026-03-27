// Conversations List Screen
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setConversations } from '../store/chat.slice';
import { Conversation } from '../../domain/entities/chat.entity';
import colors from '../../theme/colors';

// Simple Text component
const Text: React.FC<{ style?: any; children?: React.ReactNode }> = ({ style, children }) => (
  <>{children}</>
);

export const ConversationsListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { conversations, loading } = useSelector((state: RootState) => state.chat);

  useEffect(() => {
    // Load conversations
    dispatch(setConversations([]));
  }, [dispatch]);

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate('Chat', { conversationId: conversation.id });
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const otherParticipant = item.participants.find((p) => p.id !== 'currentUserId');
    const isOnline = false; // Check from online users state

    return (
      <TouchableOpacity onPress={() => handleConversationPress(item)}>
        <View style={styles.conversationItem}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {otherParticipant?.name.charAt(0) || '?'}
              </Text>
            </View>
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.participantName}>{otherParticipant?.name}</Text>
              <Text style={styles.timestamp}>
                {item.lastMessage
                  ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </Text>
            </View>
            <View style={styles.conversationPreview}>
              {item.lastMessage ? (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage.content}
                </Text>
              ) : (
                <Text style={styles.noMessages}>No messages yet</Text>
              )}
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {loading && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text>Loading conversations...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyMessage}>
            Start a conversation by accepting a delivery or trip
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => dispatch(setConversations([]))} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    padding: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  listContent: {
    padding: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary.dark,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success.main,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 8,
  },
  noMessages: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
