export const calculateTotalBalance = (
  totalIncome: number,
  totalExpense: number
): number => {
  return totalIncome - totalExpense;
};

export const calculateTotalFromMonthlyData = (
  monthlyData: Array<{ month: number; totalAmount: number }>
): number => {
  return monthlyData.reduce((total, item) => total + item.totalAmount, 0);
};

export const calculateTotalOrdersFromMonthlyData = (
  monthlyData: Array<{ month: number; count: number }>
): number => {
  return monthlyData.reduce((total, item) => total + item.count, 0);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getMonthName = (monthNumber: number): string => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[monthNumber - 1] || "";
};

export const createChartData = (
  monthlyIncomes: Array<{ month: number; totalAmount: number }>,
  monthlyExpenses: Array<{ month: number; totalAmount: number }>
) => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const incomeData = months.map((month) => {
    const income = monthlyIncomes.find((item) => item.month === month);
    return income ? income.totalAmount : 0;
  });

  const expenseData = months.map((month) => {
    const expense = monthlyExpenses.find((item) => item.month === month);
    return expense ? expense.totalAmount : 0;
  });

  const balanceData = months.map((_, index) => {
    return incomeData[index] - expenseData[index];
  });

  return {
    labels: months.map((month) => getMonthName(month)),
    datasets: [
      {
        label: "Bakiye",
        data: balanceData,
        borderColor: "#03891B",
        fill: false,
        tension: 0.5,
      },
    ],
  };
};

export const createOrderChartData = (
  monthlyOrders: Array<{ month: number; count: number }>
) => {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const orderData = months.map((month) => {
    const order = monthlyOrders.find((item) => item.month === month);
    return order ? order.count : 0;
  });

  return {
    labels: months.map((month) => getMonthName(month)),
    datasets: [
      {
        label: "Siparişler",
        data: orderData,
        borderColor: "#1976d2",
        fill: false,
        tension: 0.5,
      },
    ],
  };
};
