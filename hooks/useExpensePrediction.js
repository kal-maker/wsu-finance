import { useState, useCallback } from 'react';
import { expenseAPI } from '../lib/api';

export const useExpensePrediction = () => {
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const predict = useCallback(async (text) => {
    if (!text?.trim()) {
      setError('Please enter some text');
      return;
    }

    setPredicting(true);
    setError(null);
    
    try {
      const result = await expenseAPI.predictExpense(text);
      setPrediction(result);
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Failed to predict expense category';
      setError(errorMsg);
      setPrediction(null);
    } finally {
      setPredicting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPredicting(false);
    setPrediction(null);
    setError(null);
  }, []);

  return {
    predicting,
    prediction,
    error,
    predict,
    reset,
  };
};