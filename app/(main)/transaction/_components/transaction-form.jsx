"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useCurrency } from "@/context/currency-context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";
import { predictTransaction } from "@/actions/predict";

export function AddTransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}) {
  const { currency, fmt } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editMode && initialData
        ? {
          type: initialData.type,
          amount: initialData.amount.toString(),
          description: initialData.description,
          accountId: initialData.accountId,
          category: initialData.category,
          date: new Date(initialData.date),
          isRecurring: initialData.isRecurring,
          ...(initialData.recurringInterval && {
            recurringInterval: initialData.recurringInterval,
          }),
        }
        : {
          type: "EXPENSE",
          amount: "",
          description: "",
          accountId: accounts.find((ac) => ac.isDefault)?.id,
          date: new Date(),
          isRecurring: false,
        },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);
  // Auto-categorize when description changes (fully automatic, no explicit AI UI)
  const description = watch("description");
  useEffect(() => {
    const autoCategorize = async (text) => {
      if (!text || text.length < 3 || editMode) return;

      try {
        const result = await predictTransaction(text);

        if (result.success && result.data) {
          if (result.data.category) {
            const categoryMap = {
              food: 'food',
              transportation: 'transportation',
              shopping: 'shopping',
              entertainment: 'entertainment',
              bills: 'utilities',
              utilities: 'utilities',
              healthcare: 'healthcare',
              education: 'education',
              travel: 'travel',
              groceries: 'groceries',
              housing: 'housing',
              insurance: 'insurance',
              gifts: 'gifts',
              salary: 'salary',
              freelance: 'freelance',
              rental: 'rental',
              investments: 'investments',
              business: 'business',
              'other-income': 'other-income',
              'other-expense': 'other-expense',
            };

            const mappedName = categoryMap[result.data.category.toLowerCase()] || 'other-expense';

            const matchedCategory = categories.find(
              (c) => c.name.toLowerCase() === mappedName.toLowerCase()
            );

            if (matchedCategory) {
              setValue("category", matchedCategory.id);
            }
          }
          if (result.data.type) {
            setValue("type", result.data.type);
          }
        }
      } catch (error) {
        console.warn("Auto-categorization failed:", error);
      }
    };

    if (description && description.length > 5 && !editMode) {
      const delayDebounceFn = setTimeout(() => {
        autoCategorize(description);
      }, 800);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [description, editMode, setValue]);

  const onSubmit = (data) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
    };

    if (editMode) {
      transactionFn(editId, formData);
    } else {
      transactionFn(formData);
    }
  };

  // Auto-fill form with scanned receipt data
  // scannedData contains:
  const handleScanComplete = (scannedData) => {
    if (scannedData) {
      // Fill form fields from DeepSeek extraction
      setValue("amount", scannedData.amount.toString());
      setValue("date", new Date(scannedData.date));

      if (scannedData.description) {
        setValue("description", scannedData.description);
      }

      // Fill category and type from ML prediction (FastAPI or Gemini via backend)
      if (scannedData.category) {
        setValue("category", scannedData.category);
      }

      if (scannedData.type) {
        setValue("type", scannedData.type);
      }

      toast.success(`Receipt scanned successfully`);
    }
  };

  const handleManualCategorize = async () => {
    const currentDescription = getValues("description");
    if (!currentDescription) {
      toast.error("Please enter a description first");
      return;
    }

    await handleAutoCategorize(currentDescription);
  };

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully"
      );
      reset();
      setAiSuggestion(null);
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading, editMode, reset, router]);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const currentCategory = watch("category");

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Receipt Scanner - Only show in create mode */}
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      {/* Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-navy-700">Type</label>
        <Select
          onValueChange={(value) => setValue("type", value)}
          value={type}
        >
          <SelectTrigger className="border-cyan-200 focus:ring-cyan-500 focus:border-cyan-500">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE" className="text-navy-600 focus:text-navy-700">Expense</SelectItem>
            <SelectItem value="INCOME" className="text-cyan-600 focus:text-cyan-700">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* Amount and Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-navy-700">Amount ({currency})</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
            className="border-cyan-200 focus:ring-cyan-500 focus:border-cyan-500"
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-navy-700">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger className="border-cyan-200 focus:ring-cyan-500 focus:border-cyan-500">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id} className="text-navy-700">
                  {account.name} ({fmt(account.balance)})
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button
                  variant="ghost"
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-cyan-50 hover:text-cyan-700 text-navy-600"
                >
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-navy-700">Category</label>
        </div>

        <Select
          onValueChange={(value) => setValue("category", value)}
          value={currentCategory || undefined}
        >
          <SelectTrigger className="border-cyan-200 focus:ring-cyan-500 focus:border-cyan-500">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id} className="text-navy-700">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-navy-700">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-cyan-200" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => setValue("date", date)}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
              className="border-0"
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-navy-700">Description</label>
        <Input
          placeholder="Enter description (e.g., Coffee at Tomoca, Salary from work)"
          {...register("description")}
          className="border-cyan-200 focus:ring-cyan-500 focus:border-cyan-500"
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Recurring Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg border border-cyan-200 bg-cyan-50/50 p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium text-navy-700">Recurring Transaction</label>
          <div className="text-sm text-navy-600">
            Set up a recurring schedule for this transaction
          </div>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
          className="data-[state=checked]:bg-cyan-600"
        />
      </div>

      {/* Recurring Interval */}
      {isRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-navy-700">Recurring Interval</label>
          <Select
            onValueChange={(value) => setValue("recurringInterval", value)}
            defaultValue={getValues("recurringInterval")}
          >
            <SelectTrigger className="border-cyan-200 focus:ring-cyan-500 focus:border-cyan-500">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY" className="text-navy-700">Daily</SelectItem>
              <SelectItem value="WEEKLY" className="text-navy-700">Weekly</SelectItem>
              <SelectItem value="MONTHLY" className="text-navy-700">Monthly</SelectItem>
              <SelectItem value="YEARLY" className="text-navy-700">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full border-navy-300 text-navy-700 hover:bg-navy-50 hover:text-navy-800"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-600 to-navy-600 hover:from-cyan-700 hover:to-navy-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
          disabled={transactionLoading}
        >
          {transactionLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? "Updating..." : "Creating..."}
            </>
          ) : editMode ? (
            "Update Transaction"
          ) : (
            "Create Transaction"
          )}
        </Button>
      </div>
    </form>
  );
}