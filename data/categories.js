export const defaultCategories = [
  // Income Categories
  {
    id: "salary",
    name: "Salary",
    type: "INCOME",
    color: "#06b6d4", // cyan-500
    icon: "Wallet",
  },
  {
    id: "freelance",
    name: "Freelance",
    type: "INCOME",
    color: "#0891b2", // cyan-600
    icon: "Laptop",
  },
  {
    id: "investments",
    name: "Investments",
    type: "INCOME",
    color: "#0e7490", // cyan-700
    icon: "TrendingUp",
  },
  {
    id: "business",
    name: "Business",
    type: "INCOME",
    color: "#22d3ee", // cyan-400
    icon: "Building",
  },
  {
    id: "rental",
    name: "Rental",
    type: "INCOME",
    color: "#67e8f9", // cyan-300
    icon: "Home",
  },
  {
    id: "other-income",
    name: "Other Income",
    type: "INCOME",
    color: "#a5f3fc", // cyan-200
    icon: "Plus",
  },

  // Expense Categories
  {
    id: "housing",
    name: "Housing",
    type: "EXPENSE",
    color: "#1e3a8a", // blue-900 (Navy)
    icon: "Home",
    subcategories: ["Rent", "Mortgage", "Property Tax", "Maintenance"],
  },
  {
    id: "transportation",
    name: "Transportation",
    type: "EXPENSE",
    color: "#172554", // blue-950 (Darker Navy)
    icon: "Car",
    subcategories: ["Fuel", "Public Transport", "Maintenance", "Parking"],
  },
  {
    id: "groceries",
    name: "Groceries",
    type: "EXPENSE",
    color: "#1e40af", // blue-800
    icon: "Shopping",
  },
  {
    id: "utilities",
    name: "Utilities",
    type: "EXPENSE",
    color: "#1d4ed8", // blue-700
    icon: "Zap",
    subcategories: ["Electricity", "Water", "Gas", "Internet", "Phone"],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    type: "EXPENSE",
    color: "#2563eb", // blue-600
    icon: "Film",
    subcategories: ["Movies", "Games", "Streaming Services"],
  },
  {
    id: "food",
    name: "Food",
    type: "EXPENSE",
    color: "#3b82f6", // blue-500
    icon: "UtensilsCrossed",
  },
  {
    id: "shopping",
    name: "Shopping",
    type: "EXPENSE",
    color: "#60a5fa", // blue-400
    icon: "ShoppingBag",
    subcategories: ["Clothing", "Electronics", "Home Goods"],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    type: "EXPENSE",
    color: "#93c5fd", // blue-300
    icon: "HeartPulse",
    subcategories: ["Medical", "Dental", "Pharmacy", "Insurance"],
  },
  {
    id: "education",
    name: "Education",
    type: "EXPENSE",
    color: "#bfdbfe", // blue-200
    icon: "GraduationCap",
    subcategories: ["Tuition", "Books", "Courses"],
  },
  {
    id: "personal",
    name: "Personal Care",
    type: "EXPENSE",
    color: "#dbeafe", // blue-100
    icon: "Smile",
    subcategories: ["Haircut", "Gym", "Beauty"],
  },
  {
    id: "travel",
    name: "Travel",
    type: "EXPENSE",
    color: "#1e3a8a", // blue-900
    icon: "Plane",
  },
  {
    id: "insurance",
    name: "Insurance",
    type: "EXPENSE",
    color: "#172554", // blue-950
    icon: "Shield",
    subcategories: ["Life", "Home", "Vehicle"],
  },
  {
    id: "gifts",
    name: "Gifts & Donations",
    type: "EXPENSE",
    color: "#1e40af", // blue-800
    icon: "Gift",
  },
  {
    id: "bills",
    name: "Bills & Fees",
    type: "EXPENSE",
    color: "#1d4ed8", // blue-700
    icon: "Receipt",
    subcategories: ["Bank Fees", "Late Fees", "Service Charges"],
  },
  {
    id: "other-expense",
    name: "Other Expenses",
    type: "EXPENSE",
    color: "#3b82f6", // blue-500
    icon: "MoreHorizontal",
  },
];

export const categoryColors = defaultCategories.reduce((acc, category) => {
  acc[category.id] = category.color;
  return acc;
}, {});
