"use client";

import { useCurrency } from "@/context/currency-context";

export function AccountBalance({ balance }) {
    const { fmt } = useCurrency();

    return (
        <div className="text-xl sm:text-2xl font-bold text-navy-900">
            {fmt(parseFloat(balance))}
        </div>
    );
}
