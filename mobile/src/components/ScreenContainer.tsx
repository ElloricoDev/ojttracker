import { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { appTheme } from '../theme';
import { useResponsive } from '../theme/responsive';
import { useTheme } from '../theme/ThemeProvider';

type ScreenContainerProps = PropsWithChildren<{
  /** Optional custom background color */
  backgroundColor?: string;
  /** Edges for safe area, defaults to ['top', 'bottom'] */
  edges?: Edge[];
  /** Optional style for the inner content container */
  style?: StyleProp<ViewStyle>;
  /** Optional style for the outer safe area container */
  containerStyle?: StyleProp<ViewStyle>;
  /** If false, removes default padding. Default true */
  withPadding?: boolean;
  /** If false, removes safe-area bottom inset padding. Default true */
  withBottomInset?: boolean;
  /** If true, wraps content in ScrollView. Default false */
  scroll?: boolean;
  /** If true, enables KeyboardAvoidingView on iOS. Default true */
  keyboardAvoiding?: boolean;
  /** Optional KeyboardAvoidingView offset */
  keyboardVerticalOffset?: number;
}>;

export default function ScreenContainer({ 
  children,
  backgroundColor,
  edges = ['top'],
  style,
  containerStyle,
  withPadding = true,
  withBottomInset = true,
  scroll = false,
  keyboardAvoiding = true,
  keyboardVerticalOffset = 0,
}: ScreenContainerProps) {
  const { s } = useResponsive();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = getStyles(s);
  const bottomInset = withBottomInset ? insets.bottom : 0;
  const contentStyles = [
    styles.content,
    !withPadding && styles.noPadding,
    { paddingBottom: bottomInset },
    style,
  ];

  const innerContent = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'none'}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        ...contentStyles,
        styles.scrollContent,
        { paddingBottom: bottomInset },
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={contentStyles}>{children}</View>
  );

  const wrappedContent =
    keyboardAvoiding ? (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.flex}
      >
        {innerContent}
      </KeyboardAvoidingView>
    ) : (
      innerContent
    );

  return (
    <SafeAreaView 
      style={[
        styles.safeArea,
        backgroundColor ? { backgroundColor } : undefined,
        { backgroundColor: backgroundColor ?? colors.background },
        containerStyle
      ]}
      edges={edges}
    >
      {wrappedContent}
    </SafeAreaView>
  );
}

const getStyles = (s: (value: number) => number) =>
  StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 6,
    gap: s(appTheme.spacing.md),
    width: '100%',
  },
  noPadding: {
    padding: 0,
    gap: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 0,
  },
});
