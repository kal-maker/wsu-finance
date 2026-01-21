// components/emails/RecurringTransactionReminder.jsx
export function RecurringTransactionReminder({
  userName = 'User',
  transactionDescription = '',
  amount = 0,
  currency = 'ETB',
  dueDate = '',
  interval = 'monthly'
}) {
  const intervalText = {
    DAILY: 'daily',
    WEEKLY: 'weekly', 
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
  }[interval] || interval.toLowerCase();

  return (
    <div style={container}>
      <h1 style={heading}>🔔 Transaction Reminder</h1>
      
      <div style={content}>
        <p style={text}>Hello {userName},</p>
        
        <p style={text}>
          This is a reminder for your {intervalText} recurring transaction:
        </p>
        
        <div style={transactionBox}>
          <p style={transactionText}>
            <strong>Description:</strong> {transactionDescription}
          </p>
          <p style={transactionText}>
            <strong>Amount:</strong> {currency} {amount.toLocaleString()}
          </p>
          <p style={transactionText}>
            <strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}
          </p>
        </div>
        
        <p style={text}>
          This transaction will be processed automatically on the due date.
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

const transactionBox = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const transactionText = {
  color: '#2d3748',
  fontSize: '16px',
  lineHeight: '20px',
  margin: '8px 0',
};