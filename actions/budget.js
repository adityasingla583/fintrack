"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCurrentBudget(accountId) {
  if (!accountId) return { budget: 0 };

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const budget = await db.budget.findUnique({
    where: { accountId },
  });

  return {
    budget: budget?.amount ? Number(budget.amount) : 0,
  };
}

export async function updateBudget(accountId, amount) {
  try {
    if (!accountId) throw new Error("AccountId required");

    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      throw new Error("Invalid budget amount");
    }

    const budget = await db.budget.upsert({
      where: {
        accountId,
      },
      update: {
        amount: parsedAmount,
      },
      create: {
        accountId,
        amount: parsedAmount,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${accountId}`);

    return {
      success: true,
      data: { ...budget, amount: Number(budget.amount) },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}
