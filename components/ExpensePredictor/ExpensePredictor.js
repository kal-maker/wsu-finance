import { useState } from 'react';
import { useExpensePrediction } from '../../hooks/useExpensePrediction';

const ExpensePredictor = ({ onPredictionSelect }) => {
  const [inputText, setInputText] = useState('');
  const { predicting, prediction, error, predict, reset } = useExpensePrediction();

  const handlePredict = async () => {
    const result = await predict(inputText);
    if (result && onPredictionSelect) {
      onPredictionSelect(result);
    }
  };

  const handleUsePrediction = () => {
    if (prediction && onPredictionSelect) {
      onPredictionSelect(prediction);
    }
  };

  const handleReset = () => {
    setInputText('');
    reset();
  };

  return (
    <div className="expense-predictor bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">🤖 AI Expense Categorizer</h3>
      
      {/* Text Input */}
      <div className="mb-4">
        <label htmlFor="receipt-text" className="block text-sm font-medium text-gray-700 mb-2">
          Enter receipt or expense description:
        </label>
        <textarea
          id="receipt-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g., 'Lunch at Kaldi's with team 850 birr' or 'Gas station fill up 2000 ETB'"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          disabled={predicting}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handlePredict}
          disabled={predicting || !inputText.trim()}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {predicting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            '🔍 Predict Category'
          )}
        </button>
        
        {prediction && (
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Prediction Results */}
      {prediction && (
        <div className="prediction-results border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">AI Prediction:</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-xs text-blue-600 font-medium">Category</div>
              <div className="text-lg font-semibold text-blue-900 capitalize">
                {prediction.category}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Confidence: {(prediction.confidence_category * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className={`p-3 rounded-md ${
              prediction.type === 'income' 
                ? 'bg-green-50' 
                : 'bg-orange-50'
            }`}>
              <div className={`text-xs font-medium ${
                prediction.type === 'income' 
                  ? 'text-green-600' 
                  : 'text-orange-600'
              }`}>
                Type
              </div>
              <div className={`text-lg font-semibold capitalize ${
                prediction.type === 'income' 
                  ? 'text-green-900' 
                  : 'text-orange-900'
              }`}>
                {prediction.type}
              </div>
              <div className={`text-xs mt-1 ${
                prediction.type === 'income' 
                  ? 'text-green-600' 
                  : 'text-orange-600'
              }`}>
                Confidence: {(prediction.confidence_type * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {onPredictionSelect && (
            <button
              onClick={handleUsePrediction}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              ✅ Use This Prediction
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpensePredictor;