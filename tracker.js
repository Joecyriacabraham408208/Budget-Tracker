// JavaScript extracted from Budget11.html <script> block
// ... All JS from lines 2395-3167 ... 

        // Initialize the application
        class BudgetTracker {
                    constructor() {
            this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            this.goals = JSON.parse(localStorage.getItem('budgetGoals')) || [];
            this.reminders = JSON.parse(localStorage.getItem('reminders')) || [];
            this.notes = JSON.parse(localStorage.getItem('calendarNotes')) || {};
            this.currentFilter = 'all';
            this.currentPeriod = 'month';
            this.currentDate = new Date();
            this.selectedDate = null;
            this.init();
        }

            init() {
                this.setupEventListeners();
                this.loadTheme();
                this.updateUI();
                this.checkReminders();
                this.setupNotifications();
            }

            setupEventListeners() {
                // Form submission
                document.getElementById('transactionForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addTransaction();
                });

                // Theme toggle
                document.getElementById('themeToggle').addEventListener('click', () => {
                    this.toggleTheme();
                });

                // Filter buttons
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.setFilter(e.target.dataset.filter);
                    });
                });

                // Time period buttons
                document.querySelectorAll('.time-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.setTimePeriod(e.target.dataset.period);
                    });
                });

                // Search input
                document.getElementById('searchInput').addEventListener('input', (e) => {
                    this.searchTransactions(e.target.value);
                });
            }

            addTransaction() {
                const description = document.getElementById('description').value;
                const amount = parseFloat(document.getElementById('amount').value);
                const type = document.getElementById('type').value;
                const category = document.getElementById('category').value;

                if (!description || !amount || !type || !category) {
                    this.showNotification('Error!', 'Please fill in all fields', 'error');
                    return;
                }

                const transaction = {
                    id: Date.now(),
                    description,
                    amount,
                    type,
                    category,
                    date: new Date().toISOString()
                };

                this.transactions.unshift(transaction);
                this.saveTransactions();
                this.updateUI();
                this.resetForm();
                this.showNotification('Success!', 'Transaction added successfully', 'success');
            }

            deleteTransaction(id) {
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.saveTransactions();
                this.updateUI();
            }

            setFilter(filter) {
                this.currentFilter = filter;
                
                // Update active button
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
                
                this.updateTransactionsList();
            }

            updateUI() {
                this.updateSummary();
                this.updateTransactionsList();
                this.updateCharts();
                this.updateGoals();
                this.updateReminders();
                this.updateCurrentPeriod();
            }

            updateSummary() {
                const filteredTransactions = this.getFilteredTransactions();
                
                const income = filteredTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);

                const expense = filteredTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                const balance = income - expense;
                const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;

                document.getElementById('totalIncome').textContent = `₹${income.toFixed(2)}`;
                document.getElementById('totalExpense').textContent = `₹${expense.toFixed(2)}`;
                document.getElementById('balance').textContent = `₹${balance.toFixed(2)}`;
                document.getElementById('savingsRate').textContent = `${savingsRate}%`;
            }

            getFilteredTransactions() {
                const now = new Date();
                let startDate = new Date();

                switch (this.currentPeriod) {
                    case 'week':
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                    case 'quarter':
                        startDate.setMonth(now.getMonth() - 3);
                        break;
                    case 'year':
                        startDate.setFullYear(now.getFullYear() - 1);
                        break;
                }

                return this.transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= startDate && transactionDate <= now;
                });
            }

            updateTransactionsList() {
                const container = document.getElementById('transactionsList');
                let filteredTransactions = this.getFilteredTransactions();
                
                if (this.currentFilter !== 'all') {
                    filteredTransactions = filteredTransactions.filter(t => t.type === this.currentFilter);
                }

                if (filteredTransactions.length === 0) {
                    container.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 2rem;">No transactions found</p>';
                    return;
                }

                container.innerHTML = filteredTransactions.map(transaction => `
                    <div class="transaction-item fade-in">
                        <div class="transaction-info">
                            <div class="transaction-title">${transaction.description}</div>
                            <div class="transaction-category">${transaction.category}</div>
                            <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="transaction-amount ${transaction.type === 'income' ? 'income' : 'expense'}">
                                ${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
                            </div>
                            <button class="delete-btn" onclick="budgetTracker.deleteTransaction(${transaction.id})">🗑️</button>
                        </div>
                    </div>
                `).join('');
            }

            updateCharts() {
                this.updateExpenseChart();
                this.updateCalendar();
            }

            updateExpenseChart() {
                const expenses = this.getFilteredTransactions().filter(t => t.type === 'expense');
                const categoryTotals = {};

                expenses.forEach(expense => {
                    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
                });

                const categories = Object.keys(categoryTotals);
                const amounts = Object.values(categoryTotals);
                const total = amounts.reduce((sum, amount) => sum + amount, 0);

                // Update pie chart center
                document.getElementById('pieCenter').textContent = `₹${total.toFixed(0)}`;

                if (total === 0) {
                    document.getElementById('expenseChart').style.background = 'conic-gradient(var(--chalk-white) 0deg 360deg)';
                    document.getElementById('expenseLegend').innerHTML = '<p style="text-align: center; opacity: 0.7;">No expenses to display</p>';
                    return;
                }

                // Generate pie chart gradient
                const colors = ['#2c1810', '#594a42', '#2d5a27', '#8b6e29', '#8b2e29', '#8b5cf6', '#ec4899'];
                let currentAngle = 0;
                let gradientParts = [];

                categories.forEach((category, index) => {
                    const percentage = (categoryTotals[category] / total) * 100;
                    const angle = (percentage / 100) * 360;
                    const color = colors[index % colors.length];
                    
                    gradientParts.push(`${color} ${currentAngle}deg ${currentAngle + angle}deg`);
                    currentAngle += angle;
                });

                const gradient = `conic-gradient(${gradientParts.join(', ')})`;
                document.getElementById('expenseChart').style.background = gradient;

                // Update legend
                const legendHTML = categories.map((category, index) => {
                    const percentage = ((categoryTotals[category] / total) * 100).toFixed(1);
                    const color = colors[index % colors.length];
                    return `
                        <div class="legend-item">
                            <div class="legend-color" style="background: ${color}"></div>
                            <div class="legend-text">
                                <span>${category}</span>
                                <span class="legend-percentage">${percentage}%</span>
                            </div>
                        </div>
                    `;
                }).join('');

                document.getElementById('expenseLegend').innerHTML = legendHTML;
            }

            // Calendar Management
            updateCalendar() {
                this.renderCalendar();
            }

            renderCalendar() {
                const year = this.currentDate.getFullYear();
                const month = this.currentDate.getMonth();
                
                // Update calendar header
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                   'July', 'August', 'September', 'October', 'November', 'December'];
                document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;

                // Get first day of month and number of days
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay());

                const calendarGrid = document.getElementById('calendarGrid');
                calendarGrid.innerHTML = '';

                // Add day headers
                const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                dayHeaders.forEach(day => {
                    const dayHeader = document.createElement('div');
                    dayHeader.className = 'calendar-day-header';
                    dayHeader.textContent = day;
                    calendarGrid.appendChild(dayHeader);
                });

                // Generate calendar days
                const today = new Date();
                const currentMonthTransactions = this.getTransactionsForMonth(year, month + 1);

                for (let i = 0; i < 42; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);

                    const dayElement = document.createElement('div');
                    dayElement.className = 'calendar-day';
                    dayElement.textContent = currentDate.getDate();

                    // Check if it's today
                    if (currentDate.toDateString() === today.toDateString()) {
                        dayElement.classList.add('today');
                    }

                    // Check if it's current month
                    if (currentDate.getMonth() !== month) {
                        dayElement.classList.add('other-month');
                    }

                    // Check for notes on this day
                    const dateKey = currentDate.toISOString().split('T')[0];
                    if (this.notes[dateKey]) {
                        dayElement.classList.add('has-note');
                    }

                    // Check for transactions on this day
                    const dayTransactions = currentMonthTransactions.filter(t => {
                        const transactionDate = new Date(t.date);
                        return transactionDate.toDateString() === currentDate.toDateString();
                    });

                    if (dayTransactions.length > 0) {
                        const hasIncome = dayTransactions.some(t => t.type === 'income');
                        const hasExpense = dayTransactions.some(t => t.type === 'expense');
                        
                        if (hasIncome && hasExpense) {
                            dayElement.classList.add('has-transaction');
                        } else if (hasIncome) {
                            dayElement.classList.add('has-income');
                        } else if (hasExpense) {
                            dayElement.classList.add('has-expense');
                        }
                    }

                    // Add click event for notes and calendar
                    dayElement.addEventListener('click', () => {
                        this.handleDayClick(currentDate);
                    });

                    calendarGrid.appendChild(dayElement);
                }
            }

            getTransactionsForMonth(year, month) {
                return this.transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate.getFullYear() === year && 
                           transactionDate.getMonth() === month - 1;
                });
            }

            previousMonth() {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.updateCalendar();
            }

            nextMonth() {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.updateCalendar();
            }

            handleDayClick(date) {
                this.selectedDate = date;
                const dateKey = date.toISOString().split('T')[0];
                
                // Check if there's a note for this date
                if (this.notes[dateKey]) {
                    // Show existing note
                    this.showNoteModal(date, this.notes[dateKey]);
                } else {
                    // Show empty note modal
                    this.showNoteModal(date, '');
                }
            }

            showNoteModal(date, noteText) {
                const dateKey = date.toISOString().split('T')[0];
                const formattedDate = date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });

                document.getElementById('noteDate').textContent = formattedDate;
                document.getElementById('noteTextarea').value = noteText;
                
                // Show/hide delete button based on whether note exists
                const deleteBtn = document.getElementById('deleteNoteBtn');
                if (noteText.trim()) {
                    deleteBtn.style.display = 'block';
                } else {
                    deleteBtn.style.display = 'none';
                }

                // Show modal
                document.getElementById('noteModal').classList.add('show');
            }

            closeNoteModal() {
                document.getElementById('noteModal').classList.remove('show');
                this.selectedDate = null;
            }

            saveNote() {
                if (!this.selectedDate) return;

                const noteText = document.getElementById('noteTextarea').value.trim();
                const dateKey = this.selectedDate.toISOString().split('T')[0];

                if (noteText) {
                    this.notes[dateKey] = noteText;
                    this.saveNotes();
                    this.showNotification('Note Saved!', 'Your note has been saved successfully.', 'success');
                } else {
                    // If note is empty, delete it
                    delete this.notes[dateKey];
                    this.saveNotes();
                    this.showNotification('Note Deleted!', 'Empty note has been removed.', 'success');
                }

                this.closeNoteModal();
                this.updateCalendar();
            }

            deleteNote() {
                if (!this.selectedDate) return;

                const dateKey = this.selectedDate.toISOString().split('T')[0];
                delete this.notes[dateKey];
                this.saveNotes();
                
                this.showNotification('Note Deleted!', 'Note has been deleted successfully.', 'success');
                this.closeNoteModal();
                this.updateCalendar();
            }

            saveNotes() {
                localStorage.setItem('calendarNotes', JSON.stringify(this.notes));
            }

            openPhoneCalendar(date) {
                // Format date for calendar URL
                const formattedDate = date.toISOString().split('T')[0];
                
                // Try to open phone calendar
                try {
                    // For mobile devices, try to open native calendar
                    if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {
                        // Create a calendar event URL
                        const calendarUrl = `calshow://${formattedDate}`;
                        window.location.href = calendarUrl;
                    } else {
                        // For desktop, open Google Calendar
                        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Budget+Check&dates=${formattedDate}/${formattedDate}`;
                        window.open(googleCalendarUrl, '_blank');
                    }
                } catch (error) {
                    // Fallback to Google Calendar
                    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Budget+Check&dates=${formattedDate}/${formattedDate}`;
                    window.open(googleCalendarUrl, '_blank');
                }

                // Show notification
                this.showNotification('Calendar Opened!', `Opening calendar for ${date.toLocaleDateString()}`, 'success');
            }

            // Time Period Management
            setTimePeriod(period) {
                this.currentPeriod = period;
                
                // Update active button
                document.querySelectorAll('.time-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector(`[data-period="${period}"]`).classList.add('active');
                
                this.updateUI();
            }

            updateCurrentPeriod() {
                const now = new Date();
                let periodText = '';
                
                switch (this.currentPeriod) {
                    case 'week':
                        periodText = `Week of ${now.toLocaleDateString()}`;
                        break;
                    case 'month':
                        periodText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        break;
                    case 'quarter':
                        const quarter = Math.ceil((now.getMonth() + 1) / 3);
                        periodText = `Q${quarter} ${now.getFullYear()}`;
                        break;
                    case 'year':
                        periodText = now.getFullYear().toString();
                        break;
                }
                
                document.getElementById('currentPeriod').textContent = periodText;
            }

            // Search Functionality
            searchTransactions(query) {
                const searchInput = document.getElementById('searchInput');
                const filteredTransactions = this.getFilteredTransactions().filter(t => 
                    t.description.toLowerCase().includes(query.toLowerCase()) ||
                    t.category.toLowerCase().includes(query.toLowerCase())
                );
                
                this.displaySearchResults(filteredTransactions);
            }

            displaySearchResults(transactions) {
                const container = document.getElementById('transactionsList');
                
                if (transactions.length === 0) {
                    container.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 2rem;">No matching transactions found</p>';
                    return;
                }

                container.innerHTML = transactions.map(transaction => `
                    <div class="transaction-item fade-in">
                        <div class="transaction-info">
                            <div class="transaction-title">${transaction.description}</div>
                            <div class="transaction-category">${transaction.category}</div>
                            <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="transaction-amount ${transaction.type === 'income' ? 'income' : 'expense'}">
                                ${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
                            </div>
                            <button class="delete-btn" onclick="budgetTracker.deleteTransaction(${transaction.id})">🗑️</button>
                        </div>
                    </div>
                `).join('');
            }

            // Quick Add Functionality
            quickAdd(category, amount) {
                const description = this.getQuickAddDescription(category);
                const transaction = {
                    id: Date.now(),
                    description,
                    amount,
                    type: 'expense',
                    category,
                    date: new Date().toISOString()
                };

                this.transactions.unshift(transaction);
                this.saveTransactions();
                this.updateUI();
                this.showNotification('Transaction added!', 'Quick expense added successfully.', 'success');
            }

            getQuickAddDescription(category) {
                const descriptions = {
                    food: ' Food ',
                    transport: ' Transport ',
                    entertainment: 'Entertain ',
                    education: ' Education '
                };
                return descriptions[category] || 'Quick Expense';
            }

            // Budget Goals Management
            updateGoals() {
                const container = document.getElementById('goalsGrid');
                
                if (this.goals.length === 0) {
                    container.innerHTML = '<p style="text-align: center; opacity: 0.7; grid-column: 1/-1;">No budget goals set. Add your first goal!</p>';
                    return;
                }

                container.innerHTML = this.goals.map(goal => {
                    const spent = this.getFilteredTransactions()
                        .filter(t => t.type === 'expense' && t.category === goal.category)
                        .reduce((sum, t) => sum + t.amount, 0);
                    
                    const percentage = Math.min((spent / goal.amount) * 100, 100);
                    const isOver = spent > goal.amount;
                    
                    return `
                        <div class="goal-card fade-in">
                            <div class="goal-header">
                                <div class="goal-category">${goal.category}</div>
                                <div class="goal-amount">₹${spent.toFixed(2)} / ₹${goal.amount.toFixed(2)}</div>
                            </div>
                            <div class="goal-progress">
                                <div class="goal-bar ${isOver ? 'over' : ''}" style="width: ${percentage}%"></div>
                            </div>
                            <button class="delete-btn" onclick="budgetTracker.deleteGoal('${goal.id}')" style="margin-top: 0.5rem;">Delete</button>
                        </div>
                    `;
                }).join('');
            }

            showAddGoalModal() {
                const category = prompt('Enter category for budget goal:');
                if (!category) return;
                
                const amount = parseFloat(prompt('Enter budget amount:'));
                if (!amount || amount <= 0) return;

                const goal = {
                    id: Date.now().toString(),
                    category: category.toLowerCase(),
                    amount: amount
                };

                this.goals.push(goal);
                this.saveGoals();
                this.updateUI();
                this.showNotification('Goal added!', `Budget goal for ${category} set to ₹${amount}.`, 'success');
            }

            deleteGoal(id) {
                this.goals = this.goals.filter(g => g.id !== id);
                this.saveGoals();
                this.updateUI();
                this.showNotification('Goal deleted!', 'Budget goal removed successfully.', 'success');
            }

            saveGoals() {
                localStorage.setItem('budgetGoals', JSON.stringify(this.goals));
            }

            // Reminders Management
            updateReminders() {
                const container = document.getElementById('remindersList');
                
                if (this.reminders.length === 0) {
                    container.innerHTML = '<p style="text-align: center; opacity: 0.7;">No reminders set. Add your first reminder!</p>';
                    return;
                }

                container.innerHTML = this.reminders.map(reminder => `
                    <div class="reminder-item fade-in">
                        <div class="reminder-info">
                            <div class="reminder-title">${reminder.title}</div>
                            <div class="reminder-date">Due: ${new Date(reminder.dueDate).toLocaleDateString()}</div>
                        </div>
                        <div class="reminder-actions">
                            <button class="reminder-btn complete" onclick="budgetTracker.completeReminder('${reminder.id}')">✓</button>
                            <button class="reminder-btn delete" onclick="budgetTracker.deleteReminder('${reminder.id}')">🗑️</button>
                        </div>
                    </div>
                `).join('');
            }

            showAddReminderModal() {
                const title = prompt('Enter reminder title:');
                if (!title) return;
                
                const dueDate = prompt('Enter due date (YYYY-MM-DD):');
                if (!dueDate) return;

                const reminder = {
                    id: Date.now().toString(),
                    title,
                    dueDate,
                    completed: false
                };

                this.reminders.push(reminder);
                this.saveReminders();
                this.updateUI();
                this.showNotification('Reminder added!', `Reminder "${title}" set for ${dueDate}.`, 'success');
            }

            completeReminder(id) {
                this.reminders = this.reminders.filter(r => r.id !== id);
                this.saveReminders();
                this.updateUI();
                this.showNotification('Reminder completed!', 'Reminder marked as completed.', 'success');
            }

            deleteReminder(id) {
                this.reminders = this.reminders.filter(r => r.id !== id);
                this.saveReminders();
                this.updateUI();
                this.showNotification('Reminder deleted!', 'Reminder removed successfully.', 'success');
            }

            saveReminders() {
                localStorage.setItem('reminders', JSON.stringify(this.reminders));
            }

            checkReminders() {
                const today = new Date();
                const dueReminders = this.reminders.filter(r => {
                    const dueDate = new Date(r.dueDate);
                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 3 && diffDays >= 0;
                });

                dueReminders.forEach(reminder => {
                    const dueDate = new Date(reminder.dueDate);
                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) {
                        this.showNotification('Reminder Due Today!', `"${reminder.title}" is due today!`, 'warning');
                    } else if (diffDays <= 3) {
                        this.showNotification('Reminder Due Soon!', `"${reminder.title}" is due in ${diffDays} days.`, 'warning');
                    }
                });
            }

            // Notification System
            setupNotifications() {
                // Check for overdue reminders every hour
                setInterval(() => {
                    this.checkReminders();
                }, 60 * 60 * 1000);
            }

            showNotification(title, message, type = 'success') {
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.innerHTML = `
                    <div class="notification-header">
                        <div class="notification-title">${title}</div>
                        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="notification-message">${message}</div>
                `;

                document.getElementById('notificationContainer').appendChild(notification);
                
                // Show notification
                setTimeout(() => {
                    notification.classList.add('show');
                }, 100);

                // Auto remove after 5 seconds
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, 5000);
            }

            resetForm() {
                document.getElementById('transactionForm').reset();
            }

            saveTransactions() {
                localStorage.setItem('transactions', JSON.stringify(this.transactions));
            }

            toggleTheme() {
                document.body.classList.toggle('dark-mode');
                const themeIcon = document.querySelector('.theme-icon');
                themeIcon.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
                localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            }

            loadTheme() {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'dark') {
                    document.body.classList.add('dark-mode');
                    document.querySelector('.theme-icon').textContent = '☀️';
                }
            }
        }

        // Initialize the budget tracker
        const budgetTracker = new BudgetTracker();

        // Remove automatic sample data generation - users will add their own transactions

        // Add event listener for reset button
        document.getElementById('resetBtn').addEventListener('click', function() {
            if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                localStorage.clear();
                location.reload();
            }
        });
    