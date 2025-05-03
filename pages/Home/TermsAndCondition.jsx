import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";

const TermsAndCondition = () => {
  return (
    <ScrollView contentContainerStyle={styles.meditationScrollContent}>
      <Text style={styles.paragraph}>
        Welcome! This app is lovingly built by volunteers to support your
        journey in practicing kriya and meditation.
        {"\n\n"}Please review our Terms and Conditions and Privacy Policy to
        continue.
      </Text>

      <Text style={styles.heading}>Terms and Conditions</Text>
      <Text style={styles.subHeading}>Effective Date: 3rd May 2025</Text>

      <Text style={styles.boldTitle}>1. Acceptance of Terms</Text>
      <Text style={styles.termText}>
        By accessing or using our App, you agree to comply with and be legally
        bound by these Terms. If you do not agree to these Terms, please do not
        use the App.
      </Text>

      <Text style={styles.boldTitle}>2. Use of the App</Text>
      <Text style={styles.termText}>
        You must be at least 13 years old to use this app.
        {"\n\n"}You agree not to misuse the app, including hacking, spamming, or
        using it for illegal activities.
        {"\n\n"}Teachers and administrators must ensure that all members joining
        their network are legitimate and consent to join.
      </Text>

      <Text style={styles.boldTitle}>3. Account Responsibility</Text>
      <Text style={styles.termText}>
        You are responsible for maintaining the confidentiality of your account
        credentials.
        {"\n\n"}You agree to notify us immediately of any unauthorized use of
        your account.
      </Text>

      <Text style={styles.boldTitle}>4. Content Ownership</Text>
      <Text style={styles.termText}>
        All content you upload remains yours. However, by submitting it, you
        grant us a license to store and process it for the purpose of operating
        the app.
      </Text>

      <Text style={styles.boldTitle}>5. Termination</Text>
      <Text style={styles.termText}>
        We reserve the right to suspend or terminate your access at our
        discretion, particularly if you violate these Terms.
      </Text>

      <Text style={styles.boldTitle}>6. Changes to the Terms</Text>
      <Text style={styles.termText}>
        We may update these Terms occasionally. Continued use of the app after
        changes constitutes acceptance of the new Terms.
      </Text>

      <Text style={styles.boldTitle}>7. Contact</Text>

      <Text style={styles.heading}>🔒 Privacy Policy </Text>
      <Text style={styles.subHeading}>Effective Date: #rd May 2025</Text>

      <Text style={styles.boldTitle}>1. Information We Collect</Text>
      <Text style={styles.termText}>
        Personal Info: Name, email, role, phone number, profession, etc.
        {"\n\n"}Usage Data: App activity like habit tracking, challenge
        completion, and network participation.
        {"\n\n"}Device Info: Device ID, OS, and app version (if applicable).
      </Text>

      <Text style={styles.boldTitle}>2. How We Use Your Information</Text>
      <Text style={styles.termText}>
        To provide and personalize your app experience.
        {"\n\n"}To manage your membership and teacher network requests.
        {"\n\n"}To improve app performance and fix issues.
      </Text>

      <Text style={styles.boldTitle}>3. Data Sharing</Text>
      <Text style={styles.termText}>
        We do not sell or rent your data. We only share data:
        {"\n\n"}• With your permission (e.g., joining a teacher network).
        {"\n"}• When required by law.
      </Text>

      <Text style={styles.boldTitle}>4. Data Security</Text>
      <Text style={styles.termText}>
        We store your data securely using Firebase and take appropriate
        technical measures to protect it.
      </Text>

      <Text style={styles.boldTitle}>5. Children's Privacy</Text>
      <Text style={styles.termText}>
        The app is not intended for users under the age of 13. If we learn that
        we’ve collected personal data from a child, we will delete it promptly.
      </Text>

      <Text style={styles.boldTitle}>6. Your Rights</Text>
      <Text style={styles.termText}>
        You may access, correct, or delete your data by contacting us.
        {"\n\n"}You can opt out of communications at any time.
      </Text>

      <Text style={styles.boldTitle}>7. Updates to This Policy</Text>
      <Text style={styles.termText}>
        We may update this policy. Any changes will be posted in the app or
        communicated to you.
      </Text>

      <Text style={styles.boldTitle}>8. Contact Us</Text>
      <Text style={styles.termText}>
      If you have questions about this policy, feel free to reach out to us through the app.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  meditationScrollContent: {
    padding: 20,
    backgroundColor: "#fff",
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 10,
  },
  heading: {
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  subHeading: {
    fontSize: 14,
    marginBottom: 10,
  },
  boldTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 10,
  },
  termText: {
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  agreeButton: {
    backgroundColor: "#007bff",
    color: "#fff",
    textAlign: "center",
    padding: 12,
    borderRadius: 8,
    fontWeight: "bold",
  },
});

export default TermsAndCondition;
