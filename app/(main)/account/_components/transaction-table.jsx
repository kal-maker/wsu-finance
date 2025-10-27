"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
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
import { cn } from "@/lib/utils";
import { categoryColors } from "@/data/categories";
import { bulkDeleteTransactions } from "@/actions/account";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { useRouter } from "next/navigation";

const ITEMS_PER_PAGE = 10;

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

// Client-side export function
const exportToCSV = (transactions, filename = 'transactions.csv') => {
  if (transactions.length === 0) {
    toast.error("No transactions to export");
    return;
  }

  // CSV headers
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Recurring', 'Recurring Interval'];
  
  // Convert transactions to CSV rows
  const csvRows = transactions.map(transaction => [
    format(new Date(transaction.date), 'yyyy-MM-dd'),
    `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes in description
    transaction.category,
    transaction.type,
    transaction.amount.toFixed(2),
    transaction.isRecurring ? 'Yes' : 'No',
    transaction.isRecurring ? RECURRING_INTERVALS[transaction.recurringInterval] : 'N/A'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // Create and download the file
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
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("table");
  const [exportLoading, setExportLoading] = useState(false);
  const router = useRouter();

  // Memoized filtered and sorted transactions - MOVED THIS FIRST
  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

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
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  // Calculate summary stats - NOW THIS COMES AFTER filteredAndSortedTransactions is defined
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

  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === paginatedTransactions.length
        ? []
        : paginatedTransactions.map((t) => t.id)
    );
  };

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
      // Export either selected transactions or all filtered transactions
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

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.success("Transactions deleted successfully");
      setSelectedIds([]);
    }
  }, [deleted, deleteLoading]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedIds([]);
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) {
      return <ChevronDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Income</p>
              <p className="text-2xl font-bold text-blue-900">
                ${summaryStats.totalIncome.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900">
                ${summaryStats.totalExpenses.toFixed(2)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className={cn(
          "bg-gradient-to-br p-4 rounded-lg border",
          summaryStats.netAmount >= 0 
            ? "from-green-50 to-green-100" 
            : "from-orange-50 to-orange-100"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Net Amount</p>
              <p className={cn(
                "text-2xl font-bold",
                summaryStats.netAmount >= 0 ? "text-green-900" : "text-orange-900"
              )}>
                {summaryStats.netAmount >= 0 ? "+" : "-"}${Math.abs(summaryStats.netAmount).toFixed(2)}
              </p>
            </div>
            <Sparkles className={cn(
              "h-8 w-8",
              summaryStats.netAmount >= 0 ? "text-green-600" : "text-orange-600"
            )} />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Transactions</p>
              <p className="text-2xl font-bold text-purple-900">
                {summaryStats.transactionCount}
              </p>
            </div>
            <RefreshCw className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Loading Bar */}
      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}

      {/* Enhanced Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border p-4 shadow-sm">
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
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] bg-white/50 backdrop-blur-sm">
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
              <SelectTrigger className="w-[160px] bg-white/50 backdrop-blur-sm">
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

            {/* View Mode Toggle */}
            <div className="flex border rounded-md bg-white/50 backdrop-blur-sm">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="px-3"
              >
                Table
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("card")}
                className="px-3"
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
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? "Exporting..." : "Export"}
              {selectedIds.length > 0 && ` (${selectedIds.length})`}
            </Button>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="bg-gradient-to-r from-red-600 to-red-700 border-red-700"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete ({selectedIds.length})
              </Button>
            )}

            {/* Clear Filters */}
            {(searchTerm || typeFilter || recurringFilter) && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearFilters}
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Display */}
      {viewMode === "table" ? (
        /* Enhanced Table View */
        <div className="rounded-lg border bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedIds.length === paginatedTransactions.length &&
                      paginatedTransactions.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100/50 transition-colors"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center group">
                    Date
                    {getSortIcon("date")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100/50 transition-colors"
                  onClick={() => handleSort("description")}
                >
                  <div className="flex items-center group">
                    Description
                    {getSortIcon("description")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-100/50 transition-colors"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center group">
                    Category
                    {getSortIcon("category")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right hover:bg-gray-100/50 transition-colors"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end group">
                    Amount
                    {getSortIcon("amount")}
                  </div>
                </TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-12 w-12 text-gray-300" />
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
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
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{format(new Date(transaction.date), "PP")}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), "p")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </TableCell>
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
                        {transaction.type === "EXPENSE" ? "-" : "+"}$
                        {transaction.amount.toFixed(2)}
                      </div>
                    </TableCell>
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
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTransactions.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            paginatedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white/80 backdrop-blur-sm rounded-lg border p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
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
              </div>
            ))
          )}
        </div>
      )}

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
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
              className="hover:bg-gray-100"
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
                    className="w-10 h-10 hover:bg-gray-100"
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
              className="hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}