/**
 * IAP Fallback Screen Component
 *
 * Purpose:
 * Display bundle upsell screen when a feature requires ɳTV Bundle but it's not active.
 * Three error states: region unavailable, purchase restricted (parental controls),
 * subscription pending (awaiting App Store / Play Store verification).
 *
 * Inputs:
 * - reason: enum indicating error type
 * - onPurchase: callback when user taps purchase CTA
 *
 * Outputs:
 * - Rendered UI for given reason
 * - onPurchase() call on "Get Bundle" tap
 * - Navigator.pop() on "Back" or reason-specific action
 *
 * Constraints:
 * - Used only when NSELF_BUNDLE=false (free variant)
 * - Purchase flow itself managed by useIap hook
 * - All three reason states must render gracefully
 *
 * Ported from:
 * - ntv/flutter-archive/lib/shared/widgets/iap_fallback_screen.dart
 */

import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  ScrollView,
  Linking,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export enum IapFallbackReason {
  /** Bundle not available for purchase in user's region */
  regionUnavailable = 'regionUnavailable',

  /** Parental controls or device restrictions prevent purchase */
  purchaseRestricted = 'purchaseRestricted',

  /** Purchase submitted but pending app store verification */
  subscriptionPending = 'subscriptionPending',
}

interface IapFallbackContent {
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  primaryAction?: {
    label: string;
    onTap: () => void;
  };
}

interface IapFallbackScreenProps {
  reason: IapFallbackReason;
  onPurchase?: () => void;
}

/**
 * Fallback screen shown when IAP cannot proceed.
 * Handles region unavailable, purchase restricted, and subscription pending states.
 */
export function IapFallbackScreen({
  reason,
  onPurchase,
}: IapFallbackScreenProps) {
  const router = useRouter();

  const contentMap: Record<IapFallbackReason, IapFallbackContent> = {
    [IapFallbackReason.regionUnavailable]: {
      icon: 'globe-model-off',
      iconColor: '#FBBF24', // amber-400
      title: 'Bundle unavailable in your region',
      body: 'The ɳTV Bundle is not available for purchase in your region. You can still use ɳTV with a free M3U playlist. If you think this is a mistake, contact support.',
      primaryAction: {
        label: 'Contact support',
        onTap: () => Linking.openURL('https://chat.nself.org'),
      },
    },
    [IapFallbackReason.purchaseRestricted]: {
      icon: 'family',
      iconColor: '#60A5FA', // blue-400
      title: 'Purchase restricted',
      body: 'Your device has parental controls or content restrictions that prevent in-app purchases. Ask the account owner to allow purchases, or manage restrictions in your device Settings.',
      primaryAction: {
        label: 'Open device Settings',
        onTap: () => Linking.openSettings(),
      },
    },
    [IapFallbackReason.subscriptionPending]: {
      icon: 'hourglass-top',
      iconColor: '#34D399', // emerald-400
      title: 'Subscription pending verification',
      body: 'Your purchase was submitted and is pending verification by the app store. This usually completes within a few minutes. Restart the app to check — your bundle will activate automatically once the payment clears.',
      primaryAction: undefined,
    },
  };

  const content = contentMap[reason];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>ɳTV Bundle</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={content.icon}
            size={56}
            color={content.iconColor}
          />
        </View>

        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.body}>{content.body}</Text>

        {content.primaryAction && (
          <>
            <Pressable
              style={styles.primaryButton}
              onPress={content.primaryAction.onTap}
            >
              <Text style={styles.primaryButtonText}>
                {content.primaryAction.label}
              </Text>
            </Pressable>
          </>
        )}

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712', // gray-950
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937', // gray-800
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#9CA3AF', // gray-400
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#4F46E5', // indigo-600
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#6B7280', // gray-500
    textAlign: 'center',
  },
});
