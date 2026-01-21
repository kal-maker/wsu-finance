import { inngest } from "./client";
import { db } from "@/lib/prisma";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { getModel } from "@/lib/gemini";
import { completeWithDeepSeek } from "@/lib/deepseek";

// 1. Manual trigger for recurring transactions (called directly from admin)
export async function triggerRecurringTransaction() {
  console.log('🔄 [RECURRING TX] Manual trigger function called');

  const recurringTransactions = await db.transaction.findMany({
    where: {
      isRecurring: true,
      status: "COMPLETED",
      OR: [
        { lastProcessed: null },
        {
          nextRecurringDate: {
            lte: new Date(),
          },
        },
      ],
    },
    include: {
      account: true,
      user: true, // Include user info for email
    },
  });

  console.log('🔄 [RECURRING TX] Found recurring transactions:', recurringTransactions.length);

  let processed = 0;
  const processedTransactions = [];

  for (const transaction of recurringTransactions) {
    if (!isTransactionDue(transaction)) continue;

    // Create new transaction and update account balance in a transaction
    await db.$transaction(async (tx) => {
      // Create new transaction
      await tx.transaction.create({
        data: {
          type: transaction.type,
          amount: transaction.amount,
          description: `${transaction.description} (Recurring)`,
          date: new Date(),
          category: transaction.category,
          userId: transaction.userId,
          accountId: transaction.accountId,
          isRecurring: false,
        },
      });

      // Update account balance
      const balanceChange =
        transaction.type === "EXPENSE"
          ? -transaction.amount.toNumber()
          : transaction.amount.toNumber();

      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } },
      });

      // Update last processed date and next recurring date
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          lastProcessed: new Date(),
          nextRecurringDate: calculateNextRecurringDate(
            new Date(),
            transaction.recurringInterval
          ),
        },
      });
    });

    processedTransactions.push({
      description: transaction.description,
      amount: transaction.amount.toNumber(),
      type: transaction.type,
      userName: transaction.user.name,
      accountName: transaction.account.name,
    });

    processed++;
  }

  console.log('✅ [RECURRING TX] Processed', processed, 'recurring transactions');

  // Send email notification if transactions were processed
  if (processed > 0) {
    try {
      // Get admin user info (assuming the first admin user for notifications)
      const adminUser = await db.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (adminUser) {
        console.log('📧 [RECURRING TX] Sending notification email to admin:', adminUser.email);

        const emailResult = await sendEmail({
          to: adminUser.email,
          subject: `Recurring Transactions Processed - ${processed} transactions`,
          react: EmailTemplate({
            userName: adminUser.name,
            type: 'recurring-summary',
            data: {
              processedCount: processed,
              transactions: processedTransactions,
              processedAt: new Date().toLocaleString(),
            },
          }),
        });

        if (emailResult.success) {
          console.log('✅ [RECURRING TX] Notification email sent successfully');
        } else {
          console.log('❌ [RECURRING TX] Failed to send notification email:', emailResult.error);
        }
      }
    } catch (error) {
      console.error('❌ [RECURRING TX] Error sending notification email:', error);
    }
  }

  return { processed };
}

// Process recurring transactions with batching
export const processRecurringTransactions = inngest.createFunction(
  {
    id: "process-recurring-transactions", // Unique ID,
    name: "Process Recurring Transactions",
  },
  { cron: "0 0 * * *" }, // Daily at midnight
  async ({ step }) => {
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(),
                },
              },
            ],
          },
        });
      }
    );

    // Send event for each recurring transaction in batches
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      // Send events directly using inngest.send()
      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

