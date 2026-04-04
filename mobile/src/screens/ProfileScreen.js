import React from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEarlyRefresh } from '../hooks/useEarlyRefresh';
import { useTheme } from '../context/ThemeContext';
import { getRefreshSpinnerColor } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useTheme();
  const refreshIndicatorColor = theme === 'dark' ? '#F4F7FF' : '#465fff';
  const spinnerColor = colors.refreshSpinner || getRefreshSpinnerColor(theme);
  const refreshCallback = React.useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
  }, []);
  const { refreshing, onRefresh } = useEarlyRefresh(refreshCallback, 10);

  return (
    <View style={[styles.rootWrap, { paddingTop: insets.top }]}>
      <ScrollView
        style={[styles.scroll, Platform.OS === 'android' && { elevation: 2 }]}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: 16,
            paddingBottom: 24 + (insets.bottom || 0),
            minHeight: SCREEN_HEIGHT - insets.top - (insets.bottom || 0) + 80,
            flexGrow: 1,
          },
        ]}
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      bounces={true}
      alwaysBounceVertical={true}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={refreshIndicatorColor}
            colors={[refreshIndicatorColor]}

          progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
          progressViewOffset={insets.top + 24}
        />
      }
    >
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your profile — coming soon</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
