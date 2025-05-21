// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const appContainer = document.getElementById('app-container');
const themeToggle = document.getElementById('theme-toggle');
const navToggle = document.getElementById('nav-toggle');
const sideNav = document.getElementById('side-nav');
const searchToggle = document.getElementById('search-toggle');
const searchBox = document.getElementById('search-box');
const searchInput = document.getElementById('search-input');
const searchClose = document.getElementById('search-close');
const notificationBtn = document.getElementById('notification-btn');
const notificationPanel = document.getElementById('notification-panel');
const notificationBadge = document.getElementById('notification-badge');
const notificationList = document.getElementById('notification-list');
const markAllRead = document.getElementById('mark-all-read');
const closeNotifications = document.getElementById('close-notifications');
const userBtn = document.getElementById('user-btn');
const userDropdown = document.getElementById('dropdown-menu');
const logoutBtn = document.getElementById('logout-btn');
const logoutModal = document.getElementById('logout-modal');
const logoutCancel = document.getElementById('logout-cancel');
const logoutConfirm = document.getElementById('logout-confirm');
const searchResultsPanel = document.getElementById('search-results-panel');
const closeSearchResults = document.getElementById('close-search-results');
const searchResultsList = document.getElementById('search-results-list');
const helpBtn = document.getElementById('help-btn');
const addGoalBtn = document.getElementById('add-goal-btn');
const setGoalBtn = document.getElementById('set-goal-btn');
const goalModal = document.getElementById('goal-modal');
const goalModalClose = document.getElementById('goal-modal-close');
const goalCancel = document.getElementById('goal-cancel');
const goalSave = document.getElementById('goal-save');
const activeCoursesEl = document.getElementById('active-courses');
const completedLessonsEl = document.getElementById('completed-lessons');
const streakDaysEl = document.getElementById('streak-days');
const learningHoursEl = document.getElementById('learning-hours');
const coursesList = document.getElementById('courses-list');
const announcementsList = document.getElementById('announcements-list');
const goalsList = document.getElementById('goals-list');
const greetingName = document.getElementById('greeting-name');
const userAvatar = document.getElementById('user-avatar');
const headerAvatar = document.getElementById('header-avatar');
const userName = document.getElementById('user-name');
const headerUsername = document.getElementById('header-username');
const userRole = document.getElementById('user-role');
const adminOnlyItems = document.querySelectorAll('.admin-only');

// Global Variables
let currentUser = null;
let notificationsListener = null;
let announcementsListener = null;
let coursesListener = null;
let goalsListener = null;
let progressChart = null;

// Initialize App
function initApp() {
  // Hide loading screen after 1 second
  setTimeout(() => {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.visibility = 'hidden';
    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }, 1000);
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeToggle(savedTheme);
  } else {
    const theme = prefersDark ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
    updateThemeToggle(theme);
  }
  
  // Initialize event listeners
  initEventListeners();
  
  // Initialize Firebase auth state listener
  initAuth();
  
  // Initialize chart
  initProgressChart();
}

