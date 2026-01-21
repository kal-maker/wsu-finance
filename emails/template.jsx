// emails/template.jsx
import * as React from 'react';

export default function EmailTemplate({ userName, type, data }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#3b82f6', color: 'white', padding: '20px', textAlign: 'center', borderRadius: '10px 10px 0 0' }}>
        <h1>💰 WSU Finance Platform</h1>
      </div>
      
      {/* Content */}
      <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '0 0 10px 10px' }}>
        <h2>Hello {userName}!</h2>
        
        {/* Budget Alert */}
        {type === 'budget-alert' && (
          <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '15px', margin: '15px 0' }}>
            <h3 style={{ color: '#92400e', margin: '0 0 10px 0' }}>Budget Alert 🚨</h3>
            <p>You've reached <strong>{data.percentageUsed}%</strong> of your budget limit!</p>
            <p><strong>Account:</strong> {data.accountName}</p>
            <p><strong>Budget:</strong> ETB {data.budgetAmount}</p>
            <p><strong>Spent:</strong> ETB {data.totalExpenses}</p>
          </div>
        )}
        
        {/* Monthly Report */}
        {type === 'monthly-report' && (
          <div>
            <h3>📊 Monthly Financial Report & Analysis - {data.month}</h3>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
              <h4>Monthly Summary</h4>
              <p><strong>Total Income:</strong> ETB {data.stats.totalIncome}</p>
              <p><strong>Total Expenses:</strong> ETB {data.stats.totalExpenses}</p>
              <p><strong>Net Savings:</strong> ETB {data.stats.totalIncome - data.stats.totalExpenses}</p>
              <p><strong>Transactions:</strong> {data.stats.transactionCount}</p>
            </div>
            
            {data.categoryAnalysis && (
              <div style={{ background: 'white', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
                <h4>📈 Category Analysis</h4>
                <p><strong>Highest Spending:</strong> {data.categoryAnalysis.highestSpending}</p>
                {data.categoryAnalysis.reducedCategories?.length > 0 && (
                  <p><strong>Categories with Reduced Spending:</strong> {data.categoryAnalysis.reducedCategories.join(', ')}</p>
                )}
                {data.categoryAnalysis.increasedCategories?.length > 0 && (
                  <p><strong>Categories with Increased Spending:</strong> {data.categoryAnalysis.increasedCategories.join(', ')}</p>
                )}
                {data.categoryAnalysis.concerningCategories?.length > 0 && (
                  <p style={{ color: '#dc2626' }}><strong>Categories Needing Attention:</strong> {data.categoryAnalysis.concerningCategories.join(', ')}</p>
                )}
              </div>
            )}
            
            <h4>💡 AI-Powered Financial Insights</h4>
            {data.insights?.map((insight, index) => (
              <div key={index} style={{ background: '#dbeafe', borderLeft: '4px solid #3b82f6', padding: '12px', margin: '10px 0' }}>
                <p style={{ margin: 0 }}>{insight}</p>
              </div>
            ))}
            
            {data.spendingTrends && data.spendingTrends.length > 0 && (
              <div style={{ background: 'white', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
                <h4>📊 Spending Trends</h4>
                {data.spendingTrends.map((trend, index) => (
                  <div key={index} style={{ background: '#f3f4f6', padding: '10px', margin: '8px 0', borderRadius: '4px' }}>
                    <p style={{ margin: 0 }}>{trend}</p>
                  </div>
                ))}
              </div>
            )}
            
            {data.recommendations && data.recommendations.length > 0 && (
              <div style={{ background: '#ecfdf5', borderLeft: '4px solid #10b981', padding: '15px', margin: '15px 0' }}>
                <h4>🎯 Personalized Recommendations</h4>
                {data.recommendations.map((rec, index) => (
                  <div key={index} style={{ background: 'white', padding: '10px', margin: '8px 0', borderRadius: '4px', borderLeft: '3px solid #10b981' }}>
                    <p style={{ margin: 0 }}>{rec}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Recurring Transactions Summary */}
        {type === 'recurring-summary' && (
          <div>
            <h3>🔄 Recurring Transactions Processed</h3>
            <p><strong>Processed At:</strong> {data.processedAt}</p>
            <p><strong>Total Transactions Processed:</strong> {data.processedCount}</p>
            
            {data.transactions && data.transactions.length > 0 && (
              <div style={{ background: 'white', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
                <h4>📋 Processed Transactions</h4>
                {data.transactions.map((transaction, index) => (
                  <div key={index} style={{ background: '#f3f4f6', padding: '10px', margin: '8px 0', borderRadius: '4px' }}>
                    <p style={{ margin: '0 0 5px 0' }}><strong>{transaction.description}</strong></p>
                    <p style={{ margin: '0 0 5px 0' }}>
                      <strong>Amount:</strong> ETB {transaction.amount} ({transaction.type})
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>User:</strong> {transaction.userName} | <strong>Account:</strong> {transaction.accountName}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ background: '#dbeafe', borderLeft: '4px solid #3b82f6', padding: '15px', margin: '15px 0' }}>
              <p style={{ margin: 0 }}>All recurring transactions have been processed and account balances have been updated accordingly.</p>
            </div>
          </div>
        )}
        
        {/* Recurring Reminder */}
        {type === 'recurring-reminder' && (
          <div style={{ background: '#ecfdf5', borderLeft: '4px solid #10b981', padding: '15px', margin: '15px 0' }}>
            <h3 style={{ color: '#065f46', margin: '0 0 10px 0' }}>Recurring Transaction Reminder 🔔</h3>
            <p><strong>Description:</strong> {data.transactionDescription}</p>
            <p><strong>Amount:</strong> ETB {data.amount}</p>
            <p><strong>Due Date:</strong> {new Date(data.dueDate).toLocaleDateString()}</p>
            <p><strong>Interval:</strong> {data.interval}</p>
          </div>
        )}
        
        <p>Thank you for using WSU Finance Platform!</p>
      </div>
      
      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280', fontSize: '14px' }}>
        <p>WSU Finance Platform - Smart Financial Management</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  );
}