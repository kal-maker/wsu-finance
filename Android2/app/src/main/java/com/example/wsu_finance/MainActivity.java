package com.example.wsu_finance;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.wsu_finance.models.DashboardResponse;
import com.example.wsu_finance.network.ApiClient;
import com.example.wsu_finance.network.FinanceApiService;

import java.text.NumberFormat;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {

    private TextView tvTotalBalance;
    private RecyclerView rvTransactions;
    private TransactionAdapter adapter;
    private String token;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        // Get Token
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        token = prefs.getString("auth_token", null);

        if (token == null) {
            logout();
            return;
        }

        initializeViews();
        fetchDashboardData();
    }

    private void initializeViews() {
        tvTotalBalance = findViewById(R.id.tvTotalBalance);
        rvTransactions = findViewById(R.id.rvTransactions);
        
        adapter = new TransactionAdapter();
        rvTransactions.setLayoutManager(new LinearLayoutManager(this));
        rvTransactions.setAdapter(adapter);
    }

    private void fetchDashboardData() {
        FinanceApiService service = ApiClient.getService();
        String authHeader = "Bearer " + token;

        service.getDashboard(authHeader).enqueue(new Callback<DashboardResponse>() {
            @Override
            public void onResponse(Call<DashboardResponse> call, Response<DashboardResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    updateUI(response.body());
                } else {
                    Log.e("MainActivity", "Error: " + response.code());
                    if (response.code() == 401) {
                        Toast.makeText(MainActivity.this, "Session expired", Toast.LENGTH_SHORT).show();
                        logout();
                    } else {
                        Toast.makeText(MainActivity.this, "Error: " + response.code(), Toast.LENGTH_LONG).show();
                    }
                }
            }

            @Override
            public void onFailure(Call<DashboardResponse> call, Throwable t) {
                Log.e("MainActivity", "Network Error", t);
                Toast.makeText(MainActivity.this, "Network Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updateUI(DashboardResponse data) {
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);
        tvTotalBalance.setText(currencyFormat.format(data.getTotalBalance()));

        if (data.getRecentTransactions() != null) {
            adapter.setTransactions(data.getRecentTransactions());
        }
    }

    private void logout() {
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        prefs.edit().remove("auth_token").apply();
        
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
    
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.main_menu, menu);
        return true;
    }
    
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.action_logout) {
            logout();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