// Initialize Event Listeners
function initEventListeners() {
  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
  
  // Navigation toggle
  navToggle.addEventListener('click', () => {
    sideNav.classList.toggle('active');
  });
  
  // Search functionality
  searchToggle.addEventListener('click', () => {
    searchBox.classList.toggle('active');
    if (searchBox.classList.contains('active')) {
      searchInput.focus();
    }
  });
  
  searchClose.addEventListener('click', () => {
    searchBox.classList.remove('active');
    searchInput.value = '';
  });
  
  searchInput.addEventListener('input', (e) => {
    if (e.target.value.length > 2) {
      performSearch(e.target.value);
      searchResultsPanel.classList.add('active');
    } else {
      searchResultsPanel.classList.remove('active');
    }
  });
  
  // Notifications
  notificationBtn.addEventListener('click', () => {
    notificationPanel.classList.toggle('active');
  });
  
  closeNotifications.addEventListener('click', () => {
    notificationPanel.classList.remove('active');
  });
  
  markAllRead.addEventListener('click', markAllNotificationsAsRead);
  
  // User dropdown
  userBtn.addEventListener('click', () => {
    userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.style.display = 'none';
    }
    
    if (!notificationBtn.contains(e.target) && !notificationPanel.contains(e.target)) {
      notificationPanel.classList.remove('active');
    }
    
    if (!searchToggle.contains(e.target) && !searchBox.contains(e.target) && 
        !searchResultsPanel.contains(e.target)) {
      searchBox.classList.remove('active');
      searchResultsPanel.classList.remove('active');
    }
  });
  
  // Logout functionality
  logoutBtn.addEventListener('click', () => {
    logoutModal.classList.add('active');
  });
  
  logoutCancel.addEventListener('click', () => {
    logoutModal.classList.remove('active');
  });
  
  logoutConfirm.addEventListener('click', handleLogout);
  
  logoutModalClose.addEventListener('click', () => {
    logoutModal.classList.remove('active');
  });
  
  // Search results close
  closeSearchResults.addEventListener('click', () => {
    searchResultsPanel.classList.remove('active');
  });
  
  // Help button
  helpBtn.addEventListener('click', () => {
    window.location.href = 'support.html';
  });
  
  // Goals functionality
  addGoalBtn.addEventListener('click', () => {
    goalModal.classList.add('active');
  });
  
  setGoalBtn.addEventListener('click', () => {
    goalModal.classList.add('active');
  });
  
  goalModalClose.addEventListener('click', () => {
    goalModal.classList.remove('active');
  });
  
  goalCancel.addEventListener('click', () => {
    goalModal.classList.remove('active');
  });
  
  goalSave.addEventListener('click', saveGoal);
}

// Initialize Firebase Auth
function initAuth() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      loadUserData(user.uid);
      setupNotificationsListener(user.uid);
      setupAnnouncementsListener();
      setupCoursesListener();
      setupGoalsListener(user.uid);
    } else {
      currentUser = null;
      clearUserData();
      if (notificationsListener) notificationsListener();
      if (announcementsListener) announcementsListener();
      if (coursesListener) coursesListener();
      if (goalsListener) goalsListener();
    }
  });
}

