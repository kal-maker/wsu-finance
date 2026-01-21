import joblib
import sys
import os

# Add current directory to path just in case
sys.path.append(os.getcwd())

models_dir = "models"
files = [
    "expense_model_category (1).pkl",
    "expense_model_type (1).pkl",
    "expense_preprocessor (1).pkl",
    "expense_feature_engineer (1).pkl"
]

print("--- Inspecting Models ---")
for f in files:
    path = os.path.join(models_dir, f)
    try:
        obj = joblib.load(path)
        print(f"SUCCESS: Loaded {f}")
        print(f"  Type: {type(obj)}")
        if hasattr(obj, "clean_text"):
            print("  Has clean_text method: YES")
        else:
            print("  Has clean_text method: NO")
    except Exception as e:
        print(f"ERROR: Failed to load {f}")
        print(f"  Error: {e}")
