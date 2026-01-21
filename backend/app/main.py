from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import os
import sys
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer

# User provided classes
class DataPreprocessor:
    def __init__(self):
        self.stemmer = PorterStemmer()
        # Handle stopwords download if not present
        try:
            self.stop_words = set(stopwords.words('english'))
        except LookupError:
            nltk.download('stopwords')
            self.stop_words = set(stopwords.words('english'))
            
        self.category_encoder = LabelEncoder()
        self.type_encoder = LabelEncoder()

    def clean_text(self, text):
        if pd.isna(text):
            return ""

        # Basic cleaning
        text = text.lower()
        text = re.sub(r"[^a-zA-Z\s]", " ", text)
        text = " ".join(text.split())

        # Tokenize
        tokens = text.split()

        # Remove stopwords & stem
        tokens = [
            self.stemmer.stem(word)
            for word in tokens
            if word not in self.stop_words
        ]

        return " ".join(tokens)

    def preprocess_data(self, df):
        df["cleaned_description"] = df["description"].apply(self.clean_text)
        df["category_encoded"] = self.category_encoder.fit_transform(df["category"])
        df["type_encoded"] = self.type_encoder.fit_transform(df["type"])
        return df

    def preprocess_input(self, text):
        clean = self.clean_text(text)
        return pd.DataFrame({"cleaned_description": [clean]})

class FeatureEngineer:
    def __init__(self, max_features=1000):
        self.tfidf = TfidfVectorizer(max_features=max_features, stop_words='english')
        self.scaler = StandardScaler()
        self.is_fitted = False

    def handcrafted_features(self, descriptions):
        features = []
        for text in descriptions:
            length = len(text)
            words = len(text.split())
            contains_num = int(bool(re.search(r'\d', text)))
            contains_payment_word = int("payment" in text)
            features.append([length, words, contains_num, contains_payment_word])
        return np.array(features)

    def fit_transform(self, descriptions):
        tfidf_features = self.tfidf.fit_transform(descriptions).toarray()
        handcrafted = self.handcrafted_features(descriptions)
        combined = np.hstack([tfidf_features, handcrafted])
        scaled = self.scaler.fit_transform(combined)
        self.is_fitted = True
        return scaled

    def transform(self, descriptions):
        tfidf_features = self.tfidf.transform(descriptions).toarray()
        handcrafted = self.handcrafted_features(descriptions)
        combined = np.hstack([tfidf_features, handcrafted])
        return self.scaler.transform(combined)

# Fix for joblib: Map classes to __main__ so unpickling works
import sys
sys.modules['__main__'].DataPreprocessor = DataPreprocessor
sys.modules['__main__'].FeatureEngineer = FeatureEngineer

# FastAPI App
app = FastAPI()

class PredictionRequest(BaseModel):
    text: str

class PredictionResponse(BaseModel):
    category: str
    type: str
    confidence_category: float
    confidence_type: float

models = {}

@app.on_event("startup")
async def load_models():
    # Ensure nltk data is downloaded
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords')

    # Path relative to this file: ../models
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "models")
    
    files = {
        "preprocessor": "expense_preprocessor (1).pkl",
        "feature_engineer": "expense_feature_engineer (1).pkl",
        "category_model": "expense_model_category (1).pkl",
        "type_model": "expense_model_type (1).pkl"
    }

    try:
        for name, filename in files.items():
            path = os.path.join(models_dir, filename)
            if not os.path.exists(path):
                print(f"ERROR: Model file not found: {path}")
                continue
                
            models[name] = joblib.load(path)
            print(f"Loaded {name} from {filename}")
            
    except Exception as e:
        print(f"CRITICAL: Failed to load models: {e}")
        # Print traceback for easier debugging
        import traceback
        traceback.print_exc()

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    if not all(k in models for k in ["preprocessor", "feature_engineer", "category_model", "type_model"]):
         raise HTTPException(status_code=503, detail="Models are not fully loaded")

    try:
        text = request.text
        
        # 1. Preprocess
        preprocessor = models["preprocessor"]
        # Use the class method directly if the object is an instance
        cleaned = preprocessor.clean_text(text)

        # 2. Feature Engineer
        # FeatureEngineer expects iterable of strings (descriptions)
        # We wrap the single cleaned text in a list
        input_data = [cleaned]
        
        features = models["feature_engineer"].transform(input_data)

        # 3. Predict Category
        cat_model = models["category_model"]
        cat_probs = cat_model.predict_proba(features)[0]
        cat_idx = np.argmax(cat_probs)
        cat_confidence = float(cat_probs[cat_idx])
        
        # Get encoded label and inverse transform
        cat_encoded = cat_model.classes_[cat_idx]
        category = models["preprocessor"].category_encoder.inverse_transform([cat_encoded])[0]
        
        # Debugging: Print available classes to understand the mapping
        print(f"DEBUG: Category Prediction: {category} (Raw: {cat_encoded})")
        # print(f"DEBUG: All Category Classes: {models['preprocessor'].category_encoder.classes_}")

        # 4. Predict Type
        type_model = models["type_model"]
        type_probs = type_model.predict_proba(features)[0]
        type_idx = np.argmax(type_probs)
        type_confidence = float(type_probs[type_idx])
        
        # Get encoded label and inverse transform
        type_encoded = type_model.classes_[type_idx]
        try:
            pred_type_raw = models["preprocessor"].type_encoder.inverse_transform([type_encoded])[0]
        except:
            pred_type_raw = type_encoded

        # Map integer type to string if necessary
        pred_type_str = str(pred_type_raw).upper()
        if pred_type_str == "0":
            pred_type = "EXPENSE"
        elif pred_type_str == "1":
            pred_type = "INCOME"
        else:
            pred_type = pred_type_str

        return {
            "category": str(category),
            "type": pred_type,
            "confidence_category": cat_confidence,
            "confidence_type": type_confidence
        }

    except Exception as e:
        print(f"Prediction error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))