// Load User Data
async function loadUserData(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Update user info in UI
      updateUserInfo(userData);
      
      // Update dashboard stats
      updateDashboardStats(userData);
      
      // Check for admin role
      if (userData.role === 'admin') {
        adminOnlyItems.forEach(item => item.style.display = 'block');
      } else {
        adminOnlyItems.forEach(item => item.style.display = 'none');
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Update User Info in UI
function updateUserInfo(userData) {
  const displayName = userData.displayName || 'User';
  const role = userData.role === 'admin' ? 'Administrator' : 'Learner';
  
  // Update name
  if (userName) userName.textContent = displayName;
  if (headerUsername) headerUsername.textContent = displayName;
  if (greetingName) greetingName.textContent = displayName.split(' ')[0];
  
  // Update role
  if (userRole) userRole.textContent = role;
  
  // Update avatar
  if (userData.photoURL) {
    if (userAvatar) userAvatar.innerHTML = `<img src="${userData.photoURL}" alt="${displayName}">`;
    if (headerAvatar) headerAvatar.innerHTML = `<img src="${userData.photoURL}" alt="${displayName}">`;
  } else {
    const initials = displayName.split(' ').map(name => name[0]).join('');
    if (userAvatar) userAvatar.textContent = initials;
    if (headerAvatar) headerAvatar.textContent = initials;
  }
}

// Update Dashboard Stats
function updateDashboardStats(userData) {
  // Active courses
  const activeCourses = userData.enrolledCourses?.length || 0;
  if (activeCoursesEl) activeCoursesEl.textContent = activeCourses;
  
  // Completed lessons
  let completedLessons = 0;
  if (userData.enrolledCourses) {
    userData.enrolledCourses.forEach(course => {
      completedLessons += course.completedLessons || 0;
    });
  }
  if (completedLessonsEl) completedLessonsEl.textContent = completedLessons;
  
  // Streak days
  const streakDays = calculateStreak(userData.lastLogin);
  if (streakDaysEl) streakDaysEl.textContent = streakDays;
  
  // Learning hours
  const learningHours = userData.learningHours || 0;
  if (learningHoursEl) learningHoursEl.textContent = learningHours;
}

// Calculate Streak
function calculateStreak(lastLogin) {
  if (!lastLogin) return 0;
  
  const lastLoginDate = lastLogin.toDate();
  const today = new Date();
  
  // Reset time parts for accurate comparison
  lastLoginDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today - lastLoginDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 1; // Same day
  } else if (diffDays === 1) {
    return 2; // Consecutive day
  } else {
    return 0; // Broken streak
  }
}

// Clear User Data
function clearUserData() {
  if (userName) userName.textContent = 'Guest User';
  if (headerUsername) headerUsername.textContent = 'Guest';
  if (greetingName) greetingName.textContent = 'Learner';
  if (userRole) userRole.textContent = 'Visitor';
  if (userAvatar) userAvatar.innerHTML = '<i class="fas fa-user"></i>';
  if (headerAvatar) headerAvatar.innerHTML = '<i class="fas fa-user"></i>';
  
  // Reset stats
  if (activeCoursesEl) activeCoursesEl.textContent = '0';
  if (completedLessonsEl) completedLessonsEl.textContent = '0';
  if (streakDaysEl) streakDaysEl.textContent = '0';
  if (learningHoursEl) learningHoursEl.textContent = '0';
  
  // Clear admin items
  adminOnlyItems.forEach(item => item.style.display = 'none');
  
  // Clear lists
  if (coursesList) coursesList.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-book-open"></i>
      <p>No active courses</p>
      <a href="explore.html" class="btn btn-primary">Browse Courses</a>
    </div>
  `;
  
  if (goalsList) goalsList.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-bullseye"></i>
      <p>No goals set yet</p>
      <button class="btn btn-primary" id="set-goal-btn">Set a Goal</button>
    </div>
  `;
}

// Initialize Progress Chart
function initProgressChart() {
  const ctx = document.getElementById('progress-chart').getContext('2d');
  
  progressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [
        {
          label: 'Completion',
          data: [30, 45, 60, 65, 75, 80, 90],
          borderColor: '#4361ee',
          backgroundColor: 'rgba(67, 97, 238, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Performance',
          data: [40, 50, 55, 60, 70, 75, 85],
          borderColor: '#4895ef',
          backgroundColor: 'rgba(72, 149, 239, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    }
  });
}

// Setup Notifications Listener
function setupNotificationsListener(userId) {
  notificationsListener = db.collection('users').doc(userId).collection('notifications')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .onSnapshot((snapshot) => {
      let unreadCount = 0;
      notificationList.innerHTML = '';
      
      if (snapshot.empty) {
        notificationList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-bell-slash"></i>
            <p>No notifications yet</p>
          </div>
        `;
        notificationBadge.style.display = 'none';
        return;
      }
      
      snapshot.forEach(doc => {
        const notification = doc.data();
        const isUnread = !notification.read;
        
        if (isUnread) unreadCount++;
        
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${isUnread ? 'unread' : ''}`;
        notificationItem.dataset.id = doc.id;
        notificationItem.innerHTML = `
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${formatTime(notification.timestamp?.toDate())}</div>
        `;
        
        notificationItem.addEventListener('click', () => {
          markNotificationAsRead(doc.id);
        });
        
        notificationList.appendChild(notificationItem);
      });
      
      // Update badge
      if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = 'flex';
      } else {
        notificationBadge.style.display = 'none';
      }
    });
}

