// ============================================
// PERSONAL EXPENSE ANALYZER - JavaScript
// ============================================

// Data Structure: Array to store all expenses
let expenses = [];
let monthlyBudget = 0;
let pieChart = null;
let barChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    // Load data from LocalStorage
    loadData();
    
    // Event Listeners
    document.getElementById('expenseForm').addEventListener('submit', addExpense);
    document.getElementById('setBudgetBtn').addEventListener('click', setBudget);
    document.getElementById('monthFilter').addEventListener('change', filterByMonth);
    document.getElementById('clearFilterBtn').addEventListener('click', clearFilter);
    
    // Initial render
    renderExpenses();
    updateSummary();
    updateCharts();
    updateBudgetDisplay();
});

// ============================================
// ADD EXPENSE FUNCTIONALITY
// ============================================
function addExpense(event) {
    event.preventDefault();
    
    // Get input values
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value.trim();
    
    // Validation
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
    }
    
    if (!category) {
        alert('Please select a category');
        return;
    }
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    // Create expense object
    const expense = {
        id: Date.now(), // Unique ID for deletion
        amount: amount,
        category: category,
        date: date,
        description: description || 'No description'
    };
    
    // Add to expenses array
    expenses.push(expense);
    
    // Save to LocalStorage
    saveData();
    
    // Reset form
    document.getElementById('expenseForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    
    // Update UI
    renderExpenses();
    updateSummary();
    updateCharts();
    updateBudgetDisplay();
    
    // Show success message
    showNotification('Expense added successfully!', 'success');
}

