package com.example.wsu_finance.network;

import com.example.wsu_finance.models.DashboardResponse;
import com.example.wsu_finance.models.Transaction;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;

public interface FinanceApiService {
    @GET("dashboard")
    Call<DashboardResponse> getDashboard(@Header("Authorization") String token);

    @GET("transactions")
    Call<List<Transaction>> getTransactions(@Header("Authorization") String token);
}