// Mark Notification as Read
async function markNotificationAsRead(notificationId) {
  try {
    await db.collection('users').doc(currentUser.uid)
      .collection('notifications').doc(notificationId)
      .update({ read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Mark All Notifications as Read
async function markAllNotificationsAsRead() {
  try {
    const snapshot = await db.collection('users').doc(currentUser.uid)
      .collection('notifications')
      .where('read', '==', false)
      .get();
    
    const batch = db.batch();
    snapshot.forEach(doc => {
      const ref = db.collection('users').doc(currentUser.uid)
        .collection('notifications').doc(doc.id);
      batch.update(ref, { read: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Setup Announcements Listener
function setupAnnouncementsListener() {
  announcementsListener = db.collection('announcements')
    .orderBy('timestamp', 'desc')
    .limit(5)
    .onSnapshot((snapshot) => {
      announcementsList.innerHTML = '';
      
      if (snapshot.empty) {
        announcementsList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-bullhorn"></i>
            <p>No announcements yet</p>
          </div>
        `;
        return;
      }
      
      snapshot.forEach(doc => {
        const announcement = doc.data();
        const announcementItem = document.createElement('div');
        announcementItem.className = 'announcement-item';
        announcementItem.innerHTML = `
          <div class="announcement-content">
            <h4>${announcement.title}</h4>
            <p>${announcement.content.substring(0, 100)}...</p>
          </div>
          <div class="announcement-meta">
            <span class="announcement-date">${formatTime(announcement.timestamp?.toDate())}</span>
            ${isNew(announcement.timestamp?.toDate()) ? '<span class="announcement-badge">New</span>' : ''}
          </div>
        `;
        
        announcementItem.addEventListener('click', () => {
          window.location.href = `announcement.html?id=${doc.id}`;
        });
        
        announcementsList.appendChild(announcementItem);
      });
    });
}

// Setup Courses Listener
function setupCoursesListener() {
  coursesListener = db.collection('courses')
    .where('enrolledUsers', 'array-contains', currentUser.uid)
    .limit(4)
    .onSnapshot((snapshot) => {
      coursesList.innerHTML = '';
      
      if (snapshot.empty) {
        coursesList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-book-open"></i>
            <p>No active courses</p>
            <a href="explore.html" class="btn btn-primary">Browse Courses</a>
          </div>
        `;
        return;
      }
      
      snapshot.forEach(doc => {
        const course = doc.data();
        const progress = Math.floor((course.completedLessons || 0) / (course.totalLessons || 1) * 100);
        
        const courseItem = document.createElement('div');
        courseItem.className = 'course-item';
        courseItem.innerHTML = `
          <div class="course-image">
            <i class="fas fa-book"></i>
          </div>
          <div class="course-info">
            <div class="course-title">${course.title}</div>
            <div class="course-progress">
              <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <div class="course-meta">
              <span>${course.completedLessons || 0}/${course.totalLessons || 0} lessons</span>
              <span>${progress}%</span>
            </div>
          </div>
        `;
        
        courseItem.addEventListener('click', () => {
          window.location.href = `course.html?id=${doc.id}`;
        });
        
        coursesList.appendChild(courseItem);
      });
    });
}

// Setup Goals Listener
function setupGoalsListener(userId) {
  goalsListener = db.collection('users').doc(userId).collection('goals')
    .orderBy('dueDate')
    .limit(3)
    .onSnapshot((snapshot) => {
      goalsList.innerHTML = '';
      
      if (snapshot.empty) {
        goalsList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-bullseye"></i>
            <p>No goals set yet</p>
            <button class="btn btn-primary" id="set-goal-btn">Set a Goal</button>
          </div>
        `;
        return;
      }
      
      snapshot.forEach(doc => {
        const goal = doc.data();
        const dueDate = goal.dueDate?.toDate();
        
        const goalItem = document.createElement('div');
        goalItem.className = 'goal-item';
        goalItem.innerHTML = `
          <div class="goal-header">
            <div class="goal-title">${goal.title}</div>
            <div class="goal-priority ${goal.priority}">${goal.priority}</div>
          </div>
          <div class="goal-description">${goal.description}</div>
          <div class="goal-progress">
            <div class="goal-progress-bar" style="width: ${goal.progress || 0}%"></div>
          </div>
          <div class="goal-footer">
            <span>${formatDate(dueDate)}</span>
            <span>${goal.progress || 0}% complete</span>
          </div>
        `;
        
        goalsList.appendChild(goalItem);
      });
    });
}

// Save Goal
async function saveGoal() {
  const title = document.getElementById('goal-title').value;
  const description = document.getElementById('goal-description').value;
  const dueDate = document.getElementById('goal-date').value;
  const priority = document.getElementById('goal-priority').value;
  
  if (!title || !dueDate) {
    alert('Please fill in all required fields');
    return;
  }
  
  try {
    await db.collection('users').doc(currentUser.uid).collection('goals').add({
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
      progress: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Clear form
    document.getElementById('goal-title').value = '';
    document.getElementById('goal-description').value = '';
    document.getElementById('goal-date').value = '';
    document.getElementById('goal-priority').value = 'medium';
    
    // Close modal
    goalModal.classList.remove('active');
  } catch (error) {
    console.error('Error saving goal:', error);
    alert('Failed to save goal. Please try again.');
  }
}

// Perform Search
async function performSearch(query) {
  try {
    // Search courses
    const coursesQuery = db.collection('courses')
      .where('keywords', 'array-contains', query.toLowerCase())
      .limit(5);
    
    // Search announcements
    const announcementsQuery = db.collection('announcements')
      .where('keywords', 'array-contains', query.toLowerCase())
      .limit(5);
    
    // Search resources
    const resourcesQuery = db.collection('resources')
      .where('keywords', 'array-contains', query.toLowerCase())
      .limit(5);
    
    const [coursesSnapshot, announcementsSnapshot, resourcesSnapshot] = await Promise.all([
      coursesQuery.get(),
      announcementsQuery.get(),
      resourcesQuery.get()
    ]);
    
    searchResultsList.innerHTML = '';
    
    if (coursesSnapshot.empty && announcementsSnapshot.empty && resourcesSnapshot.empty) {
      searchResultsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <p>No results found for "${query}"</p>
        </div>
      `;
      return;
    }
    
    // Process courses
    if (!coursesSnapshot.empty) {
      coursesSnapshot.forEach(doc => {
        const course = doc.data();
        const resultItem = createSearchResultItem({
          id: doc.id,
          type: 'course',
          title: course.title,
          description: course.description,
          icon: 'fas fa-book'
        });
        searchResultsList.appendChild(resultItem);
      });
    }
    
    // Process announcements
    if (!announcementsSnapshot.empty) {
      announcementsSnapshot.forEach(doc => {
        const announcement = doc.data();
        const resultItem = createSearchResultItem({
          id: doc.id,
          type: 'announcement',
          title: announcement.title,
          description: announcement.content,
          icon: 'fas fa-bullhorn'
        });
        searchResultsList.appendChild(resultItem);
      });
    }
    
    // Process resources
    if (!resourcesSnapshot.empty) {
      resourcesSnapshot.forEach(doc => {
        const resource = doc.data();
        const resultItem = createSearchResultItem({
          id: doc.id,
          type: 'resource',
          title: resource.title,
          description: resource.description,
          icon: 'fas fa-file-alt'
        });
        searchResultsList.appendChild(resultItem);
      });
    }
  } catch (error) {
    console.error('Error performing search:', error);
    searchResultsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error performing search. Please try again.</p>
      </div>
    `;
  }
}

// Create Search Result Item
function createSearchResultItem({ id, type, title, description, icon }) {
  const resultItem = document.createElement('div');
  resultItem.className = 'search-result-item';
  resultItem.innerHTML = `
    <span class="search-result-type ${type}">
      <i class="${icon}"></i> ${type}
    </span>
    <div class="search-result-title">${title}</div>
    <div class="search-result-description">${description.substring(0, 100)}...</div>
  `;
  
  resultItem.addEventListener('click', () => {
    if (type === 'course') {
      window.location.href = `course.html?id=${id}`;
    } else if (type === 'announcement') {
      window.location.href = `announcement.html?id=${id}`;
    } else if (type === 'resource') {
      window.location.href = `resource.html?id=${id}`;
    }
    searchResultsPanel.classList.remove('active');
  });
  
  return resultItem;
}

// Toggle Theme
function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggle(newTheme);
}

// Update Theme Toggle Button
function updateThemeToggle(theme) {
  if (theme === 'dark') {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
  } else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
  }
}

// Handle Logout
async function handleLogout() {
  try {
    await auth.signOut();
    logoutModal.classList.remove('active');
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error logging out:', error);
    alert('Failed to logout. Please try again.');
  }
}

// Format Time
function formatTime(date) {
  if (!date) return 'Just now';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}

// Format Date
function formatDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Check if date is recent (within 3 days)
function isNew(date) {
  if (!date) return false;
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  return diffInDays < 3;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
