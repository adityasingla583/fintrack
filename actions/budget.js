"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCurrentBudget(accountId) {

  if (!accountId) return { remainingBudget: 0 };

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const budget = await db.budget.findUnique({
    where: { accountId },
  });

  return {
    remainingBudget: budget?.amount?.toNumber() || 0,
  };
}

export async function updateBudget(accountId, amount) {
  try {

    if (!accountId) throw new Error("AccountId required");

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const budget = await db.budget.upsert({
      where: {
        accountId,
      },
      update: {
        amount,
      },
      create: {
        accountId,
        amount,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };

  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}