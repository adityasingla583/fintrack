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
  username = "",
  type = "budget-alert",
  data = {},
}) {
  // ✅ Safe defaults
  const stats = data?.stats || {
    totalIncome: 0,
    totalExpenses: 0,
    byCategory: {},
  };

  const insights = Array.isArray(data?.insights)
    ? data.insights
    : [];

  if (type === "monthly-report") {
    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>
              Monthly Financial Report
            </Heading>

            <Text style={styles.text}>Hello {username},</Text>
            <Text style={styles.text}>
              Here&rsquo;s your financial summary for {data?.month}:
            </Text>

            {/* ✅ Main Stats (SAFE) */}
            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text>Total Income</Text>
                <Text style={styles.heading}>
                  ₹{stats.totalIncome ?? 0}
                </Text>
              </div>

              <div style={styles.stat}>
                <Text>Total Expenses</Text>
                <Text style={styles.heading}>
                  ₹{stats.totalExpenses ?? 0}
                </Text>
              </div>

              <div style={styles.stat}>
                <Text>Net</Text>
                <Text style={styles.heading}>
                  ₹
                  {(stats.totalIncome ?? 0) -
                    (stats.totalExpenses ?? 0)}
                </Text>
              </div>
            </Section>

            {/* ✅ Category Breakdown (SAFE) */}
            {stats.byCategory &&
              Object.keys(stats.byCategory).length > 0 && (
                <Section style={styles.section}>
                  <Heading style={styles.heading}>
                    Expenses by Category
                  </Heading>
                  {Object.entries(stats.byCategory).map(
                    ([category, amount]) => (
                      <div key={category} style={styles.row}>
                        <Text>{category}</Text>
                        <Text>₹{amount}</Text>
                      </div>
                    )
                  )}
                </Section>
              )}

            {/* ✅ AI Insights (SAFE) */}
            {insights.length > 0 && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>
                  Wealth Insights
                </Heading>
                {insights.map((insight, index) => (
                  <Text key={index}>• {insight}</Text>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Thank you for using Welth. Keep tracking your finances
              for better financial health!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    const percentageUsed = Number(data?.percentageUsed ?? 0).toFixed(1);
    const budgetAmount = Number(data?.budgetAmount ?? 0);
    const totalExpenses = Number(data?.totalExpenses ?? 0);
    const remaining = budgetAmount - totalExpenses;

    return (
      <Html>
        <Head />
        <Preview>Budget Alert</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Budget Alert</Heading>

            <Text style={styles.text}>Hello {username},</Text>
            <Text style={styles.text}>
              You&rsquo;ve used {percentageUsed}% of your monthly
              budget.
            </Text>

            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text>Budget Amount</Text>
                <Text style={styles.heading}>
                  ₹{budgetAmount}
                </Text>
              </div>

              <div style={styles.stat}>
                <Text>Spent So Far</Text>
                <Text style={styles.heading}>
                  ₹{totalExpenses}
                </Text>
              </div>

              <div style={styles.stat}>
                <Text>Remaining</Text>
                <Text style={styles.heading}>
                  ₹{remaining}
                </Text>
              </div>
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
    backgroundColor: "#f6f9fc",
    fontFamily: "-apple-system, sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  title: {
    color: "#1f2937",
    fontSize: "28px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "20px",
  },
  heading: {
    color: "#1f2937",
    fontSize: "18px",
    fontWeight: "600",
  },
  text: {
    color: "#4b5563",
    fontSize: "14px",
    marginBottom: "10px",
  },
  section: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
  },
  statsContainer: {
    marginTop: "20px",
  },
  stat: {
    marginBottom: "10px",
    padding: "10px",
    backgroundColor: "#fff",
    borderRadius: "4px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
  },
  footer: {
    marginTop: "30px",
    fontSize: "12px",
    textAlign: "center",
    color: "#6b7280",
  },
};