package com.example.wsu_finance.models;

import java.io.Serializable;

public class Transaction implements Serializable {
    private String id;
    private double amount;
    private String description;
    private String date;
    private String category;
    private String type; // INCOME, EXPENSE
    private String status;
    private String accountId;

    public String getId() { return id; }
    public double getAmount() { return amount; }
    public String getDescription() { return description; }
    public String getDate() { return date; }
    public String getCategory() { return category; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public String getAccountId() { return accountId; }
}
