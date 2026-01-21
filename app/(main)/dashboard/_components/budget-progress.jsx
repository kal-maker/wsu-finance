"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X, Target, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useCurrency } from "@/context/currency-context";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateBudget } from "@/actions/budget";
import { cn } from "@/lib/utils";

export function BudgetProgress({ initialBudget, currentExpenses }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );
  const { currency, fmt } = useCurrency();

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  const remainingAmount = initialBudget ? initialBudget.amount - currentExpenses : 0;
  const dailyBudget = initialBudget ? remainingAmount / daysRemainingInMonth() : 0;

  function daysRemainingInMonth() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const remaining = lastDay.getDate() - now.getDate();
    return Math.max(remaining, 1);
  }

  const getBudgetStatus = () => {
    if (percentUsed >= 90) return { color: "red", label: "Over Budget", icon: TrendingDown };
    if (percentUsed >= 75) return { color: "amber", label: "Approaching", icon: TrendingUp };
    return { color: "green", label: "On Track", icon: Target };
  };

  const budgetStatus = getBudgetStatus();
  const StatusIcon = budgetStatus.icon;

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await updateBudgetFn(amount);
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  const getProgressColor = () => {
    if (percentUsed >= 90) return "from-red-500 via-red-400 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
    if (percentUsed >= 75) return "from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]";
    return "from-cyan-400 via-cyan-300 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]";
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-cyan-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-navy-800">Monthly Budget</h4>
              {initialBudget ? (
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1 text-sm">
                    <span className="text-red-600 font-semibold">{fmt(currentExpenses)}</span>
                    <span className="text-navy-600">of</span>
                    <span className="text-cyan-600 font-semibold">{fmt(initialBudget.amount)}</span>
                    <span className="text-navy-600">spent</span>
                  </div>
                  {remainingAmount > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-navy-600">
                      <span className="text-green-600 font-medium">{fmt(remainingAmount)} remaining</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{fmt(dailyBudget)}/day</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-navy-600">No budget set for this month</p>
              )}
            </div>

            {!isEditing ? (
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 font-semibold text-xs",
                    budgetStatus.color === "red" && "border-red-200 bg-red-50 text-red-700",
                    budgetStatus.color === "amber" && "border-amber-200 bg-amber-50 text-amber-700",
                    budgetStatus.color === "green" && "border-green-200 bg-green-50 text-green-700"
                  )}
                >
                  <StatusIcon className="h-3 w-3" />
                  {budgetStatus.label}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 px-3 border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  {initialBudget ? "Edit" : "Set"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpdateBudget}
                  disabled={isLoading}
                  className="h-8 px-2 border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-xs"
                >
                  <Check className="h-3 w-3" />
                  <span className="ml-1">Save</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="h-8 px-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs"
                >
                  <X className="h-3 w-3" />
                  <span className="ml-1">Cancel</span>
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 h-4 w-4" />
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="pl-9 pr-4 bg-white border-cyan-300 focus:border-cyan-500 h-9 text-sm"
                  placeholder="Enter budget amount"
                  autoFocus
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-navy-600">
                Enter your monthly budget amount in {currency}
              </p>
            </div>
          ) : initialBudget ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-navy-700">Budget Usage</span>
                <span className={cn(
                  "font-semibold",
                  percentUsed >= 90 ? "text-red-600" :
                    percentUsed >= 75 ? "text-amber-600" : "text-cyan-600"
                )}>
                  {percentUsed.toFixed(1)}%
                </span>
              </div>
              <div className="relative pt-2">
                <Progress
                  value={percentUsed}
                  className={cn(
                    "h-3 bg-navy-900/10 border border-navy-900/5 overflow-hidden",
                    percentUsed >= 90 && "bg-red-100/50",
                    percentUsed >= 75 && percentUsed < 90 && "bg-amber-100/50"
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-in-out bg-gradient-to-r relative",
                      getProgressColor()
                    )}
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  >
                    {/* Shiny highlight overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                    {/* Stripe pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(255,255,255,0.4)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.4)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />
                  </div>
                </Progress>

                {/* Glow effect matching the progress */}
                <div
                  className={cn(
                    "absolute top-2 left-0 h-3 blur-md opacity-30 transition-all duration-1000",
                    percentUsed >= 90 ? "bg-red-500" : percentUsed >= 75 ? "bg-amber-500" : "bg-cyan-500"
                  )}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>

              {/* Mobile Stats */}
              <div className="grid grid-cols-3 gap-2 sm:hidden">
                <div className="p-2 rounded-lg bg-red-50 text-center">
                  <div className="text-xs text-red-700 font-medium">Spent</div>
                  <div className="text-sm font-semibold text-gray-800">{fmt(currentExpenses)}</div>
                </div>
                <div className="p-2 rounded-lg bg-green-50 text-center">
                  <div className="text-xs text-green-700 font-medium">Remaining</div>
                  <div className="text-sm font-semibold text-gray-800">{fmt(remainingAmount)}</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 text-center">
                  <div className="text-xs text-blue-700 font-medium">Daily</div>
                  <div className="text-sm font-semibold text-gray-800">{fmt(dailyBudget)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-navy-600 mb-3">
                Set a monthly budget to track your spending
              </p>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm h-9 w-full"
              >
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Set Budget
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}