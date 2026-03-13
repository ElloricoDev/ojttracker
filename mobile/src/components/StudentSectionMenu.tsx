import { useNavigation, useRoute } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { STUDENT_ROUTES, type DrawerParamList, type StudentRouteName } from '../navigation/types';
import { appTheme } from '../theme';

type NavigationProp = DrawerNavigationProp<DrawerParamList>;

export default function StudentSectionMenu() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const activeRoute = route.name as StudentRouteName;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.menuContent}
    >
      <View style={styles.menuRow}>
        {STUDENT_ROUTES.map((section) => {
          const isActive = section.name === activeRoute;

          return (
            <Pressable
              key={section.name}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(section.name);
                }
              }}
              style={({ pressed }) => [
                styles.menuButton,
                isActive ? styles.menuButtonActive : null,
                pressed && !isActive ? styles.menuButtonPressed : null,
              ]}
            >
              <View style={styles.menuLabelRow}>
                <MaterialCommunityIcons
                  name={section.icon}
                  size={15}
                  color={isActive ? appTheme.colors.surface : appTheme.colors.mutedText}
                />
                <Text style={[styles.menuLabel, isActive ? styles.menuLabelActive : null]}>
                  {section.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  menuContent: {
    paddingBottom: appTheme.spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    gap: appTheme.spacing.sm,
  },
  menuButton: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs + 2,
    backgroundColor: appTheme.colors.surface,
  },
  menuButtonActive: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  menuButtonPressed: {
    opacity: 0.85,
  },
  menuLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.xs + 2,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: appTheme.colors.mutedText,
  },
  menuLabelActive: {
    color: appTheme.colors.surface,
  },
});
