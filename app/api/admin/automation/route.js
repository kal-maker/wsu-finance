// app/api/admin/automation/route.js
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { inngest } from '@/lib/inngest/client';
import { sendEmail } from '@/actions/send-email';
import EmailTemplate from '@/emails/template';
import { triggerRecurringTransaction } from '@/lib/inngest/functions';

export async function POST(request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Ensure caller is an admin
    const dbUser = await db.user.findFirst({
      where: { clerkUserId: user.id },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { action } = await request.json();
    const eventIdBase = `admin-${action || 'unknown'}-${Date.now()}`;

    switch (action) {
      case 'budget-alerts': {
        const result = await triggerBudgetAlerts();
        return NextResponse.json({
          success: true,
          eventId: eventIdBase,
          details: result,
        });
      }

      case 'trigger-monthly-report': {
        const result = await triggerMonthlyReport();
        return NextResponse.json({
          success: true,
          eventId: eventIdBase,
          details: result,
        });
      }

      case 'trigger-recurring-transaction': {
        const result = await triggerRecurringTransaction();
        return NextResponse.json({
          success: true,
          eventId: eventIdBase,
          details: result,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown automation action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ [ADMIN AUTOMATION] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Automation failed' },
      { status: 500 }
    );
  }
}

// ---- Helpers ----

// 1) Trigger budget alerts immediately (similar to Inngest checkBudgetAlerts)
async function triggerBudgetAlerts() {
  console.log('🎯 [ADMIN BUDGET ALERTS] Starting manual budget alerts trigger');

  const budgets = await db.budget.findMany({
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

  console.log('🎯 [ADMIN BUDGET ALERTS] Found budgets:', budgets.length);

  let emailsSent = 0;
  let failedEmails = 0;

  for (const budget of budgets) {
    const defaultAccount = budget.user.accounts[0];
    if (!defaultAccount) continue;

    const startDate = new Date();
    startDate.setDate(1); // start of current month

    const expenses = await db.transaction.aggregate({
      where: {
        userId: budget.userId,
        accountId: defaultAccount.id,
        type: 'EXPENSE',
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

    // Send a budget alert email
    console.log('📧 [ADMIN BUDGET ALERTS] Sending alert to:', budget.user.email, 'percentage:', percentageUsed);

    const emailResult = await sendEmail({
      to: budget.user.email,
      subject: `Budget Alert for ${defaultAccount.name}`,
      react: EmailTemplate({
        userName: budget.user.name,
        type: 'budget-alert',
        data: {
          percentageUsed,
          budgetAmount: Number(budgetAmount).toFixed(1),
          totalExpenses: Number(totalExpenses).toFixed(1),
          accountName: defaultAccount.name,
        },
      }),
    });

    if (emailResult.success) {
      console.log('✅ [ADMIN BUDGET ALERTS] Email sent successfully to:', budget.user.email);
      emailsSent++;
    } else {
      console.log('❌ [ADMIN BUDGET ALERTS] Failed to send email to:', budget.user.email, 'Error:', emailResult.error);
      failedEmails++;
    }

    // Update last alert sent
    await db.budget.update({
      where: { id: budget.id },
      data: { lastAlertSent: new Date() },
    });
  }

  return {
    budgetsChecked: budgets.length,
    emailsSent,
    failedEmails,
  };
}

// 2) Trigger monthly report generation via Inngest events
async function triggerMonthlyReport() {
  console.log('🎯 [ADMIN MONTHLY REPORTS] Starting manual monthly reports trigger');

  // Get all users
  const users = await db.user.findMany({
    select: { id: true, clerkUserId: true }
  });

  console.log('🎯 [ADMIN MONTHLY REPORTS] Found users:', users.length);

  if (!users.length) {
    return { triggered: 0, message: 'No users found' };
  }

  // Send events to trigger monthly reports for all users
  const events = users.map((user) => ({
    name: 'generate.monthly.report',
    data: {
      userId: user.clerkUserId,
      timestamp: new Date().toISOString()
    },
  }));

  console.log('📤 [ADMIN AUTOMATION] Sending monthly report events:', events.length, 'events');
  await inngest.send(events);
  console.log('✅ [ADMIN AUTOMATION] Monthly report events sent successfully');

  return {
    triggered: users.length,
    message: `Triggered monthly report generation for ${users.length} users`
  };
}


