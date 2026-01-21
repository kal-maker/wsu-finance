package com.example.wsu_finance.network;

import com.example.wsu_finance.BuildConfig;

import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {
    private static Retrofit retrofit = null;

    public static FinanceApiService getService() {
        if (retrofit == null) {
            String baseUrl = BuildConfig.API_BASE_URL;
            if (baseUrl == null || baseUrl.isEmpty()) {
                baseUrl = "http://10.0.2.2:3000/api/mobile/"; // Fallback
            }
            
            retrofit = new Retrofit.Builder()
                    .baseUrl(baseUrl)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit.create(FinanceApiService.class);
    }
}