// 2. Monthly Report Generation
async function generateComprehensiveFinancialAnalysis(transactions, stats, monthName, userName) {
  try {
    // Use DeepSeek for analysis with Gemini fallback
    let analysisResult;
    try {
      // Prepare transaction summary for analysis
      const transactionSummary = transactions.map(t => ({
        date: t.date.toISOString().split('T')[0],
        type: t.type,
        amount: t.amount.toNumber(),
        category: t.category,
        description: t.description
      }));

      const prompt = `
You are a financial advisor analyzing a user's monthly transactions. Provide a comprehensive analysis with the following structure:

USER: ${userName}
MONTH: ${monthName}
TOTAL TRANSACTIONS: ${transactions.length}
TOTAL INCOME: $${stats.totalIncome.toFixed(2)}
TOTAL EXPENSES: $${stats.totalExpenses.toFixed(2)}
NET FLOW: $${(stats.totalIncome - stats.totalExpenses).toFixed(2)}

TRANSACTION DATA:
${JSON.stringify(transactionSummary, null, 2)}

CATEGORY BREAKDOWN:
${Object.entries(stats.byCategory).map(([category, amount]) => `${category}: $${amount.toFixed(2)}`).join('\n')}

Please provide a detailed analysis in the following JSON format:
{
  "insights": [
    "Key observation about spending patterns",
    "Another important insight",
    "Trends or notable findings"
  ],
  "recommendations": [
    "Specific advice to reduce expenses",
    "Budgeting suggestions",
    "Savings opportunities"
  ],
  "categoryAnalysis": {
    "highestSpending": "Category name and amount spent",
    "reducedCategories": ["Categories where spending decreased"],
    "increasedCategories": ["Categories where spending increased"],
    "concerningCategories": ["Categories that need attention"]
  },
  "spendingTrends": [
    "Weekly spending patterns",
    "Peak spending days/periods",
    "Recurring expense analysis"
  ]
}

Focus on:
- Which categories they spent the most in
- Categories where they reduced expenses vs increased
- Specific recommendations to reduce expenses
- Positive financial habits to maintain
- Areas of concern that need attention
`;

      const response = await completeWithDeepSeek(prompt, {
        temperature: 0.3,
        maxTokens: 2000
      });

      // Clean and parse the response - handle both direct JSON and code-block wrapped JSON
      let cleanedText = response.replace(/```(?:json)?\n?/g, "").trim();

      // Try to parse as JSON, if it fails, the response might be plain text that needs different handling
      try {
        analysisResult = JSON.parse(cleanedText);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the text
        console.warn("Direct JSON parsing failed, attempting to extract JSON from response");
        // Look for JSON-like content in the response
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analysisResult = JSON.parse(jsonMatch[0]);
          } catch (extractError) {
            throw new Error(`Failed to parse DeepSeek response as JSON: ${extractError.message}`);
          }
        } else {
          throw new Error(`DeepSeek response does not contain valid JSON: ${cleanedText.substring(0, 100)}...`);
        }
      }
    } catch (deepseekError) {
      console.warn("DeepSeek analysis failed, falling back to Gemini:", deepseekError.message);

      // Fallback to Gemini
      try {
        const model = getModel("gemini-2.5-flash"); // Try gemini-2.5-flash which might have different quota limits
        const transactionSummary = transactions.map(t => ({
          date: t.date.toISOString().split('T')[0],
          type: t.type,
          amount: t.amount.toNumber(),
          category: t.category,
          description: t.description
        }));

        const prompt = `
You are a financial advisor analyzing a user's monthly transactions. Provide a comprehensive analysis with the following structure:

USER: ${userName}
MONTH: ${monthName}
TOTAL TRANSACTIONS: ${transactions.length}
TOTAL INCOME: $${stats.totalIncome.toFixed(2)}
TOTAL EXPENSES: $${stats.totalExpenses.toFixed(2)}
NET FLOW: $${(stats.totalIncome - stats.totalExpenses).toFixed(2)}

TRANSACTION DATA:
${JSON.stringify(transactionSummary, null, 2)}

CATEGORY BREAKDOWN:
${Object.entries(stats.byCategory).map(([category, amount]) => `${category}: $${amount.toFixed(2)}`).join('\n')}

Please provide a detailed analysis in the following JSON format:
{
  "insights": [
    "Key observation about spending patterns",
    "Another important insight",
    "Trends or notable findings"
  ],
  "recommendations": [
    "Specific advice to reduce expenses",
    "Budgeting suggestions",
    "Savings opportunities"
  ],
  "categoryAnalysis": {
    "highestSpending": "Category name and amount spent",
    "reducedCategories": ["Categories where spending decreased"],
    "increasedCategories": ["Categories where spending increased"],
    "concerningCategories": ["Categories that need attention"]
  },
  "spendingTrends": [
    "Weekly spending patterns",
    "Peak spending days/periods",
    "Recurring expense analysis"
  ]
}

Focus on:
- Which categories they spent the most in
- Categories where they reduced expenses vs increased
- Specific recommendations to reduce expenses
- Positive financial habits to maintain
- Areas of concern that need attention
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        // Try to parse as JSON, if it fails, try to extract JSON from the text
        try {
          analysisResult = JSON.parse(cleanedText);
        } catch (parseError) {
          console.warn("Direct JSON parsing failed for Gemini, attempting to extract JSON from response");
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              analysisResult = JSON.parse(jsonMatch[0]);
            } catch (extractError) {
              throw new Error(`Failed to parse Gemini response as JSON: ${extractError.message}`);
            }
          } else {
            throw new Error(`Gemini response does not contain valid JSON: ${cleanedText.substring(0, 100)}...`);
          }
        }
      } catch (geminiError) {
        console.warn("Gemini analysis also failed:", geminiError.message);
        // Both APIs failed, return simplified analysis
        analysisResult = {
          insights: [
            `You spent $${stats.totalExpenses.toFixed(2)} this ${monthName}, with $${stats.totalIncome.toFixed(2)} in income.`,
            `Your highest expense category was ${Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0]?.[0] || 'uncategorized'}.`,
            "AI analysis is currently unavailable due to API issues."
          ],
          recommendations: [
            "Set up automatic savings transfers for 20% of your income.",
            "Review your subscriptions and cancel unused services.",
            "Create a budget for your highest spending categories.",
            "Consider meal planning to reduce food expenses.",
            "Track your expenses manually until AI analysis is restored."
          ],
          categoryAnalysis: {
            highestSpending: Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data available',
            reducedCategories: ["Analysis unavailable due to API limits"],
            increasedCategories: ["Analysis unavailable due to API limits"],
            concerningCategories: ["Please check your highest spending categories manually"]
          },
          spendingTrends: [
            "AI analysis temporarily unavailable.",
            "Please check your transaction history manually.",
            "Consider upgrading API plans for full analysis features."
          ]
        };
      }

    }

    return analysisResult;
  } catch (error) {
    console.error("Error generating comprehensive analysis:", error);

    // Handle specific quota/rate limit errors
    if (error.message?.includes('429') ||
        error.message?.includes('Too Many Requests') ||
        error.message?.includes('quota exceeded') ||
        error.message?.includes('rate limit')) {
      console.log("⚠️ Gemini API quota exceeded, using simplified analysis");

      // Return simplified analysis without AI
      return {
        insights: [
          `You spent $${stats.totalExpenses.toFixed(2)} this ${monthName}, with $${stats.totalIncome.toFixed(2)} in income.`,
          `Your highest expense category was ${Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0]?.[0] || 'uncategorized'}.`,
          "Consider tracking your daily expenses to identify spending patterns."
        ],
        recommendations: [
          "Set up automatic savings transfers for 20% of your income.",
          "Review your subscriptions and cancel unused services.",
          "Create a budget for your highest spending categories.",
          "Consider meal planning to reduce food expenses."
        ],
        categoryAnalysis: {
          highestSpending: Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data available',
          reducedCategories: ["Analysis unavailable due to API limits"],
          increasedCategories: ["Analysis unavailable due to API limits"],
          concerningCategories: ["Please check your highest spending categories manually"]
        },
        spendingTrends: [
          "API quota exceeded - manual review recommended.",
          "Consider upgrading your Gemini API plan for full analysis.",
          "Basic financial tracking is still available in your dashboard."
        ]
      };
    }

    // For other errors, return basic fallback
    return {
      insights: [
        `You spent $${stats.totalExpenses.toFixed(2)} this ${monthName}, with $${stats.totalIncome.toFixed(2)} in income.`,
        `Your highest expense category was ${Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0]?.[0] || 'uncategorized'}.`,
        "Consider tracking your daily expenses to identify spending patterns."
      ],
      recommendations: [
        "Set up automatic savings transfers for 20% of your income.",
        "Review your subscriptions and cancel unused services.",
        "Create a budget for your highest spending categories.",
        "Consider meal planning to reduce food expenses."
      ],
      categoryAnalysis: {
        highestSpending: Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data',
        reducedCategories: ["Compare with previous months to identify reductions"],
        increasedCategories: ["Compare with previous months to identify increases"],
        concerningCategories: ["High spending categories need review"]
      },
      spendingTrends: [
        "Monitor weekly spending patterns for better control.",
        "Identify peak spending days to plan accordingly.",
        "Track recurring expenses for budget planning."
      ]
    };
  }
}