// ============================================
// DISPLAY EXPENSE LIST
// ============================================
function renderExpenses(filteredExpenses = null) {
    const tbody = document.getElementById('expenseTableBody');
    const expensesToShow = filteredExpenses || expenses;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    if (expensesToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">No expenses found. Add your first expense!</td></tr>';
        return;
    }
    
    // Sort by date (newest first)
    const sortedExpenses = [...expensesToShow].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create table rows
    sortedExpenses.forEach(expense => {
        const row = document.createElement('tr');
        
        // Format date
        const dateObj = new Date(expense.date);
        const formattedDate = dateObj.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><span class="category-badge category-${expense.category}">${expense.category}</span></td>
            <td>${expense.description}</td>
            <td>Rs${expense.amount.toFixed(2)}</td>
            <td><button class="btn-danger" onclick="deleteExpense(${expense.id})">Delete</button></td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============================================
// DELETE EXPENSE
// ============================================
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveData();
        renderExpenses();
        updateSummary();
        updateCharts();
        updateBudgetDisplay();
        showNotification('Expense deleted successfully!', 'success');
    }
}

// ============================================
// CALCULATE AND DISPLAY SUMMARY
// ============================================
function updateSummary(filteredExpenses = null) {
    const expensesToCalculate = filteredExpenses || expenses;
    
    // Calculate total spending
    const totalSpending = expensesToCalculate.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate total number of expenses
    const totalExpenses = expensesToCalculate.length;
    
    // Calculate average per expense
    const averageExpense = totalExpenses > 0 ? totalSpending / totalExpenses : 0;
    
    // Update DOM
    document.getElementById('totalSpending').textContent = `Rs${totalSpending.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = totalExpenses;
    document.getElementById('averageExpense').textContent = `Rs${averageExpense.toFixed(2)}`;
    
    // Check budget warning
    if (monthlyBudget > 0) {
        const totalSpendingElement = document.getElementById('totalSpending');
        if (totalSpending > monthlyBudget) {
            totalSpendingElement.classList.add('budget-warning');
        } else {
            totalSpendingElement.classList.remove('budget-warning');
        }
    }
}

// ============================================
// CATEGORY BREAKDOWN
// ============================================
function getCategoryBreakdown(filteredExpenses = null) {
    const expensesToAnalyze = filteredExpenses || expenses;
    const categories = ['Food', 'Transport', 'Education', 'Entertainment', 'Miscellaneous'];
    const breakdown = {};
    
    // Initialize all categories to 0
    categories.forEach(category => {
        breakdown[category] = 0;
    });
    
    // Calculate total for each category
    expensesToAnalyze.forEach(expense => {
        if (breakdown[expense.category] !== undefined) {
            breakdown[expense.category] += expense.amount;
        }
    });
    
    return breakdown;
}

// ============================================
// CHARTS - Using Chart.js
// ============================================
function updateCharts(filteredExpenses = null) {
    const expensesToChart = filteredExpenses || expenses;
    
    // Update Pie Chart (Category-wise spending)
    updatePieChart(expensesToChart);
    
    // Update Bar Chart (Daily expenses trend)
    updateBarChart(expensesToChart);
}

function updatePieChart(expensesToChart) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const breakdown = getCategoryBreakdown(expensesToChart);
    
    // Destroy existing chart if it exists
    if (pieChart) {
        pieChart.destroy();
    }
    
    const categories = Object.keys(breakdown);
    const amounts = Object.values(breakdown);
    const hasData = amounts.some(amount => amount > 0);
    
    if (!hasData) {
        // Show empty state
        pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#e0e0e0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        return;
    }
    
    // Color scheme for categories
    const colors = {
        'Food': '#ff6b6b',
        'Transport': '#4ecdc4',
        'Education': '#45b7d1',
        'Entertainment': '#f9ca24',
        'Miscellaneous': '#95a5a6'
    };
    
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: categories.map(cat => colors[cat] || '#95a5a6'),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: Rs${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateBarChart(expensesToChart) {
    const ctx = document.getElementById('barChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (barChart) {
        barChart.destroy();
    }
    
    if (expensesToChart.length === 0) {
        // Show empty state
        barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['No Data'],
                datasets: [{
                    label: 'Expenses',
                    data: [0],
                    backgroundColor: '#e0e0e0'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        return;
    }
    
    // Group expenses by date
    const dailyExpenses = {};
    expensesToChart.forEach(expense => {
        const date = expense.date;
        if (!dailyExpenses[date]) {
            dailyExpenses[date] = 0;
        }
        dailyExpenses[date] += expense.amount;
    });
    
    // Sort dates
    const sortedDates = Object.keys(dailyExpenses).sort();
    
    // Get last 7 days or all if less than 7
    const datesToShow = sortedDates.slice(-7);
    const amounts = datesToShow.map(date => dailyExpenses[date]);
    
    // Format dates for display
    const formattedDates = datesToShow.map(date => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
        });
    });
    
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: formattedDates,
            datasets: [{
                label: 'Daily Expenses (Rs)',
                data: amounts,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rs' + value.toFixed(0);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Rs' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// MONTHLY BUDGET FUNCTIONALITY
// ============================================
function setBudget() {
    const budgetInput = document.getElementById('budgetAmount');
    const budgetValue = parseFloat(budgetInput.value);
    
    if (!budgetValue || budgetValue <= 0) {
        alert('Please enter a valid budget amount');
        return;
    }
    
    monthlyBudget = budgetValue;
    saveData();
    updateBudgetDisplay();
    showNotification('Budget set successfully!', 'success');
    budgetInput.value = '';
}

function updateBudgetDisplay() {
    const currentBudgetElement = document.getElementById('currentBudget');
    const remainingBudgetElement = document.getElementById('remainingBudget');
    
    if (monthlyBudget === 0) {
        currentBudgetElement.textContent = 'Not set';
        remainingBudgetElement.textContent = '-';
        remainingBudgetElement.classList.remove('budget-warning');
        return;
    }
    
    const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remaining = monthlyBudget - totalSpending;
    
    currentBudgetElement.textContent = `Rs${monthlyBudget.toFixed(2)}`;
    remainingBudgetElement.textContent = `Rs${remaining.toFixed(2)}`;
    
    // Add warning class if budget exceeded
    if (remaining < 0) {
        remainingBudgetElement.classList.add('budget-warning');
        showNotification('⚠️ Budget exceeded!', 'warning');
    } else {
        remainingBudgetElement.classList.remove('budget-warning');
    }
}

// ============================================
// FILTER BY MONTH
// ============================================
let currentFilter = null;

function filterByMonth() {
    const monthInput = document.getElementById('monthFilter');
    const selectedMonth = monthInput.value;
    
    if (!selectedMonth) {
        clearFilter();
        return;
    }
    
    currentFilter = selectedMonth;
    
    // Filter expenses for selected month
    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
        return expenseMonth === selectedMonth;
    });
    
    // Update UI with filtered data
    renderExpenses(filteredExpenses);
    updateSummary(filteredExpenses);
    updateCharts(filteredExpenses);
}

function clearFilter() {
    document.getElementById('monthFilter').value = '';
    currentFilter = null;
    renderExpenses();
    updateSummary();
    updateCharts();
}

// ============================================
// LOCAL STORAGE - Save and Load Data
// ============================================
function saveData() {
    // Save expenses array
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    // Save monthly budget
    localStorage.setItem('monthlyBudget', JSON.stringify(monthlyBudget));
}

function loadData() {
    // Load expenses from LocalStorage
    const savedExpenses = localStorage.getItem('expenses');
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
    
    // Load monthly budget from LocalStorage
    const savedBudget = localStorage.getItem('monthlyBudget');
    if (savedBudget) {
        monthlyBudget = JSON.parse(savedBudget);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showNotification(message, type = 'info') {
    // Simple notification (can be enhanced with a toast library)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

