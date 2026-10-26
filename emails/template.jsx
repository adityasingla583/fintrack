import {
  Html,
  Head,
  Body,
  Preview,
  Container,
  Heading,
  Text,
  Section,
} from "@react-email/components";
import * as React from "react";

export default function EmailTemplate({
  username = "FinTrack User",
  type = "budget-alert",
  data = {},
}) {
  const stats = data?.stats || {
    totalIncome: 0,
    totalExpenses: 0,
    byCategory: {},
  };

  const insights = Array.isArray(data?.insights) ? data.insights : [];

  if (type === "monthly-report") {
    const net = (stats.totalIncome ?? 0) - (stats.totalExpenses ?? 0);
    const isNetPositive = net >= 0;

    return (
      <Html>
        <Head />
        <Preview>📊 FinTrack: Your Monthly Financial Report for {data?.month}</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            {/* Brand Header */}
            <Section style={styles.header}>
              <div style={styles.badge}>
                <span style={styles.logoMark}>F</span>
                <span style={styles.logoText}>FinTrack</span>
              </div>
              <Heading style={styles.title}>Monthly Financial Report</Heading>
              <Text style={styles.subtitle}>Summary for {data?.month}</Text>
            </Section>

            <Text style={styles.greeting}>Hello {username},</Text>
            <Text style={styles.paragraph}>
              Here is your verified financial overview and category breakdown for the past month.
            </Text>

            {/* KPI Stat Cards */}
            <Section style={styles.statsRow}>
              <div style={styles.statCard}>
                <Text style={styles.statLabel}>Total Income</Text>
                <Text style={styles.statIncome}>
                  ₹{(stats.totalIncome ?? 0).toLocaleString("en-IN")}
                </Text>
              </div>

              <div style={styles.statCard}>
                <Text style={styles.statLabel}>Total Expenses</Text>
                <Text style={styles.statExpense}>
                  ₹{(stats.totalExpenses ?? 0).toLocaleString("en-IN")}
                </Text>
              </div>

              <div style={styles.statCard}>
                <Text style={styles.statLabel}>Net Balance</Text>
                <Text style={isNetPositive ? styles.statIncome : styles.statExpense}>
                  ₹{Math.abs(net).toLocaleString("en-IN")} {net < 0 ? "(Deficit)" : "(Savings)"}
                </Text>
              </div>
            </Section>

            {/* Categories */}
            {stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
              <Section style={styles.cardSection}>
                <Heading style={styles.sectionHeading}>
                  Spending by Category
                </Heading>
                <div style={styles.categoryTable}>
                  {Object.entries(stats.byCategory).map(([category, amount]) => (
                    <div key={category} style={styles.categoryRow}>
                      <Text style={styles.categoryName}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}
                      </Text>
                      <Text style={styles.categoryAmount}>
                        ₹{Number(amount).toLocaleString("en-IN")}
                      </Text>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Gemini AI Insights */}
            {insights.length > 0 && (
              <Section style={styles.aiSection}>
                <div style={styles.aiHeader}>
                  <Text style={styles.aiTitle}>✨ Gemini AI Financial Insights</Text>
                </div>
                <div style={styles.aiBody}>
                  {insights.map((insight, index) => (
                    <Text key={index} style={styles.aiItem}>
                      • {insight}
                    </Text>
                  ))}
                </div>
              </Section>
            )}

            {/* Footer */}
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                © {new Date().getFullYear()} FinTrack. Keep taking control of your financial freedom!
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    const percentageUsed = Number(data?.percentageUsed ?? 0).toFixed(0);
    const budgetAmount = Number(data?.budgetAmount ?? 0);
    const totalExpenses = Number(data?.totalExpenses ?? 0);
    const remaining = budgetAmount - totalExpenses;

    return (
      <Html>
        <Head />
        <Preview>⚠️ Budget Alert: {percentageUsed}% of budget reached on {data?.accountName || "Account"}</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            {/* Brand Header */}
            <Section style={styles.alertHeader}>
              <div style={styles.badge}>
                <span style={styles.logoMark}>F</span>
                <span style={styles.logoText}>FinTrack</span>
              </div>
              <Heading style={styles.alertTitle}>⚠️ Budget Threshold Alert</Heading>
              <Text style={styles.subtitle}>
                You have reached {percentageUsed}% of your monthly limit
              </Text>
            </Section>

            <Text style={styles.greeting}>Hello {username},</Text>
            <Text style={styles.paragraph}>
              Your account spending on <strong>{data?.accountName || "Default Account"}</strong> has approached or exceeded your monthly budget allocation.
            </Text>

            {/* Progress Visualization */}
            <Section style={styles.cardSection}>
              <div style={styles.statCardFull}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <Text style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                    Budget Utilization
                  </Text>
                  <Text style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#f87171" }}>
                    {percentageUsed}%
                  </Text>
                </div>
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${Math.min(Number(percentageUsed), 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "12px" }}>
                <div style={styles.statMiniCard}>
                  <Text style={styles.statLabel}>Budget Limit</Text>
                  <Text style={styles.statValue}>₹{budgetAmount.toLocaleString("en-IN")}</Text>
                </div>
                <div style={styles.statMiniCard}>
                  <Text style={styles.statLabel}>Spent so far</Text>
                  <Text style={styles.statExpense}>₹{totalExpenses.toLocaleString("en-IN")}</Text>
                </div>
                <div style={styles.statMiniCard}>
                  <Text style={styles.statLabel}>Remaining</Text>
                  <Text style={remaining >= 0 ? styles.statIncome : styles.statExpense}>
                    ₹{Math.abs(remaining).toLocaleString("en-IN")} {remaining < 0 ? "(Over)" : ""}
                  </Text>
                </div>
              </div>
            </Section>

            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                Log in to your FinTrack dashboard to review upcoming expenses and adjust your budget goals.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }

  return null;
}

const styles = {
  body: {
    backgroundColor: "#0f172a",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: "0",
    padding: "32px 12px",
  },
  container: {
    backgroundColor: "#1e293b",
    margin: "0 auto",
    padding: "28px",
    borderRadius: "16px",
    maxWidth: "540px",
    border: "1px solid #334155",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
  },
  header: {
    textAlign: "center",
    paddingBottom: "20px",
    borderBottom: "1px solid #334155",
    marginBottom: "24px",
  },
  alertHeader: {
    textAlign: "center",
    paddingBottom: "20px",
    borderBottom: "1px solid #334155",
    marginBottom: "24px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  logoMark: {
    display: "inline-block",
    width: "28px",
    height: "28px",
    lineHeight: "28px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "14px",
    textAlign: "center",
  },
  logoText: {
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    marginLeft: "6px",
  },
  title: {
    color: "#f8fafc",
    fontSize: "22px",
    fontWeight: "700",
    margin: "8px 0 4px",
  },
  alertTitle: {
    color: "#f87171",
    fontSize: "20px",
    fontWeight: "700",
    margin: "8px 0 4px",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "13px",
    margin: "0",
  },
  greeting: {
    color: "#f1f5f9",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 8px",
  },
  paragraph: {
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 20px",
  },
  statsRow: {
    marginBottom: "20px",
  },
  statCard: {
    backgroundColor: "#0f172a",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #334155",
    marginBottom: "10px",
  },
  statCardFull: {
    backgroundColor: "#0f172a",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #334155",
  },
  statMiniCard: {
    backgroundColor: "#0f172a",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #334155",
    textAlign: "center",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 4px",
  },
  statValue: {
    color: "#f8fafc",
    fontSize: "15px",
    fontWeight: "700",
    margin: "0",
  },
  statIncome: {
    color: "#34d399",
    fontSize: "16px",
    fontWeight: "700",
    margin: "0",
  },
  statExpense: {
    color: "#f87171",
    fontSize: "16px",
    fontWeight: "700",
    margin: "0",
  },
  progressBarBg: {
    width: "100%",
    height: "8px",
    backgroundColor: "#334155",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#f87171",
    borderRadius: "999px",
  },
  cardSection: {
    backgroundColor: "#1e293b",
    marginBottom: "20px",
  },
  sectionHeading: {
    color: "#f1f5f9",
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "12px",
  },
  categoryTable: {
    backgroundColor: "#0f172a",
    borderRadius: "10px",
    border: "1px solid #334155",
    overflow: "hidden",
  },
  categoryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: "1px solid #1e293b",
  },
  categoryName: {
    color: "#cbd5e1",
    fontSize: "13px",
    margin: "0",
  },
  categoryAmount: {
    color: "#f8fafc",
    fontSize: "13px",
    fontWeight: "600",
    margin: "0",
  },
  aiSection: {
    backgroundColor: "#172554",
    borderRadius: "10px",
    border: "1px solid #1e40af",
    overflow: "hidden",
    marginBottom: "20px",
  },
  aiHeader: {
    padding: "12px 16px",
    backgroundColor: "#1e3a8a",
    borderBottom: "1px solid #1e40af",
  },
  aiTitle: {
    color: "#93c5fd",
    fontSize: "13px",
    fontWeight: "700",
    margin: "0",
  },
  aiBody: {
    padding: "12px 16px",
  },
  aiItem: {
    color: "#bfdbfe",
    fontSize: "12px",
    lineHeight: "1.6",
    margin: "0 0 6px",
  },
  footer: {
    borderTop: "1px solid #334155",
    paddingTop: "20px",
    textAlign: "center",
  },
  footerText: {
    color: "#64748b",
    fontSize: "12px",
    margin: "0",
  },
};
