import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  triggerRecurringTransactions,
  processRecurringTransaction,
  checkBudgetAlerts,
  generateMonthlyReports,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    triggerRecurringTransactions,
    processRecurringTransaction,
    checkBudgetAlerts,
    generateMonthlyReports,
  ],
});
