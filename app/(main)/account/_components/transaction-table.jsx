"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Download,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Filter,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { categoryColors } from "@/data/categories";
import { bulkDeleteTransactions } from "@/actions/account";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/context/currency-context";

const ITEMS_PER_PAGE = 10;

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const DATE_RANGES = {
  ALL: "all",
  THIS_MONTH: "this_month",
  LAST_MONTH: "last_month",
  LAST_3_MONTHS: "last_3_months",
};

// Client-side export function
const exportToCSV = (transactions, filename = 'transactions.csv') => {
  if (transactions.length === 0) {
    toast.error("No transactions to export");
    return;
  }

  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Recurring', 'Recurring Interval'];

  const csvRows = transactions.map(transaction => [
    format(new Date(transaction.date), 'yyyy-MM-dd'),
    `"${transaction.description.replace(/"/g, '""')}"`,
    transaction.category,
    transaction.type,
    transaction.amount.toFixed(2),
    transaction.isRecurring ? 'Yes' : 'No',
    transaction.isRecurring ? RECURRING_INTERVALS[transaction.recurringInterval] : 'N/A'
  ]);

  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export function TransactionTable({ transactions }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const [dateRange, setDateRange] = useState(DATE_RANGES.ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [exportLoading, setExportLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState(new Set());
  const router = useRouter();
  const { currency, fmt } = useCurrency();

  // Filter transactions by date range
  const filterByDateRange = useCallback((transactions, range) => {
    const now = new Date();

    switch (range) {
      case DATE_RANGES.THIS_MONTH:
        return transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startOfMonth(now) && transactionDate <= endOfMonth(now);
        });
      case DATE_RANGES.LAST_MONTH:
        const lastMonth = subMonths(now, 1);
        return transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startOfMonth(lastMonth) && transactionDate <= endOfMonth(lastMonth);
        });
      case DATE_RANGES.LAST_3_MONTHS:
        const threeMonthsAgo = subMonths(now, 3);
        return transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= threeMonthsAgo && transactionDate <= now;
        });
      default:
        return transactions;
    }
  }, []);

  // Memoized filtered and sorted transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let result = filterByDateRange(transactions, dateRange);

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.category?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (typeFilter) {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }

    // Apply recurring filter
    if (recurringFilter) {
      result = result.filter((transaction) => {
        if (recurringFilter === "recurring") return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig, dateRange, filterByDateRange]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const filtered = filteredAndSortedTransactions;
    const totalIncome = filtered
      .filter(t => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filtered
      .filter(t => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netAmount,
      transactionCount: filtered.length
    };
  }, [filteredAndSortedTransactions]);

  // Pagination calculations
  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / ITEMS_PER_PAGE
  );
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedTransactions, currentPage]);

  const handleSort = useCallback((field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleSelect = useCallback((id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((current) =>
      current.length === paginatedTransactions.length
        ? []
        : paginatedTransactions.map((t) => t.id)
    );
  }, [paginatedTransactions]);

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transactions?`
      )
    )
      return;

    deleteFn(selectedIds);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const transactionsToExport = selectedIds.length > 0
        ? transactions.filter(t => selectedIds.includes(t.id))
        : filteredAndSortedTransactions;

      const filename = selectedIds.length > 0
        ? `selected-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
        : `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;

      exportToCSV(transactionsToExport, filename);

      toast.success(`Exported ${transactionsToExport.length} transactions successfully!`);
    } catch (error) {
      toast.error("Failed to export transactions");
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const toggleColumnVisibility = useCallback((column) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.success("Transactions deleted successfully");
      setSelectedIds([]);
    }
  }, [deleted, deleteLoading]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setDateRange(DATE_RANGES.ALL);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    setSelectedIds([]);
  }, []);

  const getSortIcon = useCallback((field) => {
    if (sortConfig.field !== field) {
      return <ChevronDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  }, [sortConfig]);

  const hasActiveFilters = searchTerm || typeFilter || recurringFilter || dateRange !== DATE_RANGES.ALL;

  return (
    <div className="space-y-6">
      {/* Loading Bar */}
      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}

      {/* Enhanced Filters Section */}
      <Card className="bg-white/80 backdrop-blur-sm border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Main Filter Row */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions or categories..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "gap-2 border-navy-200 text-navy-700 hover:bg-navy-50 hover:text-navy-900 transition-all",
                    showFilters && "bg-navy-50 border-navy-300 shadow-inner"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>

                {/* View Mode Toggle */}
                <div className="flex border rounded-md bg-white/50 backdrop-blur-sm">
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "px-3 transition-all",
                      viewMode === "table" ? "bg-navy-800 hover:bg-navy-900 shadow-md" : "text-navy-600 hover:bg-navy-50"
                    )}
                  >
                    Table
                  </Button>
                  <Button
                    variant={viewMode === "card" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("card")}
                    className={cn(
                      "px-3 transition-all",
                      viewMode === "card" ? "bg-navy-800 hover:bg-navy-900 shadow-md" : "text-navy-600 hover:bg-navy-50"
                    )}
                  >
                    Cards
                  </Button>
                </div>

                {/* Export Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="gap-2 border-navy-200 text-navy-700 hover:bg-navy-50 hover:text-navy-900 transition-all"
                >
                  <Download className="h-4 w-4" />
                  {exportLoading ? "Exporting..." : "Export"}
                  {selectedIds.length > 0 && ` (${selectedIds.length})`}
                </Button>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2 bg-gradient-to-r from-red-600 to-red-700 border-red-700"
                  >
                    <Trash className="h-4 w-4" />
                    Delete ({selectedIds.length})
                  </Button>
                )}

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="gap-2 text-navy-500 hover:bg-navy-50 hover:text-navy-700 transition-all font-semibold"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="bg-white/50 backdrop-blur-sm">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        Income
                      </div>
                    </SelectItem>
                    <SelectItem value="EXPENSE">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-3 w-3 text-red-600" />
                        Expense
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={recurringFilter}
                  onValueChange={(value) => {
                    setRecurringFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="bg-white/50 backdrop-blur-sm">
                    <SelectValue placeholder="All Transactions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recurring">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3 text-purple-600" />
                        Recurring Only
                      </div>
                    </SelectItem>
                    <SelectItem value="non-recurring">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-gray-600" />
                        One-time Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={dateRange}
                  onValueChange={(value) => {
                    setDateRange(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="bg-white/50 backdrop-blur-sm">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DATE_RANGES.ALL}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-600" />
                        All Time
                      </div>
                    </SelectItem>
                    <SelectItem value={DATE_RANGES.THIS_MONTH}>
                      This Month
                    </SelectItem>
                    <SelectItem value={DATE_RANGES.LAST_MONTH}>
                      Last Month
                    </SelectItem>
                    <SelectItem value={DATE_RANGES.LAST_3_MONTHS}>
                      Last 3 Months
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Column Visibility Controls */}
      {viewMode === "table" && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground">Columns:</span>
          {['date', 'description', 'category', 'amount', 'recurring'].map(column => (
            <Button
              key={column}
              variant={hiddenColumns.has(column) ? "outline" : "default"}
              size="sm"
              onClick={() => toggleColumnVisibility(column)}
              className="gap-2 h-8"
            >
              {hiddenColumns.has(column) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {column.charAt(0).toUpperCase() + column.slice(1)}
            </Button>
          ))}
        </div>
      )}

      {/* Transactions Display */}
      {viewMode === "table" ? (
        /* Enhanced Table View */
        <Card className="rounded-2xl border border-navy-100 bg-white/90 backdrop-blur-md shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-navy-800 to-navy-900">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[50px] text-white">
                  <Checkbox
                    className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-navy-900"
                    checked={
                      selectedIds.length === paginatedTransactions.length &&
                      paginatedTransactions.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {!hiddenColumns.has('date') && (
                  <TableHead
                    className="cursor-pointer hover:bg-white/10 transition-colors text-white font-bold"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center group">
                      Date
                      {getSortIcon("date")}
                    </div>
                  </TableHead>
                )}
                {!hiddenColumns.has('description') && (
                  <TableHead
                    className="cursor-pointer hover:bg-white/10 transition-colors text-white font-bold"
                    onClick={() => handleSort("description")}
                  >
                    <div className="flex items-center group">
                      Description
                      {getSortIcon("description")}
                    </div>
                  </TableHead>
                )}
                {!hiddenColumns.has('category') && (
                  <TableHead
                    className="cursor-pointer hover:bg-white/10 transition-colors text-white font-bold"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center group">
                      Category
                      {getSortIcon("category")}
                    </div>
                  </TableHead>
                )}
                {!hiddenColumns.has('amount') && (
                  <TableHead
                    className="cursor-pointer text-right hover:bg-white/10 transition-colors text-white font-bold"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center justify-end group">
                      Amount
                      {getSortIcon("amount")}
                    </div>
                  </TableHead>
                )}
                {!hiddenColumns.has('recurring') && (
                  <TableHead className="text-white font-bold">Recurring</TableHead>
                )}
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7 - hiddenColumns.size}
                    className="text-center text-muted-foreground py-12"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-16 w-16 text-gray-300" />
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm text-muted-foreground">
                        {hasActiveFilters
                          ? "Try adjusting your search or filters"
                          : "Start by adding your first transaction"
                        }
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={handleClearFilters}>
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(transaction.id)}
                        onCheckedChange={() => handleSelect(transaction.id)}
                      />
                    </TableCell>
                    {!hiddenColumns.has('date') && (
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{format(new Date(transaction.date), "PP")}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(transaction.date), "p")}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    {!hiddenColumns.has('description') && (
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                      </TableCell>
                    )}
                    {!hiddenColumns.has('category') && (
                      <TableCell className="capitalize">
                        <Badge
                          variant="outline"
                          className="border-2 font-semibold px-3 py-1 text-xs"
                          style={{
                            borderColor: categoryColors[transaction.category] + '40',
                            backgroundColor: categoryColors[transaction.category] + '15',
                            color: categoryColors[transaction.category],
                          }}
                        >
                          {transaction.category}
                        </Badge>
                      </TableCell>
                    )}
                    {!hiddenColumns.has('amount') && (
                      <TableCell
                        className={cn(
                          "text-right font-semibold text-lg",
                          transaction.type === "EXPENSE"
                            ? "text-red-600"
                            : "text-green-600"
                        )}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {transaction.type === "EXPENSE" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          {transaction.type === "EXPENSE" ? "-" : "+"}{fmt(transaction.amount)}
                        </div>
                      </TableCell>
                    )}
                    {!hiddenColumns.has('recurring') && (
                      <TableCell>
                        {transaction.isRecurring ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge
                                  variant="secondary"
                                  className="gap-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border border-purple-200 hover:from-purple-200 hover:to-purple-300"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                  {
                                    RECURRING_INTERVALS[
                                    transaction.recurringInterval
                                    ]
                                  }
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <div className="font-medium">Next Date:</div>
                                  <div>
                                    {format(
                                      new Date(transaction.nextRecurringDate),
                                      "PPP"
                                    )}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge variant="outline" className="gap-1 bg-gray-50">
                            <Clock className="h-3 w-3" />
                            One-time
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/transaction/create?edit=${transaction.id}`
                              )
                            }
                            className="cursor-pointer"
                          >
                            Edit Transaction
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            onClick={() => deleteFn([transaction.id])}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Enhanced Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTransactions.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            paginatedTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="bg-white/80 backdrop-blur-sm rounded-lg border p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <CardContent className="p-0">
                  <div className="flex items-start justify-between mb-3">
                    <Checkbox
                      checked={selectedIds.includes(transaction.id)}
                      onCheckedChange={() => handleSelect(transaction.id)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/transaction/create?edit=${transaction.id}`
                            )
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteFn([transaction.id])}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg truncate flex-1 mr-2" title={transaction.description}>
                        {transaction.description}
                      </h3>
                      <div className={cn(
                        "text-lg font-bold",
                        transaction.type === "EXPENSE" ? "text-red-600" : "text-green-600"
                      )}>
                        {transaction.type === "EXPENSE" ? "-" : "+"}${transaction.amount.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{format(new Date(transaction.date), "PP")}</span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: categoryColors[transaction.category] + '40',
                          backgroundColor: categoryColors[transaction.category] + '15',
                          color: categoryColors[transaction.category],
                        }}
                      >
                        {transaction.category}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t">
                      {transaction.isRecurring ? (
                        <Badge className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200">
                          <RefreshCw className="h-3 w-3" />
                          {RECURRING_INTERVALS[transaction.recurringInterval]} •
                          Next: {format(new Date(transaction.nextRecurringDate), "MMM d")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          One-time
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedTransactions.length)} of{" "}
                {filteredAndSortedTransactions.length} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="hover:bg-navy-50 text-navy-600 border-navy-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          "w-10 h-10 transition-all",
                          currentPage === pageNum
                            ? "bg-navy-800 hover:bg-navy-900 shadow-md"
                            : "hover:bg-navy-50 text-navy-600 border-navy-100"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="hover:bg-navy-50 text-navy-600 border-navy-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}