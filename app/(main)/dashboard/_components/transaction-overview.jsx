"use client";

import { useState, useMemo, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, CreditCard, Wallet } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";

const CYAN_NAVY_THEME_COLORS = [
  "#06B6D4", // cyan-500
  "#0EA5E9", // navy-500
  "#0284C7", // navy-600
  "#00A0B4", // cyan-600
  "#0369A1", // navy-700
  "#008494", // cyan-700
  "#075985", // navy-800
  "#006874", // cyan-800
  "#0C4A6E", // navy-900
  "#004D54", // cyan-900
];

const DATE_RANGES = {
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
  LAST_3_MONTHS: "last_3_months",
  ALL_TIME: "all_time",
};

export function DashboardOverview({ accounts, transactions }) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id
  );
  const { fmt } = useCurrency();
  const [dateRange, setDateRange] = useState(DATE_RANGES.THIS_MONTH);
  const [chartType, setChartType] = useState("pie");
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter transactions based on selected account and date range
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter((t) => t.accountId === selectedAccountId);

    const now = new Date();

    switch (dateRange) {
      case DATE_RANGES.THIS_MONTH:
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startOfMonth(now) && transactionDate <= endOfMonth(now);
        });
        break;
      case DATE_RANGES.LAST_MONTH:
        const lastMonth = subMonths(now, 1);
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startOfMonth(lastMonth) && transactionDate <= endOfMonth(lastMonth);
        });
        break;
      case DATE_RANGES.LAST_3_MONTHS:
        const threeMonthsAgo = subMonths(now, 3);
        filtered = filtered.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= threeMonthsAgo && transactionDate <= now;
        });
        break;
      default:
        // All time - no date filtering
        break;
    }

    return filtered;
  }, [transactions, selectedAccountId, dateRange]);

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const net = income - expenses;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;

    return {
      income,
      expenses,
      net,
      savingsRate,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() =>
    filteredTransactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5),
    [filteredTransactions]
  );

  // Calculate expense breakdown
  const expenseData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === "EXPENSE");

    // Group by category for pie/bar chart
    const byCategory = expenses.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {});

    // Format for charts
    const chartData = Object.entries(byCategory).map(
      ([category, amount], index) => ({
        name: category,
        value: amount,
        amount: amount,
        fill: CYAN_NAVY_THEME_COLORS[index % CYAN_NAVY_THEME_COLORS.length],
      })
    );

    return chartData.sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Monthly trend data for bar chart
  const monthlyTrendData = useMemo(() => {
    const monthlyData = {};

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = format(date, 'MMM yyyy');

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, month: monthKey };
      }

      if (transaction.type === "INCOME") {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6); // Last 6 months
  }, [filteredTransactions]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-cyan-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-cyan-600">
            {fmt(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getDateRangeLabel = (range) => {
    switch (range) {
      case DATE_RANGES.THIS_MONTH: return "This Month";
      case DATE_RANGES.LAST_MONTH: return "Last Month";
      case DATE_RANGES.LAST_3_MONTHS: return "Last 3 Months";
      case DATE_RANGES.ALL_TIME: return "All Time";
      default: return range;
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-2 xs:grid-cols-2 xs:gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 shadow-sm">
          <CardContent className="p-2 xs:p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] xs:text-xs sm:text-sm font-medium text-cyan-700 truncate">Income</p>
                <p className="text-sm xs:text-lg sm:text-x font-bold text-cyan-900 truncate">
                  {fmt(financialMetrics.income)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 xs:h-6 sm:h-8 sm:w-8 text-cyan-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-navy-50 to-navy-100 border-navy-200 shadow-sm">
          <CardContent className="p-2 xs:p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] xs:text-xs sm:text-sm font-medium text-navy-700 truncate">Expenses</p>
                <p className="text-sm xs:text-lg sm:text-xl font-bold text-navy-900 truncate">
                  {fmt(financialMetrics.expenses)}
                </p>
              </div>
              <TrendingDown className="h-5 w-5 xs:h-6 sm:h-8 sm:w-8 text-navy-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border shadow-sm",
          financialMetrics.net >= 0
            ? "bg-gradient-to-br from-cyan-50 to-green-50 border-cyan-200"
            : "bg-gradient-to-br from-navy-50 to-orange-50 border-navy-200"
        )}>
          <CardContent className="p-2 xs:p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 truncate">Net</p>
                <p className={cn(
                  "text-sm xs:text-lg sm:text-xl font-bold truncate",
                  financialMetrics.net >= 0 ? "text-cyan-900" : "text-navy-900"
                )}>
                  {financialMetrics.net >= 0 ? "+" : "-"}{fmt(Math.abs(financialMetrics.net))}
                </p>
              </div>
              <Wallet className={cn(
                "h-5 w-5 xs:h-6 sm:h-8 sm:w-8 flex-shrink-0",
                financialMetrics.net >= 0 ? "text-cyan-600" : "text-navy-600"
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-navy-50 border-cyan-200 shadow-sm">
          <CardContent className="p-2 xs:p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] xs:text-xs sm:text-sm font-medium text-navy-700 truncate">Savings</p>
                <p className="text-sm xs:text-lg sm:text-xl font-bold text-cyan-900 truncate">
                  {financialMetrics.savingsRate.toFixed(0)}%
                </p>
              </div>
              <CreditCard className="h-5 w-5 xs:h-6 sm:h-8 sm:w-8 text-cyan-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions Card */}
        <Card className="bg-white/80 backdrop-blur-sm border border-cyan-200 shadow-sm">
          <CardHeader className="flex flex-col xs:flex-row items-start xs:items-center justify-between space-y-3 xs:space-y-0 pb-4 px-4 xs:px-6 pt-4">
            <CardTitle className="text-base xs:text-lg font-semibold bg-gradient-to-r from-cyan-600 to-navy-600 bg-clip-text text-transparent">
              Recent Transactions
            </CardTitle>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full xs:w-auto">
              <Select
                value={dateRange}
                onValueChange={setDateRange}
              >
                <SelectTrigger className="w-[140px] bg-white/50 border-cyan-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DATE_RANGES).map(([key, value]) => (
                    <SelectItem key={key} value={value}>
                      {getDateRangeLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="w-full xs:w-[130px] h-9 bg-white/50 border-cyan-200 text-xs xs:text-sm">
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-4 xs:px-6 pb-4">
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No transactions found</p>
                  <p className="text-xs text-gray-500">Try selecting a different date range</p>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-cyan-100 bg-white/50 hover:bg-cyan-50/50 transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {transaction.description || "Untitled Transaction"}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), "MMM d, yyyy")}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs capitalize border-cyan-200 bg-cyan-50 text-cyan-700"
                        >
                          {transaction.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex items-center font-semibold",
                          transaction.type === "EXPENSE"
                            ? "text-navy-600"
                            : "text-cyan-600"
                        )}
                      >
                        {transaction.type === "EXPENSE" ? (
                          <ArrowDownRight className="mr-1 h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="mr-1 h-4 w-4" />
                        )}
                        {fmt(transaction.amount)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Analysis Card */}
        <Card className="bg-white/80 backdrop-blur-sm border border-cyan-200 shadow-sm">
          <CardHeader className="flex flex-col xs:flex-row items-start xs:items-center justify-between space-y-3 xs:space-y-0 pb-4 px-4 xs:px-6 pt-4">
            <CardTitle className="text-base xs:text-lg font-semibold bg-gradient-to-r from-cyan-600 to-navy-600 bg-clip-text text-transparent">
              {chartType === "pie" ? "Expense Breakdown" : "Monthly Trends"}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Mobile: Dropdown for chart type */}
              <div className="xs:hidden">
                <Select value={chartType} onValueChange={setChartType}>
                  <SelectTrigger className="w-[90px] h-8 border-cyan-200 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pie" className="text-xs">Pie</SelectItem>
                    <SelectItem value="bar" className="text-xs">Trends</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop/Tablet: Buttons for chart type */}
              <div className="hidden xs:flex items-center gap-1.5">
                <Button
                  variant={chartType === "pie" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("pie")}
                  className={cn(
                    "h-8 px-3 transition-all duration-300",
                    chartType === "pie"
                      ? "bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
                      : "border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                  )}
                >
                  Pie
                </Button>
                <Button
                  variant={chartType === "bar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("bar")}
                  className={cn(
                    "h-8 px-3 transition-all duration-300",
                    chartType === "bar"
                      ? "bg-navy-600 hover:bg-navy-700 text-white shadow-sm"
                      : "border-navy-200 text-navy-700 hover:bg-navy-50"
                  )}
                >
                  Trends
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-4 xs:pb-6">
            {expenseData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 xs:py-12">
                <TrendingUp className="h-12 w-12 xs:h-16 xs:w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-xs xs:text-sm">No expense data available</p>
                <p className="text-[10px] xs:text-xs text-gray-500">Try selecting a different date range</p>
              </div>
            ) : chartType === "pie" ? (
              <div className="h-[240px] xs:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      outerRadius={windowWidth < 480 ? 60 : 80}
                      innerRadius={windowWidth < 480 ? 30 : 40}
                      paddingAngle={2}
                      dataKey="value"
                      label={windowWidth < 480 ? false : ({ name, value }) => `${name}: ${fmt(value)}`}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      layout={windowWidth < 480 ? "horizontal" : "vertical"}
                      verticalAlign={windowWidth < 480 ? "bottom" : "middle"}
                      align={windowWidth < 480 ? "center" : "right"}
                      wrapperStyle={{
                        paddingTop: windowWidth < 480 ? "10px" : "0",
                        fontSize: "10px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] xs:h-[300px] px-2 xs:px-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
                    <XAxis
                      dataKey="month"
                      fontSize={12}
                      tick={{ fill: '#64748b' }}
                    />
                    <YAxis
                      fontSize={12}
                      tick={{ fill: '#64748b' }}
                      tickFormatter={(value) => fmt(value)}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
                    />
                    <Bar
                      dataKey="income"
                      name="Income"
                      fill="#262473ff" // cyan-500
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#0C4A6E" // navy-900
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}