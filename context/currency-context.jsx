"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext({
    currency: "ETB",
    fmt: (amount) => `ETB ${amount}`,
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children, initialCurrency = "ETB" }) => {
    const [currency, setCurrency] = useState(initialCurrency);

    const getSymbol = (curr) => {
        switch (curr) {
            case "USD": return "$";
            case "EUR": return "€";
            case "GBP": return "£";
            case "JPY": return "¥";
            case "ETB": return "ETB";
            default: return curr;
        }
    };

    const fmt = (amount) => {
        const symbol = getSymbol(currency);
        const num = parseFloat(amount);
        if (isNaN(num)) return `${symbol} 0.00`;
        return `${symbol} ${num.toFixed(2)}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, fmt, getSymbol }}>
            {children}
        </CurrencyContext.Provider>
    );
};
