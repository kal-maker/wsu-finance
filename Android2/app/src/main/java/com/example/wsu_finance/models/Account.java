package com.example.wsu_finance.models;

import java.io.Serializable;

public class Account implements Serializable {
    private String id;
    private String name;
    private String type;
    private double balance;
    private boolean isDefault;

    public String getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public double getBalance() { return balance; }
    public boolean isDefault() { return isDefault; }
}
