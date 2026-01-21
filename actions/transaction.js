"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8001';

const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Helper function to trigger notifications
// Note: Transaction notifications are disabled - only system/user notifications are active
async function triggerTransactionNotifications(transaction, user) {
  // Transaction notifications are disabled to reduce noise
  // Only system-wide notifications (user registrations, metrics) are kept
  return;
}

// UPDATED: Enhanced ML Categorization function with FastAPI backend
// IMPORTANT: This function receives ONLY the description text and sends it to FastAPI
// for type (INCOME/EXPENSE) and category prediction
async function categorizeWithML(description) {
  try {
    console.log("🧠 Sending ONLY description to FastAPI ML model for prediction...");
    console.log("📤 Description text:", description);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Send ONLY the description text to FastAPI backend
    // FastAPI will predict: type (INCOME/EXPENSE) and category
    const mlResponse = await fetch(`${FASTAPI_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: description }), // Only description is sent
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (mlResponse.ok) {
      const mlData = await mlResponse.json();
      console.log("🤖 FastAPI Response:", mlData);

      // Map FastAPI response to your existing format
      return {
        category: mapCategoryToYourSystem(mlData.category),
        type: mlData.type.toUpperCase(), // Convert to your format (INCOME/EXPENSE)
        confidence: mlData.confidence_category,
        originalCategory: mlData.category,
        categoryConfidence: mlData.confidence_category,
        typeConfidence: mlData.confidence_type
      };
    } else {
      console.warn('FastAPI returned non-OK status:', mlResponse.status);
      throw new Error(`FastAPI error: ${mlResponse.status}`);
    }
  } catch (mlError) {
    console.warn('FastAPI categorization failed, falling back to Gemini:', mlError);
    // Fallback to Gemini text-based categorization instead of rule-based categorizer
    return await categorizeWithGemini(description);
  }
}

// Helper function to map FastAPI categories to your system
function mapCategoryToYourSystem(fastApiCategory) {
  const categoryMap = {
    'food': 'food',
    'transportation': 'transportation',
    'shopping': 'shopping',
    'entertainment': 'entertainment',
    'utilities': 'utilities',
    'healthcare': 'healthcare',
    'education': 'education',
    'travel': 'travel',
    'groceries': 'groceries',
    'housing': 'housing',
    'insurance': 'insurance',
    'gifts and donation': 'gifts',
    'salary': 'salary',
    'freelance': 'freelance',
    'rental': 'rental',
    'investment': 'investments',
    'investments': 'investments',
    'business': 'business',
    'other-income': 'other-income',
    'other income': 'other-income',
    'other-expense': 'other-expense',
    'other expense': 'other-expense'
  };

  return categoryMap[fastApiCategory] || 'other-expense';
}

// Fallback categorization using Gemini for text-only descriptions
async function categorizeWithGemini(description) {
  console.log("✨ Falling back to Gemini for text categorization...");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing for text categorization fallback");
    // Last-resort fallback to a neutral default to avoid breaking the flow
    return {
      category: 'other-expense',
      type: 'EXPENSE',
      confidence: 0.3,
      originalCategory: 'other-expense',
      categoryConfidence: 0.3,
      typeConfidence: 0.3
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expense categorization assistant.
      Classify the following transaction description into:
      - type: "INCOME" or "EXPENSE"
      - category: one of the following (use the closest match):
        ["food", "transportation", "shopping", "entertainment", "bills", "utilities",
         "healthcare", "education", "travel", "groceries", "housing", "insurance",
         "gifts", "salary", "freelance", "rental", "investments", "business",
         "other-income", "other-expense"]

      Description: "${description}"

      Respond with ONLY valid JSON in this exact format:
      {
        "category": "one of the categories above",
        "type": "INCOME or EXPENSE",
        "confidence_category": number between 0 and 1,
        "confidence_type": number between 0 and 1
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log("🧠 Gemini text categorization raw response:", text);

    // Clean possible markdown fences
    const cleaned = text.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();

    const data = JSON.parse(cleaned);

    // Basic validation
    if (!data.category || !data.type) {
      throw new Error("Gemini response missing category or type");
    }

    return {
      category: mapCategoryToYourSystem(data.category),
      type: data.type.toUpperCase(),
      confidence: data.confidence_category ?? 0.5,
      originalCategory: data.category,
      categoryConfidence: data.confidence_category ?? 0.5,
      typeConfidence: data.confidence_type ?? 0.5
    };
  } catch (error) {
    console.error("❌ Gemini text categorization fallback failed:", error);
    // Final safety net: return a neutral default
    return {
      category: 'other-expense',
      type: 'EXPENSE',
      confidence: 0.3,
      originalCategory: 'other-expense',
      categoryConfidence: 0.3,
      typeConfidence: 0.3
    };
  }
}

// UPDATED: Extract and categorize from text input
export async function extractAndCategorizeFromText(text) {
  try {
    if (!text || text.trim().length < 3) {
      throw new Error("Please provide meaningful text to analyze");
    }

    // Use FastAPI model to predict category and type from the text
    const mlPrediction = await categorizeWithML(text);

    return {
      amount: 0,
      date: new Date(),
      description: text.trim(),
      category: mlPrediction.category,
      type: mlPrediction.type,
      merchantName: "Unknown Merchant",
      mlConfidence: mlPrediction.confidence,
      originalCategory: mlPrediction.originalCategory
    };
  } catch (error) {
    console.error("Error extracting from text:", error);
    throw new Error(`Failed to analyze text: ${error.message}`);
  }
}

// Create Transaction
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Auto-categorize if category is not provided
    let finalData = { ...data };
    if (!finalData.category && finalData.description) {
      const mlPrediction = await categorizeWithML(finalData.description);
      finalData.category = mlPrediction.category;
      finalData.type = mlPrediction.type;

      console.log('Auto-categorized transaction:', {
        description: finalData.description,
        category: finalData.category,
        type: finalData.type,
        confidence: mlPrediction.confidence
      });
    }

    // Calculate new balance
    const balanceChange = finalData.type === "EXPENSE" ? -finalData.amount : finalData.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...finalData,
          userId: user.id,
          nextRecurringDate:
            finalData.isRecurring && finalData.recurringInterval
              ? calculateNextRecurringDate(finalData.date, finalData.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: finalData.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    // Trigger notifications (non-blocking)
    triggerTransactionNotifications(transaction, user).catch(console.error);

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    console.error('Create transaction error:', error);
    throw new Error(error.message);
  }
}

export async function getTransaction(id) {
  try {
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
  } catch (error) {
    console.error('Get transaction error:', error);
    throw new Error(error.message);
  }
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Auto-categorize if category is not provided
    let finalData = { ...data };
    if (!finalData.category && finalData.description) {
      const mlPrediction = await categorizeWithML(finalData.description);
      finalData.category = mlPrediction.category;
      finalData.type = mlPrediction.type;

      console.log('Auto-categorized updated transaction:', {
        description: finalData.description,
        category: finalData.category,
        type: finalData.type,
        confidence: mlPrediction.confidence
      });
    }

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      finalData.type === "EXPENSE" ? -finalData.amount : finalData.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...finalData,
          nextRecurringDate:
            finalData.isRecurring && finalData.recurringInterval
              ? calculateNextRecurringDate(finalData.date, finalData.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: finalData.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${finalData.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    console.error('Update transaction error:', error);
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error('Get user transactions error:', error);
    throw new Error(error.message);
  }
}

// NEW: Gemini API receipt scanning function
async function analyzeImageWithGemini(base64Image, prompt, mimeType) {
  try {
    // Get the Gemini model - using gemini-2.5-flash for multimodal tasks
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Prepare the image part
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    // Generate content with the image and prompt
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;

    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

// UPDATED: Receipt Scanning with Google Gemini API
export async function scanReceipt(file) {
  try {
    console.log("📸 Starting receipt scan with Google Gemini API...");

    // Validate file input
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image file (JPEG, PNG, etc.).');
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File too large. Please upload an image smaller than 5MB.');
    }

    // Verify Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is missing");
      throw new Error("Google Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.");
    }

    console.log("🔑 Gemini API Key found, initializing...");

    // Convert File to ArrayBuffer
    let base64String;
    try {
      const arrayBuffer = await file.arrayBuffer();
      base64String = Buffer.from(arrayBuffer).toString("base64");
      console.log("✅ File converted to base64");
    } catch (convertError) {
      console.error("Error converting file to base64:", convertError);
      throw new Error("Failed to process the image file. Please try again.");
    }

    // Prompt for receipt extraction
    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number, without currency symbols)
      - Date (in ISO format if available, otherwise use today's date)
      - Description or items purchased (brief summary)
      - Merchant/store name
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string"
      }

      If it's not a receipt or you can't read it clearly, return:
      {
        "amount": null,
        "date": null,
        "description": null,
        "merchantName": null
      }

      Important: Extract the actual total amount paid, not individual item prices.
    `;

    console.log("🤖 Step 1: Sending receipt image to Google Gemini API for extraction...");
    let text;

    try {
      text = await analyzeImageWithGemini(base64String, prompt, file.type);
      console.log("✅ Gemini API request successful");
    } catch (apiError) {
      console.error("❌ Gemini API error:", {
        name: apiError.name,
        message: apiError.message
      });

      // Specific error handling for Gemini
      if (apiError.message?.includes('API_KEY_INVALID') ||
        apiError.message?.includes('API key not valid') ||
        apiError.message?.includes('401')) {
        throw new Error("Invalid Google Gemini API key. Please check your API key in the settings.");
      } else if (apiError.message?.includes('quota') ||
        apiError.message?.includes('exceeded') ||
        apiError.message?.includes('429')) {
        throw new Error("API quota exceeded. Please check your Google Cloud quota limits.");
      } else if (apiError.message?.includes('PERMISSION_DENIED') ||
        apiError.message?.includes('403')) {
        throw new Error("API permission denied. Please check your Google Cloud permissions.");
      } else if (apiError.message?.includes('model not found')) {
        throw new Error("Gemini model not available. Please check the model name.");
      } else {
        throw new Error(`Google Gemini API error: ${apiError.message}`);
      }
    }

    console.log("📝 Raw Gemini response:", text);

    // Clean the response text
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    console.log("🧹 Cleaned response:", cleanedText);

    try {
      const receiptData = JSON.parse(cleanedText);
      console.log("✅ Step 1 Complete - Parsed receipt data from Gemini:", {
        amount: receiptData.amount,
        date: receiptData.date,
        description: receiptData.description,
        merchantName: receiptData.merchantName
      });

      // Validate receipt data
      const hasAmount = receiptData.amount !== null && receiptData.amount !== undefined && receiptData.amount !== '';
      const hasDescription = receiptData.description && receiptData.description.trim().length > 0;

      if (!hasAmount || !hasDescription) {
        console.warn("⚠️ Insufficient data extracted from receipt:", {
          amount: receiptData.amount,
          description: receiptData.description,
          hasAmount,
          hasDescription
        });
        throw new Error(
          `Could not extract complete receipt data. ` +
          `${!hasAmount ? 'Amount is missing. ' : ''}` +
          `${!hasDescription ? 'Description is missing. ' : ''}` +
          `Please ensure the image is clear and contains a valid receipt.`
        );
      }

      // STEP 2: Send ONLY description to FastAPI for type and category prediction
      console.log("🧠 Step 2: Sending ONLY description to FastAPI for type and category prediction...");
      console.log("📤 Description being sent:", receiptData.description);
      const mlPrediction = await categorizeWithML(receiptData.description);
      console.log("✅ Step 2 Complete - FastAPI prediction:", {
        category: mlPrediction.category,
        type: mlPrediction.type,
        confidence: mlPrediction.confidence
      });

      // STEP 3: Combine Gemini extraction + FastAPI predictions for form auto-fill
      // Parse amount
      let parsedAmount = receiptData.amount;
      if (typeof parsedAmount === 'string') {
        // Remove currency symbols and whitespace, then parse
        parsedAmount = parseFloat(parsedAmount.replace(/[^\d.-]/g, ''));
      } else {
        parsedAmount = parseFloat(parsedAmount);
      }

      // Validate parsed amount
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        console.warn("⚠️ Invalid amount parsed:", receiptData.amount, "->", parsedAmount);
        throw new Error(`Could not parse amount from receipt: ${receiptData.amount}. Please check the receipt image.`);
      }

      // Parse date
      let receiptDate;
      try {
        receiptDate = receiptData.date ? new Date(receiptData.date) : new Date();
      } catch (dateError) {
        console.warn("⚠️ Invalid date, using current date:", dateError);
        receiptDate = new Date();
      }

      const finalResult = {
        // From Gemini extraction
        amount: parsedAmount,
        date: receiptDate,
        description: receiptData.description.trim(),
        merchantName: receiptData.merchantName?.trim() || "Unknown Merchant",
        // From FastAPI prediction (type and category)
        category: mlPrediction.category,
        type: mlPrediction.type,
        // Additional metadata
        mlConfidence: mlPrediction.confidence,
        categoryConfidence: mlPrediction.categoryConfidence,
        typeConfidence: mlPrediction.typeConfidence,
        originalCategory: mlPrediction.originalCategory,
        source: "Google Gemini API"
      };

      console.log("🎯 Step 3 Complete - Final scan result ready for form auto-fill:", finalResult);
      return finalResult;

    } catch (parseError) {
      console.error("❌ Error parsing JSON response:", parseError);
      console.log("Raw response from Gemini:", text);
      throw new Error("Could not read receipt data. Please try again with a clearer image.");
    }
  } catch (error) {
    console.error("❌ Receipt scanning error:", error);
    throw error; // Re-throw to let the frontend handle it
  }
}

