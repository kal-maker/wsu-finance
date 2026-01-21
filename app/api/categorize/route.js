import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8001';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function categorizeWithGemini(description) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing for Gemini fallback in /api/categorize");
    return {
      category: 'other-expense',
      type: 'EXPENSE',
      categoryConfidence: 0.3,
      typeConfidence: 0.3,
      originalCategory: 'other-expense',
      note: 'Gemini fallback unavailable - using neutral default'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expense categorization assistant.
      Classify the following transaction description into:
      - type: "INCOME" or "EXPENSE"
      - category: one of the following (use the closest match):
        ["food", "transportation", "shopping", "entertainment", "bills", "utilities",
         "healthcare", "education", "travel", "groceries", "housing", "insurance",
         "gifts", "salary", "freelance", "rental", "investments", "business",
         "other-income", "other-expense"]

      Description: "${description}"

      Respond with ONLY valid JSON in this exact format:
      {
        "category": "one of the categories above",
        "type": "INCOME or EXPENSE",
        "confidence_category": number between 0 and 1,
        "confidence_type": number between 0 and 1
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('🧠 Gemini /api/categorize raw response:', text);

    const cleaned = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleaned);

    if (!data.category || !data.type) {
      throw new Error('Gemini response missing category or type');
    }

    return {
      category: mapCategoryToYourSystem(data.category),
      type: data.type.toUpperCase(),
      categoryConfidence: data.confidence_category ?? 0.5,
      typeConfidence: data.confidence_type ?? 0.5,
      originalCategory: data.category,
      note: 'Gemini fallback categorization'
    };
  } catch (error) {
    console.error('❌ Gemini fallback in /api/categorize failed:', error);
    return {
      category: 'other-expense',
      type: 'EXPENSE',
      categoryConfidence: 0.3,
      typeConfidence: 0.3,
      originalCategory: 'other-expense',
      note: 'Gemini fallback failed - using neutral default'
    };
  }
}

export async function POST(request) {
  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    // Call FastAPI backend first
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(`${FASTAPI_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: description }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`FastAPI responded with status: ${response.status}`);
      }

      const prediction = await response.json();

      const mappedData = {
        category: mapCategoryToYourSystem(prediction.category),
        type: prediction.type.toUpperCase(),
        categoryConfidence: prediction.confidence_category,
        typeConfidence: prediction.confidence_type,
        originalCategory: prediction.category,
      };

      return NextResponse.json({
        success: true,
        data: mappedData,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.warn('⚠️ FastAPI backend failed, falling back to Gemini in /api/categorize:', fetchError);

      // Fallback to Gemini text-based categorization instead of rule-based
      const geminiResult = await categorizeWithGemini(description);
      return NextResponse.json({
        success: true,
        data: geminiResult,
      });
    }
  } catch (error) {
    console.error('Categorization API error (outer):', error);

    // As a final fallback, try Gemini once more
    try {
      const { description } = await request.json();
      if (description) {
        const geminiResult = await categorizeWithGemini(description);
        return NextResponse.json({
          success: true,
          data: geminiResult,
        });
      }
    } catch (innerError) {
      console.error('❌ Gemini outer fallback failed in /api/categorize:', innerError);
    }

    // Hard fallback to neutral default to avoid breaking UI
    return NextResponse.json({
      success: true,
      data: {
        category: 'other-expense',
        type: 'EXPENSE',
        categoryConfidence: 0.3,
        typeConfidence: 0.3,
        originalCategory: 'other-expense',
        note: 'Categorization service unavailable, using neutral default',
      },
    });
  }
}

// Helper function to map FastAPI / Gemini categories to your system
function mapCategoryToYourSystem(fastApiCategory) {
  const categoryMap = {
    food: 'food',
    transportation: 'transportation',
    shopping: 'shopping',
    entertainment: 'entertainment',
    bills: 'utilities',
    utilities: 'utilities',
    healthcare: 'healthcare',
    education: 'education',
    travel: 'travel',
    groceries: 'groceries',
    housing: 'housing',
    insurance: 'insurance',
    gifts: 'gifts',
    salary: 'salary',
    freelance: 'freelance',
    rental: 'rental',
    investments: 'investments',
    business: 'business',
    'other-income': 'other-income',
    'other-expense': 'other-expense',
  };

  return categoryMap[(fastApiCategory || '').toLowerCase()] || 'other-expense';
}