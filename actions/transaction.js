"use server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

export async function createTransaction(data) {
  try {
    /* ---------------- AUTH ---------------- */
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    /* ---------------- GET USER ---------------- */
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    /* ---------------- GET ACCOUNT (SAFE) ---------------- */
    const account = await db.account.findFirst({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) throw new Error("Account not found");

    /* ---------------- BALANCE CHANGE ---------------- */
    const balanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    /* ---------------- DB TRANSACTION ---------------- */
    const transaction = await db.$transaction(async (tx) => {

      const created = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(
                data.date,
                data.recurringInterval
              )
              : null,
        },
      });

      /* ⭐ ACCOUNT BALANCE UPDATE */
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      /* ⭐ BUDGET UPDATE */
      await tx.budget.update({
        where: { accountId: data.accountId },
        data: {
          amount:
            data.type === "EXPENSE"
              ? { decrement: data.amount }
              : { increment: data.amount }
        },
      });

      return created;
    });

    /* ---------------- REVALIDATE ---------------- */
    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return {
      success: true,
      data: serializeAmount(transaction),
    };
  } catch (error) {
    console.error("Create Transaction Error:", error);
    throw new Error(error.message || "Failed to create transaction");
  }
}



// Scan Receipt
export async function scanReceipt(file) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Base64
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If its not a recipt, return an empty object
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}


// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // ✅ FIX: extract editId correctly
    const { editId, ...updatedData } = data;

    if (!editId) throw new Error("Transaction ID missing");

    console.log("✏️ Updating transaction:", editId);

    // ✅ Get user
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // ✅ FIX: use findFirst (safe with userId)
    const originalTransaction = await db.transaction.findFirst({
      where: {
        id: editId,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) {
      throw new Error("Transaction not found");
    }

    const oldAmount = originalTransaction.amount.toNumber();
    const newAmount = Number(updatedData.amount);

    const oldType = originalTransaction.type;
    const newType = updatedData.type;

    const accountId = originalTransaction.accountId;

    await db.$transaction(async (tx) => {
      // 🔄 Reverse old transaction
      let balanceChange = 0;

      if (oldType === "EXPENSE") {
        balanceChange += oldAmount;
      } else {
        balanceChange -= oldAmount;
      }

      // 🔄 Apply new transaction
      if (newType === "EXPENSE") {
        balanceChange -= newAmount;
      } else {
        balanceChange += newAmount;
      }

      // ✅ Update account balance
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: {
            increment: balanceChange,
          },
        },
      });

      // ✅ Update transaction
      await tx.transaction.update({
        where: { id: editId },
        data: {
          type: newType,
          amount: newAmount,
          description: updatedData.description,
          category: updatedData.category,
          date: new Date(updatedData.date),
          isRecurring: updatedData.isRecurring,
          recurringInterval: updatedData.recurringInterval || null,
        },
      });
    });

    revalidatePath(`/account/${accountId}`);

    return {
      success: true,
      data: {
        accountId,
      },
    };

  } catch (error) {
    console.error("❌ Update error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}
