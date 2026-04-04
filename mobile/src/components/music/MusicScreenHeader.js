import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const HEADER_HEIGHT = 52;
const SEARCH_ICON_SIZE = 20;
const BTN_SIZE = 36;

/**
 * Хедер Music-страницы: поиск + маленькая квадратная кнопка справа.
 */
export default function MusicScreenHeader({
  searchValue,
  onSearchChange,
  onAddPress,
  onAddPressDisabled,
  adding,
  placeholder = 'Поиск музыки',
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          height: HEADER_HEIGHT,
          borderBottomColor: colors.borderLight,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.searchRow}>
        <Ionicons
          name="search"
          size={SEARCH_ICON_SIZE}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder || colors.textMuted}
          style={[
            styles.searchInput,
            {
              color: colors.text,
              backgroundColor: colors.inputBg,
            },
          ]}
        />
        <TouchableOpacity
          onPress={onAddPress}
          disabled={onAddPressDisabled}
          activeOpacity={0.7}
          style={[
            styles.addBtn,
            {
              width: BTN_SIZE,
              height: BTN_SIZE,
              backgroundColor: colors.surfaceElevated || colors.inputBg,
            },
          ]}
        >
          {adding ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons name="add" size={22} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  addBtn: {
    marginLeft: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { HEADER_HEIGHT };
