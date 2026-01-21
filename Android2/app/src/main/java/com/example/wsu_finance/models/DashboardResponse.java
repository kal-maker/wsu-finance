package com.example.wsu_finance.models;

import java.util.List;

public class DashboardResponse {
    private double totalBalance;
    private double monthlySpend;
    private List<Transaction> recentTransactions;
    private List<Account> accounts;

    public double getTotalBalance() { return totalBalance; }
    public double getMonthlySpend() { return monthlySpend; }
    public List<Transaction> getRecentTransactions() { return recentTransactions; }
    public List<Account> getAccounts() { return accounts; }
}