async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    // Try to parse as JSON array, if it fails, try to extract JSON from the text
    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn("Direct JSON parsing failed for insights, attempting to extract JSON from response");
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (extractError) {
          console.error("Failed to parse insights response as JSON:", extractError.message);
          throw new Error(`Failed to parse insights response as JSON: ${extractError.message}`);
        }
      } else {
        throw new Error(`Insights response does not contain valid JSON array: ${cleanedText.substring(0, 100)}...`);
      }
    }
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

// Enhanced Monthly Report Generation with AI Analysis
export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports with AI Analysis",
  },
  [
    { cron: "0 0 1 * *" }, // First day of each month
    { event: "generate.monthly.report" } // Manual trigger from admin
  ],
  async ({ event, step }) => {
    console.log('🎯 [MONTHLY REPORTS] Function triggered', { eventName: event?.name, eventData: event?.data });

    // Check if this is a manual trigger for a specific user
    const isManualTrigger = event?.name === 'generate.monthly.report';
    const targetUserId = isManualTrigger ? event.data?.userId : null;

    let users;
    if (isManualTrigger && targetUserId) {
      // Manual trigger for specific user
      console.log('🎯 [MONTHLY REPORTS] Manual trigger for user:', targetUserId);
      users = await step.run("fetch-target-user", async () => {
        const user = await db.user.findUnique({
          where: { clerkUserId: targetUserId },
          include: { accounts: true },
        });
        return user ? [user] : [];
      });
    } else {
      // Cron trigger for all users
      console.log('🎯 [MONTHLY REPORTS] Cron trigger for all users');
      users = await step.run("fetch-users", async () => {
        return await db.user.findMany({
          include: { accounts: true },
        });
      });
    }

    console.log('🎯 [MONTHLY REPORTS] Found users:', users.length);

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        // Get detailed transaction data for AI analysis
        const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

        const transactions = await db.transaction.findMany({
          where: {
            userId: user.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            date: 'desc'
          }
        });

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        // Generate comprehensive AI analysis
        const aiAnalysis = await generateComprehensiveFinancialAnalysis(transactions, stats, monthName, user.name);

        console.log('📧 [MONTHLY REPORTS] Sending email to:', user.email, 'for month:', monthName);

        const emailResult = await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report & Analysis - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights: aiAnalysis.insights,
              recommendations: aiAnalysis.recommendations,
              categoryAnalysis: aiAnalysis.categoryAnalysis,
              spendingTrends: aiAnalysis.spendingTrends,
            },
          }),
        });

        if (emailResult.success) {
          console.log('✅ [MONTHLY REPORTS] Email sent successfully to:', user.email);
        } else {
          console.log('❌ [MONTHLY REPORTS] Failed to send email to:', user.email, 'Error:', emailResult.error);
        }
      });
    }

    return { processed: users.length };
  }
);

