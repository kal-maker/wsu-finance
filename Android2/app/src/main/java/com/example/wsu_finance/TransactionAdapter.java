package com.example.wsu_finance;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.wsu_finance.models.Transaction;

import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class TransactionAdapter extends RecyclerView.Adapter<TransactionAdapter.ViewHolder> {

    private List<Transaction> transactions = new ArrayList<>();

    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_transaction, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Transaction transaction = transactions.get(position);
        holder.bind(transaction);
    }

    @Override
    public int getItemCount() {
        return transactions.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvDescription, tvDate, tvCategory, tvAmount;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvDescription = itemView.findViewById(R.id.tvDescription);
            tvDate = itemView.findViewById(R.id.tvDate);
            tvCategory = itemView.findViewById(R.id.tvCategory);
            tvAmount = itemView.findViewById(R.id.tvAmount);
        }

        public void bind(Transaction transaction) {
            tvDescription.setText(transaction.getDescription());
            tvCategory.setText(transaction.getCategory());

            // Format Amount
            NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);
            String formattedAmount = currencyFormat.format(transaction.getAmount());
            
            if ("EXPENSE".equalsIgnoreCase(transaction.getType())) {
                tvAmount.setText("- " + formattedAmount);
                tvAmount.setTextColor(itemView.getContext().getResources().getColor(android.R.color.holo_red_dark));
            } else {
                tvAmount.setText("+ " + formattedAmount);
                tvAmount.setTextColor(itemView.getContext().getResources().getColor(android.R.color.holo_green_dark));
            }

            // Format Date
            try {
                // Assuming date comes as ISO string or similar. Ideally parse correctly.
                // Simple placeholder logic for now if it's a string
                // If it's pure ISO 8601 "2023-01-01T..."
                tvDate.setText(transaction.getDate().substring(0, 10)); 
            } catch (Exception e) {
                tvDate.setText(transaction.getDate());
            }
        }
    }
}
