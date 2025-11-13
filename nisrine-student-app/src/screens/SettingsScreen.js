import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
  ar: { name: 'العربية', flag: '🇲🇦' },
};

export default function SettingsScreen({ navigation }) {
  const { theme, currentTheme, changeTheme, themes } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const language = await AsyncStorage.getItem('appLanguage');
      if (language && LANGUAGES[language]) {
        setSelectedLanguage(language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const saveLanguage = async (languageKey) => {
    try {
      await AsyncStorage.setItem('appLanguage', languageKey);
      setSelectedLanguage(languageKey);
      Alert.alert(
        'Language Changed',
        'Your language preference has been saved! This feature will be fully implemented soon.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving language:', error);
      Alert.alert('Error', 'Failed to save language');
    }
  };

  const styles = getStyles(theme);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="settings" size={40} color={currentTheme.primary} />
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your app experience</Text>
      </View>

      {/* Theme Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="color-palette" size={24} color={currentTheme.primary} />
          <Text style={styles.sectionTitle}>Theme</Text>
        </View>
        <Text style={styles.sectionDescription}>Choose your preferred color theme</Text>

        <View style={styles.themeGrid}>
          {Object.keys(themes).map((themeKey) => (
            <TouchableOpacity
              key={themeKey}
              style={[
                styles.themeCard,
                { backgroundColor: themes[themeKey].cardBg, borderColor: themes[themeKey].borderColor },
                currentTheme === themeKey && { borderColor: themes[themeKey].primary, borderWidth: 3 },
              ]}
              onPress={() => changeTheme(themeKey)}
              activeOpacity={0.8}
            >
              <View style={[styles.themeIconContainer, { backgroundColor: themes[themeKey].primary + '20' }]}>
                <Ionicons name={themes[themeKey].icon} size={40} color={themes[themeKey].primary} />
              </View>
              <Text style={[styles.themeName, { color: themes[themeKey].text }]}>{themes[themeKey].name}</Text>
              <Text style={[styles.themeDescription, { color: themes[themeKey].textLight }]}>{themes[themeKey].description}</Text>
              <View style={styles.themeColors}>
                <View style={[styles.colorDot, { backgroundColor: themes[themeKey].primary }]} />
                <View style={[styles.colorDot, { backgroundColor: themes[themeKey].secondary }]} />
                <View style={[styles.colorDot, { backgroundColor: themes[themeKey].background }]} />
              </View>
              {currentTheme === themeKey && (
                <View style={[styles.selectedBadge, { backgroundColor: themes[themeKey].primary }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.selectedText}>Active</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="language" size={24} color={currentTheme.primary} />
          <Text style={styles.sectionTitle}>Language</Text>
        </View>
        <Text style={styles.sectionDescription}>Select your preferred language</Text>

        {Object.keys(LANGUAGES).map((langKey) => (
          <TouchableOpacity
            key={langKey}
            style={[
              styles.optionCard,
              selectedLanguage === langKey && styles.selectedOption,
            ]}
            onPress={() => saveLanguage(langKey)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={styles.flagEmoji}>{LANGUAGES[langKey].flag}</Text>
              <Text style={styles.optionTitle}>{LANGUAGES[langKey].name}</Text>
            </View>
            {selectedLanguage === langKey && (
              <Ionicons name="checkmark-circle" size={24} color={currentTheme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* App Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>Nisrine School Student App</Text>
        <Text style={styles.infoSubtext}>Version 1.0.1</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: theme.cardBg,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textLight,
    marginTop: 5,
  },
  section: {
    backgroundColor: theme.cardBg,
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginLeft: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.textLight,
    marginBottom: 15,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  themeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  themeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  themeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  themeDescription: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 15,
  },
  themeColors: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00000020',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  selectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    backgroundColor: theme.background,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  flagEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  infoSection: {
    alignItems: 'center',
    padding: 30,
    marginBottom: 30,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textLight,
  },
  infoSubtext: {
    fontSize: 12,
    color: theme.textLight,
    marginTop: 5,
  },
});