// 3. Budget Alerts with Event Batching
export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue; // Skip if no default account

      await step.run(`check-budget-${budget.id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1); // Start of current month

        // Calculate total expenses for the default account only
        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id, // Only consider default account
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed =
          budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

        // Only send alert if budget usage exceeds 90% and we haven't sent one in the last 24 hours
        const now = new Date();
        const lastAlertTime = budget.lastAlertSent;
        const hoursSinceLastAlert = lastAlertTime
          ? (now - lastAlertTime) / (1000 * 60 * 60)
          : 24; // If no previous alert, treat as 24 hours ago

        if (percentageUsed > 90 && hoursSinceLastAlert >= 24) {
          console.log('📧 [BUDGET ALERT] Sending alert to:', budget.user.email, 'percentage:', percentageUsed);

          const emailResult = await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: Number(budgetAmount).toFixed(1),
                totalExpenses: Number(totalExpenses).toFixed(1),
                accountName: defaultAccount.name,
              },
            }),
          });

          if (emailResult.success) {
            console.log('✅ [BUDGET ALERT] Email sent successfully to:', budget.user.email);

            // Update last alert sent timestamp
            await db.budget.update({
              where: { id: budget.id },
              data: { lastAlertSent: now },
            });
          } else {
            console.log('❌ [BUDGET ALERT] Failed to send email to:', budget.user.email, 'Error:', emailResult.error);
          }
        }
      });
    }
  }
);

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

// Utility functions
function isTransactionDue(transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  // Compare with nextDue date
  return nextDue <= today;
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}
