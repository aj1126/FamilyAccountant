import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.faqCard}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Question: ${question}`}
        accessibilityState={{ expanded }}
      >
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#64748b"
        />
      </TouchableOpacity>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </View>
  );
}

export default function HelpScreen() {
  const handleOpenOnlineDocs = () => {
    Linking.openURL('https://aj1126.github.io/FamilyAccountant/user-guide/').catch(
      (err) => console.error('Failed to open online documentation:', err)
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scrollView}>
      <Text style={styles.heading}>Help & Docs</Text>

      {/* Online Docs Button */}
      <View style={styles.promoCard}>
        <Ionicons name="book-outline" size={32} color="#2563eb" style={styles.promoIcon} />
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>Full User Manual</Text>
          <Text style={styles.promoDesc}>
            Access our complete interactive guide online, featuring system diagrams and advanced search.
          </Text>
          <TouchableOpacity style={styles.promoBtn} onPress={handleOpenOnlineDocs}>
            <Text style={styles.promoBtnText}>Open Online Guide</Text>
            <Ionicons name="open-outline" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Help Guide */}
      <Text style={styles.subHeading}>Offline Reference Guide</Text>

      <FAQItem
        question="1. Getting Started & Households"
        answer="FamilyAccountant groups all details inside a 'Household'. Join an existing one by pasting the Join ID shared by your family, or create a new one to invite others. You must be in a household to record transactions."
      />

      <FAQItem
        question="2. Custom Currencies"
        answer="Accounts support custom ISO currencies (e.g. USD, EUR). When you record expenses, they inherit the currency of the selected account. The dashboard sums and displays totals separately for each currency."
      />

      <FAQItem
        question="3. Offline Synchronization"
        answer="Transactions added while offline are stored in a local database with a yellow pending badge. Once internet access is detected, the app automatically syncs changes to the cloud database."
      />

      <FAQItem
        question="4. Transaction Status Badges"
        answer="Synced (Green): Successfully saved on server. Pending (Yellow): Saved locally, waiting for internet. Error (Red): Sync failed, will retry once network stabilizes."
      />

      <FAQItem
        question="5. Debts & Settlement"
        answer="Record debts with other members of your household. Adding payments dynamically reduces the outstanding balance. The debt is automatically marked as 'Settled' once it is fully paid off."
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>FamilyAccountant v1.0.0 (Offline Enabled)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  subHeading: { fontSize: 16, fontWeight: '600', color: '#475569', marginTop: 20, marginBottom: 12 },
  
  /* Online Promo Card */
  promoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  promoIcon: { marginRight: 14, marginTop: 4 },
  promoContent: { flex: 1 },
  promoTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  promoDesc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 12 },
  promoBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
  },
  promoBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  /* FAQ Collapsible Cards */
  faqCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 8 },
  faqAnswer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  
  /* Footer */
  footer: { marginTop: 32, alignItems: 'center', marginBottom: 16 },
  footerText: { fontSize: 11, color: '#94a3b8' },
});
