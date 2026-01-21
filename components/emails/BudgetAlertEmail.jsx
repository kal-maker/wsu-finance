// components/emails/BudgetAlertEmail.jsx
export function BudgetAlertEmail({ 
  userName = 'User',
  budgetAmount = 0,
  currentSpending = 0,
  percentageUsed = 0,
  currency = 'ETB'
}) {
  return (
    <div style={container}>
      <h1 style={heading}>🚨 Budget Alert</h1>
      
      <div style={content}>
        <p style={text}>Hello {userName},</p>
        
        <p style={text}>
          This is a friendly reminder that you've used <strong>{percentageUsed}%</strong> of your 
          monthly budget.
        </p>
        
        <div style={budgetBox}>
          <p style={budgetText}>
            <strong>Budget:</strong> {currency} {budgetAmount.toLocaleString()}
          </p>
          <p style={budgetText}>
            <strong>Spent:</strong> {currency} {currentSpending.toLocaleString()}
          </p>
          <p style={budgetText}>
            <strong>Remaining:</strong> {currency} {(budgetAmount - currentSpending).toLocaleString()}
          </p>
        </div>
        
        <p style={text}>
          You're approaching your budget limit. Consider reviewing your recent transactions 
          to stay within your financial goals.
        </p>
        
        <p style={text}>
          Best regards,<br />
          WSU Finance Platform
        </p>
      </div>
    </div>
  );
}

const container = {
  backgroundColor: '#f6f9fc',
  padding: '20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const heading = {
  color: '#1a365d',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center',
  margin: '0 0 30px 0',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '8px',
  border: '1px solid #e0e6ef',
};

const text = {
  color: '#2d3748',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const budgetBox = {
  backgroundColor: '#fff5f5',
  border: '1px solid #fed7d7',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const budgetText = {
  color: '#2d3748',
  fontSize: '16px',
  lineHeight: '20px',
  margin: '8px 0',
};