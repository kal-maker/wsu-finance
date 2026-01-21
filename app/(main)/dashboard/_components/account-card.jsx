"use client";

import { useCurrency } from "@/context/currency-context";
import { ArrowUpRight, ArrowDownRight, CreditCard, Wallet, Building, Landmark, Crown, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCOUNT_ICONS = {
  checking: CreditCard,
  savings: Wallet,
  credit: Landmark,
  investment: Building,
  cash: Wallet,
  default: CreditCard,
};

const ACCOUNT_COLORS = {
  checking: "from-cyan-500 to-navy-500",
  savings: "from-cyan-400 to-navy-400",
  credit: "from-cyan-600 to-navy-600",
  investment: "from-cyan-300 to-navy-300",
  cash: "from-cyan-200 to-navy-200",
  default: "from-cyan-500 to-navy-500",
};

const ACCOUNT_BG_COLORS = {
  checking: "bg-gradient-to-br from-cyan-50 to-navy-50",
  savings: "bg-gradient-to-br from-cyan-100 to-navy-100",
  credit: "bg-gradient-to-br from-cyan-50 to-navy-50",
  investment: "bg-gradient-to-br from-cyan-100 to-navy-100",
  cash: "bg-gradient-to-br from-cyan-50 to-navy-50",
  default: "bg-gradient-to-br from-cyan-50 to-navy-50",
};

const ACCOUNT_ICON_COLORS = {
  checking: "text-cyan-600",
  savings: "text-cyan-600",
  credit: "text-navy-600",
  investment: "text-cyan-600",
  cash: "text-navy-600",
  default: "text-cyan-600",
};

export function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const AccountIcon = ACCOUNT_ICONS[type.toLowerCase()] || ACCOUNT_ICONS.default;
  const accountColor = ACCOUNT_COLORS[type.toLowerCase()] || ACCOUNT_COLORS.default;
  const accountBgColor = ACCOUNT_BG_COLORS[type.toLowerCase()] || ACCOUNT_BG_COLORS.default;
  const accountIconColor = ACCOUNT_ICON_COLORS[type.toLowerCase()] || ACCOUNT_ICON_COLORS.default;

  const handleDefaultChange = async (event) => {
    event.preventDefault(); // Prevent navigation

    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return; // Don't allow toggling off the default account
    }

    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  const { fmt, getSymbol, currency } = useCurrency();

  const formatBalance = (balance) => {
    const numBalance = parseFloat(balance);
    if (numBalance >= 1000000) {
      const symbol = getSymbol(currency);
      return `${symbol} ${(numBalance / 1000000).toFixed(1)}M`;
    } else if (numBalance >= 1000) {
      const symbol = getSymbol(currency);
      return `${symbol} ${(numBalance / 1000).toFixed(1)}K`;
    }
    return fmt(numBalance);
  };

  const getBalanceColor = (balance) => {
    const numBalance = parseFloat(balance);
    if (numBalance < 0) return "text-red-600";
    if (numBalance === 0) return "text-navy-600";
    return "text-navy-900";
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 group",
      "w-full max-w-full", // Ensure full width on mobile
      accountBgColor,
      isDefault && "ring-2 ring-cyan-500/50"
    )}>
      {/* Animated Background Elements - Reduced size for mobile */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-50" />
      <div className="absolute -top-8 -right-8 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl" />
      <div className="absolute -bottom-8 -left-8 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-lg" />

      {/* Default Account Crown Badge - Responsive positioning */}
      {isDefault && (
        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 z-10">
          <Badge className="bg-gradient-to-r from-cyan-600 to-navy-600 text-white border-0 shadow-lg shadow-cyan-500/25 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs gap-0.5 sm:gap-1">
            <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="hidden xs:inline">Default</span>
          </Badge>
        </div>
      )}

      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-col xs:flex-row items-start xs:items-center justify-between space-y-3 xs:space-y-0 pb-3 relative z-10 px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-3 w-full xs:w-auto">
            <div className={cn(
              "p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm flex-shrink-0",
              isDefault && "shadow-cyan-500/25"
            )}>
              <AccountIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", accountIconColor)} />
            </div>
            <div className="min-w-0 flex-1"> {/* Added flex-1 and min-w-0 for truncation */}
              <CardTitle className="text-sm sm:text-base font-semibold text-navy-800 group-hover:text-navy-900 transition-colors truncate">
                {name}
              </CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] sm:text-xs capitalize mt-1 border-1 sm:border-2 font-medium w-fit",
                  type.toLowerCase() === 'checking' && "border-cyan-200 bg-cyan-50 text-cyan-700",
                  type.toLowerCase() === 'savings' && "border-cyan-300 bg-cyan-100 text-cyan-800",
                  type.toLowerCase() === 'credit' && "border-navy-200 bg-navy-50 text-navy-700",
                  type.toLowerCase() === 'investment' && "border-cyan-400 bg-cyan-200 text-cyan-900",
                  type.toLowerCase() === 'cash' && "border-navy-300 bg-navy-100 text-navy-800"
                )}
              >
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col items-start xs:items-end gap-2 w-full xs:w-auto mt-2 xs:mt-0">
            <div className={cn(
              "flex items-center justify-between xs:justify-end w-full xs:w-auto gap-1 sm:gap-2 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full border",
              isDefault
                ? "bg-cyan-100 text-cyan-700 border-cyan-200"
                : "bg-navy-100 text-navy-600 border-navy-200"
            )}>
              <span className="xs:hidden">Default:</span>
              <span className="hidden xs:inline">{isDefault ? "Default" : "Make Default"}</span>
              <Switch
                checked={isDefault}
                onClick={handleDefaultChange}
                disabled={updateDefaultLoading || isDefault}
                className={cn(
                  "h-3 w-6 sm:h-4 sm:w-7",
                  "data-[state=checked]:bg-cyan-600 data-[state=unchecked]:bg-navy-300",
                  isDefault && "opacity-100"
                )}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pb-4 px-4 sm:px-6">
          <div className="space-y-3">
            <div className={cn(
              "text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 break-words",
              getBalanceColor(balance),
              parseFloat(balance) > 0 && "group-hover:scale-105"
            )}>
              {formatBalance(balance)}
            </div>

            {/* Balance Indicator Bar */}
            <div className="w-full bg-navy-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r",
                  accountColor
                )}
                style={{
                  width: `${Math.min(Math.max(parseFloat(balance) / 10000 * 100, 5), 100)}%`
                }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="relative z-10 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 sm:gap-0 text-sm pt-4 border-t border-white/50 px-4 sm:px-6">
          <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50 w-full xs:w-auto justify-center">
            <div className="flex items-center text-cyan-600 font-medium">
              <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-[10px] sm:text-xs">Income</span>
            </div>
            <div className="w-px h-3 sm:h-4 bg-navy-300" />
            <div className="flex items-center text-navy-600 font-medium">
              <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="text-[10px] sm:text-xs">Expense</span>
            </div>
          </div>

          {/* View Details CTA */}
          <div className={cn(
            "flex items-center justify-center gap-1 text-xs font-medium px-3 py-1.5 sm:py-2 rounded-full transition-all duration-300 w-full xs:w-auto",
            isDefault
              ? "bg-gradient-to-r from-cyan-600 to-navy-600 text-white shadow-lg shadow-cyan-500/25"
              : "bg-white/80 text-navy-700 border border-white/50 backdrop-blur-sm hover:bg-cyan-50 hover:text-cyan-700"
          )}>
            <span className="text-[10px] sm:text-xs">View Details</span>
            <Sparkles className={cn(
              "h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform duration-300 group-hover:scale-110",
              isDefault ? "text-white" : "text-cyan-600"
            )} />
          </div>
        </CardFooter>
      </Link>

      {/* Loading Overlay */}
      {updateDefaultLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg">
          <div className="flex items-center gap-2 text-cyan-600">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-2 border-cyan-600 border-t-transparent" />
            <span className="text-xs sm:text-sm font-medium">Updating...</span>
          </div>
        </div>
      )}
    </Card>
  );
}