"use server";

import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PredictionSchema = z.object({
    category: z.string(),
    type: z.enum(["INCOME", "EXPENSE"]),
    confidence: z.number().optional(),
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function categorizeWithGemini(description, mlPrediction = null) {
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY is missing for Gemini fallback");
        // If ML prediction exists but Gemini API is missing, return ML prediction as fallback
        if (mlPrediction) {
            return {
                category: mlPrediction.category,
                type: mlPrediction.type,
                confidence: mlPrediction.confidence_category ?? 0.5
            };
        }
        return {
            category: 'other-expense',
            type: 'EXPENSE',
            confidence: 0.3,
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        let prompt;
        if (mlPrediction) {
            prompt = `
            You are an expense categorization assistant.
            
            Transaction Description: "${description}"
            
            A local ML model predicted:
            - Category: "${mlPrediction.category}"
            - Type: "${mlPrediction.type}"

            Verify this prediction. If it is correct, output it. If it is incorrect or vague (like 'other-expense' when a better match exists), provide the correct category from the list below.

            Allowed Categories:
            ["food", "transportation", "shopping", "entertainment", "bills", "utilities",
             "healthcare", "education", "travel", "groceries", "housing", "insurance",
             "gifts", "salary", "freelance", "rental", "investments", "business",
             "other-income", "other-expense"]

            Respond with ONLY valid JSON:
            {
                "category": "correct category",
                "type": "INCOME or EXPENSE",
                "confidence": number between 0 and 1
            }
            `;
        } else {
            prompt = `
            You are an expense categorization assistant.
            Classify the following transaction description into:
            - type: "INCOME" or "EXPENSE"
            - category: one of the following:
                ["food", "transportation", "shopping", "entertainment", "bills", "utilities",
                 "healthcare", "education", "travel", "groceries", "housing", "insurance",
                 "gifts", "salary", "freelance", "rental", "investments", "business",
                 "other-income", "other-expense"]

            Description: "${description}"

            Respond with ONLY valid JSON:
            {
                "category": "category",
                "type": "INCOME or EXPENSE",
                "confidence": 0.95
            }
            `;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        const cleaned = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleaned);

        return {
            category: data.category.toLowerCase(),
            type: data.type.toUpperCase(),
            confidence: data.confidence ?? 0.8,
        };
    } catch (error) {
        console.error('❌ Gemini fallback failed:', error);
        // Fallback to ML prediction if Gemini fails
        if (mlPrediction) {
            return {
                category: mlPrediction.category,
                type: mlPrediction.type,
                confidence: mlPrediction.confidence_category ?? 0.5
            };
        }
        return null; // Both failed
    }
}

export async function predictTransaction(description) {
    if (!description || typeof description !== "string") {
        return { error: "Invalid description" };
    }

    const PYTHON_API_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8001";
    let mlResult = null;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        try {
            // FIXED: Payload key must be 'text' to match FastAPI Pydantic model
            const response = await fetch(`${PYTHON_API_URL}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: description }),
                cache: "no-store",
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                mlResult = await response.json();
                console.log("🐍 Python Prediction:", mlResult);
            } else {
                console.warn(`Python service error: ${response.status}`);
            }
        } catch (e) {
            clearTimeout(timeoutId);
            console.warn("⚠️ Python Service unreachable, continuing to Gemini...");
        }

        // Always call Gemini, passing ML result if available (Verification Mode)
        // or just description if ML failed (Fallback Mode)
        const finalResult = await categorizeWithGemini(description, mlResult);

        if (finalResult) {
            const validated = PredictionSchema.safeParse(finalResult);
            if (validated.success) {
                console.log("✨ Final Prediction (Gemini Verified):", validated.data);
                return { success: true, data: validated.data };
            }
        }

        return { error: "Could not categorize transaction" };
    } catch (error) {
        console.error("Prediction process failed:", error);
        return { error: "System error during prediction" };
    }
}