// Alternative: Simple receipt scanning without AI
export async function scanReceiptSimple(file) {
  try {
    console.log("Using simple receipt scanning fallback");

    return {
      amount: 0,
      date: new Date(),
      description: "Receipt scanned - please enter details manually",
      category: "other-expense",
      type: "EXPENSE",
      merchantName: "Unknown Merchant",
      mlConfidence: 0.5,
      originalCategory: "Other",
      note: "AI scanning temporarily unavailable. Please enter transaction details manually.",
      source: "Simple fallback"
    };

  } catch (error) {
    console.error("Simple receipt scanning error:", error);
    throw new Error("Receipt scanning unavailable. Please enter transaction details manually.");
  }
}

// Test Gemini connection
export async function testGeminiConnection() {
  try {
    console.log("🔧 Testing Google Gemini API connection...");

    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: "GEMINI_API_KEY is not set in environment variables" };
    }

    // Create a new instance for testing
    const testGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = testGenAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent("Hello, are you working? Respond with 'Yes, I am working!'");
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini test response:", text);
    return { success: true, response: text };
  } catch (error) {
    console.error("❌ Gemini test failed:", error);
    return {
      success: false,
      error: error.message,
      details: "Check your Google Cloud API key and ensure it has proper permissions"
    };
  }
}

// Test FastAPI connection
export async function testMLConnection() {
  try {
    const response = await fetch(`${FASTAPI_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        status: data.status,
        models_loaded: data.models_loaded,
        message: 'FastAPI backend is connected and ready'
      };
    } else {
      return {
        success: false,
        error: `FastAPI returned status: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to connect to FastAPI: ${error.message}`
    };
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