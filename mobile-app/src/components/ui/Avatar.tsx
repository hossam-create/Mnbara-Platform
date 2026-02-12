import React from 'react';
import { View, StyleSheet, Image, ViewStyle, Text } from 'react-native';
import colors from '../../theme/colors';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
}

const sizeMap = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  style,
}) => {
  const avatarSize = sizeMap[size];
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.avatar,
        { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
        style,
      ]}
    >
      {source ? (
        <Image source={source} style={styles.image} />
      ) : (
        <Text style={[styles.initials, { fontSize: avatarSize / 2.5 }]}>
          {initials || '?'}
        </Text>
      )}
    </View>
  );
};

interface AvatarGroupProps {
  avatars: Array<{ source?: { uri: string }; name?: string }>;
  max?: number;
  size?: 'small' | 'medium' | 'large';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'medium',
}) => {
  const displayedAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <View style={styles.avatarGroup}>
      {displayedAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.avatarOverlap,
            { marginLeft: index > 0 ? -12 : 0 },
          ]}
        >
          <Avatar source={avatar.source} name={avatar.name} size={size} />
        </View>
      ))}
      {remainingCount > 0 && (
        <View style={[styles.avatarOverlap, { marginLeft: -12 }]}>
          <View
            style={[
              styles.moreIndicator,
              {
                width: sizeMap[size],
                height: sizeMap[size],
                borderRadius: sizeMap[size] / 2,
              },
            ]}
          >
            <Text style={styles.moreText}>+{remainingCount}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: colors.white,
    fontWeight: '600',
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOverlap: {
    zIndex: 1,
  },
  moreIndicator: {
    backgroundColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
