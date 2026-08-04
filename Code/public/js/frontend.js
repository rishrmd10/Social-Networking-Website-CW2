// API base URL with my student number
const BASE_URL = 'http://localhost:8080/M00994477';

// keep track of logged in user
let currentUser = null;

// when page loads, check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {   
    checkLoginStatus();
    
    // add enter key support for login
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                login();
            }
        });
    }
    
    // add enter key support for registration
    const regFullName = document.getElementById('regFullName');
    if (regFullName) {
        regFullName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                register();
            }
        });
    }
    
    // handle profile picture upload
    setTimeout(() => {
        const profilePicInput = document.getElementById('profilePicUpload');
        if (profilePicInput) {
            profilePicInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const formData = new FormData();
                formData.append('profilePic', file);
                
                try {
                    const response = await fetch(`${BASE_URL}/profile-picture`, {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        document.getElementById('profilePic').src = data.profilePicUrl;
                        showMessage('Profile picture updated!');
                    } else {
                        showMessage('Error updating profile picture', true);
                    }
                } catch (error) {
                    console.error('Profile picture error:', error);
                    showMessage('Error uploading picture', true);
                }
            });
        }
    }, 1000);
});

// show notification messages to user
function showMessage(text, isError = false) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = isError ? 'message error' : 'message success';
    messageDiv.classList.remove('hidden');
    
    // hide message after 3 seconds
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 3000);
}

// switch between tabs
function showTab(tabName) {
    // hide all tabs first
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // remove active from buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
 // map tab names to IDs
const tabMap = {
    'share': 'shareTab',
    'findPeople': 'findPeopleTab',
    'friendRequests': 'friendRequestsTab',
    'following': 'followingTab',
    'explorePosts': 'explorePostsTab',
    'myFeed': 'myFeedTab',
    'squad': 'squadTab',
    'stats': 'statsTab',
    'profile': 'profileTab'
};
    
    // show the selected tab
    const selectedTab = document.getElementById(tabMap[tabName]);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // highlight the active button - find button with matching onclick
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });
    
    // load data automatically for certain tabs
    if (tabName === 'myFeed') {
        loadFeed();
    } else if (tabName === 'following') {
        loadFollowing();
    }
}

// show login section and hide registration
function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('registrationSection').classList.add('hidden');
    const forgotSection = document.getElementById('forgotPasswordSection');
    if (forgotSection) {
        forgotSection.classList.add('hidden');
    }
}

// show registration section and hide login
function showRegistration() {
    document.getElementById('registrationSection').classList.remove('hidden');
    document.getElementById('loginSection').classList.add('hidden');
    const forgotSection = document.getElementById('forgotPasswordSection');
    if (forgotSection) {
        forgotSection.classList.add('hidden');
    }
}

// show forgot password section
function showForgotPassword() {
    const forgotSection = document.getElementById('forgotPasswordSection');
    if (forgotSection) {
        forgotSection.classList.remove('hidden');
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('registrationSection').classList.add('hidden');
    }
}

// check if user is logged in when page loads
async function checkLoginStatus() {
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.loggedIn) {
            currentUser = data.username;
            showApp();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Error checking login:', error);
        showLogin();
    }
}

// register a new user
async function register() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const fullName = document.getElementById('regFullName').value.trim();
    
    // validate all fields are filled
    if (!username || !email || !password || !fullName) {
        showMessage('Please fill in all fields', true);
        return;
    }
    
    // validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email', true);
        return;
    }
    
    // validate password length
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', true);
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, fullName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Registration successful! Please login.');
            showLogin();
            // clear the form fields
            document.getElementById('regUsername').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regFullName').value = '';
        } else {
            showMessage(data.message || 'Registration failed', true);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Error registering user', true);
    }
}

// reset password
async function resetPassword() {
    const username = document.getElementById('resetUsername').value.trim();
    const email = document.getElementById('resetEmail').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // validate fields
    if (!username || !email || !newPassword || !confirmPassword) {
        showMessage('Please fill in all fields', true);
        return;
    }
    
    // check passwords match
    if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match', true);
        return;
    }
    
    // validate password length
    if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters', true);
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Password reset successful! Please login with your new password.');
            showLogin();
            // clear form
            document.getElementById('resetUsername').value = '';
            document.getElementById('resetEmail').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            showMessage(data.message || 'Password reset failed', true);
        }
    } catch (error) {
        console.error('Password reset error:', error);
        showMessage('Error resetting password', true);
    }
}

// login user
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showMessage('Please enter username and password', true);
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            currentUser = username;
            showMessage('Login successful!');
            showApp();
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        } else {
            showMessage(data.message || 'Login failed', true);
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Error logging in', true);
    }
}

// logout user
async function logout() {
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = null;
            showMessage('Logged out successfully');
            showLogin();
            document.getElementById('appSection').classList.add('hidden');
        } else {
            showMessage('Error logging out', true);
        }
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Error logging out', true);
    }
}

// show the main app interface
function showApp() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registrationSection').classList.add('hidden');
    const forgotSection = document.getElementById('forgotPasswordSection');
    if (forgotSection) {
        forgotSection.classList.add('hidden');
    }
    document.getElementById('appSection').classList.remove('hidden');
    document.getElementById('welcomeUser').textContent = currentUser;
    
    // load user profile data
    loadUserProfile();
    
    // load the feed when app opens
    loadFeed();
}

// create a new post
async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    const imageFile = document.getElementById('imageUpload').files[0];
    
    if (!content) {
        showMessage('Please enter some content', true);
        return;
    }
    
    try {
        let imageUrl = null;
        
        // upload image if one was selected
        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }
        
        const response = await fetch(`${BASE_URL}/contents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ 
                content, 
                imageUrl,
                username: currentUser 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Post created successfully!');
            // clear the form
            document.getElementById('postContent').value = '';
            document.getElementById('imageUpload').value = '';
            loadFeed();
        } else {
            showMessage(data.message || 'Error creating post', true);
        }
    } catch (error) {
        console.error('Post creation error:', error);
        showMessage('Error creating post', true);
    }
}

// upload image to server
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch(`${BASE_URL}/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return data.imageUrl;
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Image upload error:', error);
        return null;
    }
}

// search for users
async function searchUsers() {
    const query = document.getElementById('userSearch').value.trim();
    
    if (!query) {
        showMessage('Please enter a search term', true);
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/users?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        const resultsDiv = document.getElementById('userResults');
        resultsDiv.innerHTML = '';
        
        if (response.ok && data.users && data.users.length > 0) {
            data.users.forEach(user => {
                // Don't show current user in results
                if (user.username !== currentUser) {
                    const userDiv = document.createElement('div');
                    userDiv.className = 'result-item';
                    userDiv.innerHTML = `
                        <div>
                            <strong>${user.username}</strong><br>
                            <small>${user.fullName || ''}</small>
                        </div>
                        <button onclick="sendFriendRequest('${user.username}')" style="background: #DA291C; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: 500;">
                            Send Request 📩
                        </button>
                    `;
                    resultsDiv.appendChild(userDiv);
                }
            });
        } else {
            resultsDiv.innerHTML = '<p>No users found</p>';
        }
    } catch (error) {
        console.error('User search error:', error);
        showMessage('Error searching users', true);
    }
}

// follow a user
async function followUser(username) {
    try {
        const response = await fetch(`${BASE_URL}/follow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ followUsername: username })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(`Now following ${username}!`);
        } else {
            showMessage(data.message || 'Error following user', true);
        }
    } catch (error) {
        console.error('Follow error:', error);
        showMessage('Error following user', true);
    }
}

// search for posts/contents
async function searchContents() {
    const query = document.getElementById('contentSearch').value.trim();
    
    if (!query) {
        showMessage('Please enter a search term', true);
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/contents?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        const resultsDiv = document.getElementById('contentResults');
        resultsDiv.innerHTML = '';
        
        if (response.ok && data.contents && data.contents.length > 0) {
            data.contents.forEach(content => {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'feed-item';
                contentDiv.innerHTML = `
                    <div class="feed-item-header">
                        <span>${content.username}</span>
                        <span class="feed-item-date">${new Date(content.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="feed-item-content">${content.content}</div>
                    ${content.imageUrl ? `<img src="${content.imageUrl}" class="feed-item-image" alt="Post image">` : ''}
                `;
                resultsDiv.appendChild(contentDiv);
            });
        } else {
            resultsDiv.innerHTML = '<p>No posts found</p>';
        }
    } catch (error) {
        console.error('Content search error:', error);
        showMessage('Error searching contents', true);
    }
}

// load user's feed (posts from followed users only)
async function loadFeed() {
    try {
        const response = await fetch(`${BASE_URL}/feed`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        const feedDiv = document.getElementById('feed');
        feedDiv.innerHTML = '';
        
        if (response.ok && data.feed && data.feed.length > 0) {
            data.feed.forEach(content => {
                const contentDiv = document.createElement('div');
                contentDiv.className = 'feed-item';
                contentDiv.innerHTML = `
                    <div class="feed-item-header">
                        <span>${content.username}</span>
                        <span class="feed-item-date">${new Date(content.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="feed-item-content">${content.content}</div>
                    ${content.imageUrl ? `<img src="${content.imageUrl}" class="feed-item-image" alt="Post image">` : ''}
                `;
                feedDiv.appendChild(contentDiv);
            });
        } else {
            feedDiv.innerHTML = '<p>No posts in your feed yet. Follow some users to see their posts!</p>';
        }
    } catch (error) {
        console.error('Feed load error:', error);
        showMessage('Error loading feed', true);
    }
}

// load list of people you're following
async function loadFollowing() {
    try {
        const response = await fetch(`${BASE_URL}/following`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        const resultsDiv = document.getElementById('followingResults');
        resultsDiv.innerHTML = '';
        
        if (response.ok && data.following && data.following.length > 0) {
            data.following.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.className = 'result-item';
                userDiv.innerHTML = `
                    <div>
                        <strong>${user.username}</strong><br>
                        <small>${user.fullName || ''}</small>
                    </div>
                    <button onclick="unfollowUser('${user.username}')">Unfollow</button>
                `;
                resultsDiv.appendChild(userDiv);
            });
        } else {
            resultsDiv.innerHTML = '<p>You are not following anyone yet. Go to "Find People" to follow users!</p>';
        }
    } catch (error) {
        console.error('Error loading following:', error);
        showMessage('Error loading following list', true);
    }
}

// unfollow a user
async function unfollowUser(username) {
    try {
        const response = await fetch(`${BASE_URL}/follow`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ followUsername: username })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(`Unfollowed ${username}`);
            loadFollowing(); // refresh the list
        } else {
            showMessage(data.message || 'Error unfollowing user', true);
        }
    } catch (error) {
        console.error('Unfollow error:', error);
        showMessage('Error unfollowing user', true);
    }
}

// Get Premier League standings table for the 2025/26 season
async function getStandings() {
    const standingsDiv = document.getElementById('standingsData');
    
    // Shows a friendly loading message while we fetch the data
    standingsDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Loading Premier League standings...</p>';
    
    try {
        // Fetch standings data from our backend API
        const response = await fetch(`${BASE_URL}/standings`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        // Check if we successfully got the standings data
        if (response.ok && data.standings) {
            // Start building our HTML with a hide/show button
            let html = `
                <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                    <button onclick="toggleStandings()" id="toggleStandingsBtn" style="background: #37003C; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: 500; transition: background 0.3s;">
                        Hide Standings
                    </button>
                </div>
                <div id="standingsContent" style="background: white; border-radius: 8px; overflow: hidden; margin-top: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Premier League header -->
                    <div style="background: linear-gradient(135deg, #37003C 0%, #510449 100%); padding: 20px; text-align: center;">
                        <h2 style="color: white; margin: 0; font-size: 1.8em;">⚽ Premier League 2025/26</h2>
                        <p style="color: #e0e0e0; margin: 5px 0 0 0; font-size: 0.9em;">Season Standings</p>
                    </div>
                    
                    <!-- Standings table -->
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #DA291C; color: white;">
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600;">Pos</th>
                                <th style="padding: 12px 10px; text-align: left; font-weight: 600;">Team</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600;">P</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600;">W</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600;">D</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600;">L</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600;">GD</th>
                                <th style="padding: 12px 10px; text-align: center; font-weight: 600;">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Loop through each team in the standings and add them to the table
            data.standings.forEach((team, index) => {
                // Check if this is Manchester United's row
                const isManUtd = team.team.includes('Manchester United');
                
                // Decides the background color based on league position
                let rowColor = '';
                if (isManUtd) {
                    // Bright yellow for Man United so it stands out
                    rowColor = '#FFE600';
                } else if (team.position <= 4) {
                    // Light green for Champions League spots (top 4)
                    rowColor = '#E8F5E9';
                } else if (team.position === 5) {
                    // Light orange for Europa League spot (5th place)
                    rowColor = '#FFF3E0';
                } else if (team.position >= 18) {
                    // Light red for relegation zone (bottom 3)
                    rowColor = '#FFEBEE';
                } else {
                    // Alternate white and light gray for other positions
                    rowColor = index % 2 === 0 ? '#f9f9f9' : 'white';
                }
                
                // Make Manchester United's text bold
                const fontWeight = isManUtd ? 'bold' : 'normal';
                
                // Build the HTML row for this team
                html += `
                    <tr style="background: ${rowColor}; transition: transform 0.2s;" 
                        onmouseover="this.style.transform='scale(1.01)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';" 
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        
                        <!-- Position -->
                        <td style="padding: 12px 10px; border-bottom: 1px solid #ddd; text-align: center; font-weight: ${fontWeight};">
                            ${team.position}
                        </td>
                        
                        <!-- Team name with crest -->
                        <td style="padding: 12px 10px; border-bottom: 1px solid #ddd; font-weight: ${fontWeight};">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${team.crest ? `<img src="${team.crest}" style="width: 24px; height: 24px;" alt="${team.team}">` : ''}
                                <span>${team.team}</span>
                            </div>
                        </td>
                        
                        <!-- Played (games played) -->
                        <td style="padding: 12px 10px; border-bottom: 1px solid #ddd; text-align: center; font-weight: ${fontWeight};">
                            ${team.played}
                        </td>
                        
                        <!-- Won -->
                        <td style="padding: 12px 10px; border-bottom: 1px solid #ddd; text-align: center; font-weight: ${fontWeight};">
                            ${team.won}
                        </td>
                        
                        <!-- Drawn -->
                        <td style="padding: 12px 10px; border-bottom: 1px solid #ddd; text-align: center; font-weight: ${fontWeight};">
                            ${team.drawn}
                        </td>
                        
                        <!-- Lost -->
                        <td style="padding: 12px 10px; border-bottom: 1px solid #ddd; text-align: center; font-weight: ${fontWeight};">
                            ${team.lost}
                        </td>
                        
                        <!-- Goal Difference -->
                        <td style="padding: 12px 10px; border-bottom: 1px solid #ddd; text-align: center; font-weight: ${fontWeight};">
                            ${team.goalDifference || 0}
                        </td>
                        
                        <!-- Points (most important column, shown in red) -->
                        <td style="padding: 12px 10px; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; color: #DA291C;">
                            ${team.points}
                        </td>
                    </tr>
                `;
            });
            
            // Close the table and add a legend explaining the colors
            html += `
                        </tbody>
                    </table>
                    
                    <!-- Legend showing what each color means -->
                    <div style="padding: 15px; background: #f5f5f5; font-size: 0.85em; color: #666; border-top: 2px solid #ddd;">
                        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
                            <div>
                                <span style="display: inline-block; width: 15px; height: 15px; background: #E8F5E9; border: 1px solid #ddd; margin-right: 5px;"></span>
                                Champions League
                            </div>
                            <div>
                                <span style="display: inline-block; width: 15px; height: 15px; background: #FFF3E0; border: 1px solid #ddd; margin-right: 5px;"></span>
                                Europa League
                            </div>
                            <div>
                                <span style="display: inline-block; width: 15px; height: 15px; background: #FFEBEE; border: 1px solid #ddd; margin-right: 5px;"></span>
                                Relegation Zone
                            </div>
                            <div>
                                <span style="display: inline-block; width: 15px; height: 15px; background: #FFE600; border: 1px solid #ddd; margin-right: 5px;"></span>
                                Manchester United
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            standingsDiv.innerHTML = html;
            
        } else {
            // Show error message if no standings data is available
            standingsDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #dc3545;">Standings data unavailable</p>';
        }
    } catch (error) {
        // Show error message if something went wrong
        console.error('Standings error:', error);
        standingsDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #dc3545;">Error loading standings. Please try again.</p>';
    }
}

// Show or hide the standings table when the button is clicked
function toggleStandings() {
    const standingsContent = document.getElementById('standingsContent');
    const toggleButton = document.getElementById('toggleStandingsBtn');
    
    // Check if the standings are currently hidden
    if (standingsContent.style.display === 'none') {
        // Show the standings
        standingsContent.style.display = 'block';
        toggleButton.textContent = 'Hide Standings';
        toggleButton.style.background = '#37003C';  // Purple button
    } else {
        // Hide the standings
        standingsContent.style.display = 'none';
        toggleButton.textContent = 'Show Standings';
        toggleButton.style.background = '#DA291C';  // Red button
    }
}
// change password from profile
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPasswordProfile').value;
    const confirmPassword = document.getElementById('confirmPasswordProfile').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('Please fill in all fields', true);
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match', true);
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters', true);
        return;
    }
    
    try {
        const response = await fetch(`${BASE_URL}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Password changed successfully!');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPasswordProfile').value = '';
            document.getElementById('confirmPasswordProfile').value = '';
        } else {
            showMessage(data.message || 'Error changing password', true);
        }
    } catch (error) {
        console.error('Password change error:', error);
        showMessage('Error changing password', true);
    }
}

// handle profile picture upload
setTimeout(() => {
    const profilePicInput = document.getElementById('profilePicUpload');
    if (profilePicInput) {
        profilePicInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('profilePic', file);
            
            try {
                const response = await fetch(`${BASE_URL}/profile-picture`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // update both profile pictures
                    document.getElementById('profilePic').src = data.profilePicUrl;
                    document.getElementById('headerProfilePic').src = data.profilePicUrl;
                    showMessage('Profile picture updated!');
                } else {
                    showMessage('Error updating profile picture', true);
                }
            } catch (error) {
                console.error('Profile picture error:', error);
                showMessage('Error uploading picture', true);
            }
        });
    }
}, 1000);

// Load user profile data - called when app loads
async function loadUserProfile() {
    try {
        const response = await fetch(`${BASE_URL}/profile`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.user) {
            // Set profile picture or use default placeholder
            const profilePicUrl = data.user.profilePicture || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%23DA291C"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E' + (currentUser ? currentUser[0].toUpperCase() : 'U') + '%3C/text%3E%3C/svg%3E';
            
            const profilePic = document.getElementById('profilePic');
            const headerProfilePic = document.getElementById('headerProfilePic');
            
            if (profilePic) {
                profilePic.src = profilePicUrl;
                profilePic.style.display = 'block';
                profilePic.onerror = function() {
                    // Fallback if image fails to load
                    this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%23DA291C"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E' + (currentUser ? currentUser[0].toUpperCase() : 'U') + '%3C/text%3E%3C/svg%3E';
                };
            }
            
            if (headerProfilePic) {
                headerProfilePic.src = profilePicUrl;
                headerProfilePic.style.display = 'block';
                headerProfilePic.onerror = function() {
                    this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%23DA291C"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E' + (currentUser ? currentUser[0].toUpperCase() : 'U') + '%3C/text%3E%3C/svg%3E';
                };
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        // Set default avatar on error
        const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%23DA291C"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="Arial"%3E' + (currentUser ? currentUser[0].toUpperCase() : 'U') + '%3C/text%3E%3C/svg%3E';
        
        const profilePic = document.getElementById('profilePic');
        const headerProfilePic = document.getElementById('headerProfilePic');
        
        if (profilePic) profilePic.src = defaultAvatar;
        if (headerProfilePic) headerProfilePic.src = defaultAvatar;
    }
}

// Initialise profile picture upload handler
function initProfilePictureUpload() {
    const profilePicInput = document.getElementById('profilePicUpload');
    if (!profilePicInput) return;
    
    // Remove any existing listeners
    const newInput = profilePicInput.cloneNode(true);
    profilePicInput.parentNode.replaceChild(newInput, profilePicInput);
    
    newInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file type
        if (!file.type.startsWith('image/')) {
            showMessage('Please select an image file', true);
            e.target.value = '';
            return;
        }
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Image must be less than 5MB', true);
            e.target.value = '';
            return;
        }
        
        // Show loading state
        const profilePic = document.getElementById('profilePic');
        const headerProfilePic = document.getElementById('headerProfilePic');
        const originalSrc = profilePic ? profilePic.src : '';
        
        showMessage('Uploading picture...');
        
        const formData = new FormData();
        formData.append('profilePic', file);
        
        try {
            const response = await fetch(`${BASE_URL}/profile-picture`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok && data.profilePicUrl) {
                // Create a new image to preload
                const img = new Image();
                img.onload = function() {
                    // Update both profile pictures once image is loaded
                    if (profilePic) {
                        profilePic.src = data.profilePicUrl;
                        profilePic.style.display = 'block';
                    }
                    if (headerProfilePic) {
                        headerProfilePic.src = data.profilePicUrl;
                        headerProfilePic.style.display = 'block';
                    }
                    showMessage('Profile picture updated!');
                };
                img.onerror = function() {
                    showMessage('Error loading new picture', true);
                    if (profilePic) profilePic.src = originalSrc;
                    if (headerProfilePic) headerProfilePic.src = originalSrc;
                };
                img.src = data.profilePicUrl;
            } else {
                showMessage(data.message || 'Error updating profile picture', true);
            }
        } catch (error) {
            console.error('Profile picture error:', error);
            showMessage('Error uploading picture', true);
            // Restore original picture on error
            if (profilePic) profilePic.src = originalSrc;
            if (headerProfilePic) headerProfilePic.src = originalSrc;
        } finally {
            // Clear the input so the same file can be selected again if needed
            e.target.value = '';
        }
    });
}

// Update the showApp function to include profile picture initialization
function showApp() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registrationSection').classList.add('hidden');
    const forgotSection = document.getElementById('forgotPasswordSection');
    if (forgotSection) {
        forgotSection.classList.add('hidden');
    }
    document.getElementById('appSection').classList.remove('hidden');
    document.getElementById('welcomeUser').textContent = currentUser;
    
    // Load user profile data first
    loadUserProfile();
    
    // Initialize profile picture upload after a short delay
    setTimeout(() => {
        initProfilePictureUpload();
    }, 500);
    
    // Load the feed when app opens
    loadFeed();
}

// Load list of people you're following 
async function loadFollowing() {
    const resultsDiv = document.getElementById('followingResults');
    
    // Show loading state
    if (resultsDiv) {
        resultsDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Loading your following list...</p>';
    }
    
    try {
        const response = await fetch(`${BASE_URL}/following`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Log the response for debugging
        console.log('Following response status:', response.status);
        
        const data = await response.json();
        console.log('Following data received:', data);
        
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = '';
        
        if (response.ok) {
            // Check multiple possible response formats
            const followingList = data.following || data.users || data.data || [];
            
            if (followingList && followingList.length > 0) {
                // Create a container for better styling
                const container = document.createElement('div');
                container.style.cssText = 'display: grid; gap: 15px; margin-top: 15px;';
                
                followingList.forEach(user => {
                    const userDiv = document.createElement('div');
                    userDiv.className = 'result-item';
                    userDiv.style.cssText = 'background: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
                    
                    const username = user.username || user.followUsername || user.name || 'Unknown';
                    const fullName = user.fullName || user.full_name || user.name || '';
                    
                    userDiv.innerHTML = `
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: #DA291C; font-size: 1.1em;">${username}</div>
                            ${fullName ? `<div style="color: #666; font-size: 0.9em; margin-top: 3px;">${fullName}</div>` : ''}
                        </div>
                        <button onclick="unfollowUser('${username}')" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: 500;">Unfollow</button>
                    `;
                    container.appendChild(userDiv);
                });
                
                resultsDiv.appendChild(container);
            } else {
                resultsDiv.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; margin-top: 15px;">
                        <div style="font-size: 3em; margin-bottom: 15px;">👥</div>
                        <p style="color: #666; font-size: 1.1em;">You're not following anyone yet!</p>
                        <p style="color: #999; margin-top: 10px;">Head to "Find People" to discover and follow users.</p>
                    </div>
                `;
            }
        } else {
            console.error('Error response:', data);
            resultsDiv.innerHTML = `
                <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <p style="color: #856404; margin: 0;">${data.message || 'Unable to load following list. Please try again.'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading following:', error);
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <p style="color: #721c24; margin: 0;">Network error: Unable to load following list. Please check your connection and try again.</p>
                </div>
            `;
        }
    }
}

// Unfollow a user with modal
async function unfollowUser(username) {
    // Modal HTML
    const modalHTML = `
        <div id="unfollowModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <h3 style="margin: 0 0 15px 0; color: #DA291C; font-size: 1.3em;">Unfollow ${username}?</h3>
                <p style="color: #666; margin-bottom: 25px;">Are you sure you want to unfollow this user? You can always follow them again later.</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="closeUnfollowModal()" style="background: #f0f0f0; color: #333; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: 500;">
                        Cancel
                    </button>
                    <button onclick="confirmUnfollow('${username}')" style="background: #DA291C; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: 500;">
                        Unfollow
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add the modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close the unfollow confirmation modal
function closeUnfollowModal() {
    const modal = document.getElementById('unfollowModal');
    if (modal) {
        modal.remove();
    }
}

// Actually perform the unfollow action after confirmation
async function confirmUnfollow(username) {
    // Close the modal first
    closeUnfollowModal();
    
    try {
        const response = await fetch(`${BASE_URL}/follow`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ followUsername: username })
        });
        
        const data = await response.json();
        console.log('Unfollow response:', data);
        
        if (response.ok) {
            showMessage(`Successfully unfollowed ${username}`);
            // Reload the following list
            loadFollowing();
        } else {
            showMessage(data.message || `Unable to unfollow ${username}`, true);
        }
    } catch (error) {
        console.error('Unfollow error:', error);
        showMessage('Network error: Unable to unfollow user', true);
    }
}

// Send a friend request instead of instant follow
async function sendFriendRequest(username) {
    try {
        const response = await fetch(`${BASE_URL}/friend-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ toUsername: username })
        });
        
        const data = await response.json();
        console.log('Friend request response:', data);
        
        if (response.ok) {
            showMessage(`Friend request sent to ${username}! 📩`);
            searchUsers(); // Refresh search results
        } else {
            showMessage(data.message || `Unable to send request to ${username}`, true);
        }
    } catch (error) {
        console.error('Friend request error:', error);
        showMessage('Network error: Unable to send friend request', true);
    }
}

// Load all pending friend requests
async function loadFriendRequests() {
    const requestsDiv = document.getElementById('friendRequestsResults');
    
    // Show loading message
    if (requestsDiv) {
        requestsDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Loading friend requests...</p>';
    }
    
    try {
        const response = await fetch(`${BASE_URL}/friend-requests`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Friend requests received:', data);
        
        if (!requestsDiv) return;
        
        requestsDiv.innerHTML = '';
        
        if (response.ok) {
            const requests = data.requests || [];
            
            if (requests.length > 0) {
                // Create a container for the requests
                const container = document.createElement('div');
                container.style.cssText = 'display: grid; gap: 15px; margin-top: 15px;';
                
                requests.forEach(request => {
                    const requestDiv = document.createElement('div');
                    requestDiv.className = 'result-item';
                    requestDiv.style.cssText = 'background: white; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #DA291C;';
                    
                    requestDiv.innerHTML = `
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: #DA291C; font-size: 1.1em;">${request.from}</div>
                            <div style="color: #666; font-size: 0.85em; margin-top: 3px;">
                                Sent ${new Date(request.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="acceptFriendRequest('${request.from}')" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: 500;">
                                ✓ Accept
                            </button>
                            <button onclick="rejectFriendRequest('${request.from}')" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-weight: 500;">
                                ✕ Reject
                            </button>
                        </div>
                    `;
                    container.appendChild(requestDiv);
                });
                
                requestsDiv.appendChild(container);
            } else {
                requestsDiv.innerHTML = `
                    <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; margin-top: 15px;">
                        <div style="font-size: 3em; margin-bottom: 15px;">📭</div>
                        <p style="color: #666; font-size: 1.1em;">No pending friend requests</p>
                    </div>
                `;
            }
        } else {
            console.error('Error response:', data);
            requestsDiv.innerHTML = `
                <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <p style="color: #856404; margin: 0;">${data.message || 'Unable to load friend requests'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading friend requests:', error);
        if (requestsDiv) {
            requestsDiv.innerHTML = `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <p style="color: #721c24; margin: 0;">Network error: Unable to load friend requests</p>
                </div>
            `;
        }
    }
}

// Accept a friend request
async function acceptFriendRequest(fromUsername) {
    try {
        const response = await fetch(`${BASE_URL}/friend-request/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ fromUsername: fromUsername })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(`You and ${fromUsername} are now friends! 🎉`);
            loadFriendRequests(); // Refresh the requests list
            loadFollowing(); // Refresh following list
        } else {
            showMessage(data.message || 'Unable to accept friend request', true);
        }
    } catch (error) {
        console.error('Accept friend request error:', error);
        showMessage('Network error: Unable to accept request', true);
    }
}

// Reject a friend request
async function rejectFriendRequest(fromUsername) {
    try {
        const response = await fetch(`${BASE_URL}/friend-request/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ fromUsername: fromUsername })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Friend request rejected');
            loadFriendRequests(); // Refresh the requests list
        } else {
            showMessage(data.message || 'Unable to reject friend request', true);
        }
    } catch (error) {
        console.error('Reject friend request error:', error);
        showMessage('Network error: Unable to reject request', true);
    }
}

// Like a post
async function likePost(postId, buttonElement) {
    try {
        const response = await fetch(`${BASE_URL}/posts/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ postId: postId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update the like count in the button
            buttonElement.innerHTML = `❤️ ${data.likeCount}`;
            buttonElement.style.background = '#DA291C';
            buttonElement.onclick = () => unlikePost(postId, buttonElement);
        } else {
            showMessage(data.message || 'Unable to like post', true);
        }
    } catch (error) {
        console.error('Like post error:', error);
        showMessage('Network error: Unable to like post', true);
    }
}

// Unlike a post
async function unlikePost(postId, buttonElement) {
    try {
        const response = await fetch(`${BASE_URL}/posts/unlike`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ postId: postId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update the like count in the button
            buttonElement.innerHTML = `🤍 ${data.likeCount}`;
            buttonElement.style.background = '#f0f0f0';
            buttonElement.style.color = '#333';
            buttonElement.onclick = () => likePost(postId, buttonElement);
        } else {
            showMessage(data.message || 'Unable to unlike post', true);
        }
    } catch (error) {
        console.error('Unlike post error:', error);
        showMessage('Network error: Unable to unlike post', true);
    }
}

// Follow a user 
async function followUser(username) {
    try {
        const response = await fetch(`${BASE_URL}/follow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ followUsername: username })
        });
        
        const data = await response.json();
        console.log('Follow response:', data);
        
        if (response.ok) {
            showMessage(`Now following ${username}! 🎉`);
            // Refresh search results to update button states
            searchUsers();
        } else {
            showMessage(data.message || `Unable to follow ${username}`, true);
        }
    } catch (error) {
        console.error('Follow error:', error);
        showMessage('Network error: Unable to follow user', true);
    }
}

// Update DOMContentLoaded to remove duplicate profile picture handler
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    
    // Add enter key support for login
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                login();
            }
        });
    }
    
    // Add enter key support for registration
    const regFullName = document.getElementById('regFullName');
    if (regFullName) {
        regFullName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                register();
            }
        });
    }
});

// Get Manchester United squad and display it nicely
async function getSquad() {
    const squadDiv = document.getElementById('squadData');
    
    // Show loading message while we fetch the data
    squadDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Loading squad data...</p>';
    
    try {
        // Fetch squad data from our backend
        const response = await fetch(`${BASE_URL}/squad`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        // Check if we got the squad data successfully
        if (response.ok && data.squad) {
            let html = '<div style="background: white; border-radius: 8px; overflow: hidden; margin-top: 15px;">';
            
            // Create the header section with team crest and info
            if (data.teamInfo) {
                html += `
                    <div style="background: linear-gradient(135deg, #DA291C 0%, #8B0000 100%); padding: 30px; text-align: center; color: white;">
                        <img src="https://crests.football-data.org/66.png" style="width: 80px; height: 80px; margin-bottom: 15px;" alt="Man Utd Crest">
                        <h2 style="margin: 0 0 10px 0; font-size: 2em;">${data.teamInfo.name || 'Manchester United FC'}</h2>
                        <div style="display: flex; justify-content: center; gap: 30px; font-size: 0.9em; opacity: 0.9; flex-wrap: wrap;">
                            ${data.teamInfo.founded ? `<div>📅 Founded: ${data.teamInfo.founded}</div>` : ''}
                            ${data.teamInfo.venue ? `<div>🏟️ ${data.teamInfo.venue}</div>` : ''}
                        </div>
                    </div>
                `;
            }
            
            html += '<div style="padding: 20px;">';
            
            // Show the manager section if we have manager info
            if (data.manager) {
                const managerInitials = data.manager.name.split(' ').map(word => word[0]).join('').toUpperCase();
                
                html += `
                    <div style="margin-bottom: 30px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);">
                        <h3 style="color: #8B0000; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.5em;">👔</span>
                            Manager
                        </h3>
                        <div style="background: white; padding: 20px; border-radius: 8px; display: flex; align-items: center; gap: 20px;">
                            <div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #DA291C, #8B0000); display: flex; align-items: center; justify-content: center; border: 4px solid #FFD700; box-shadow: 0 3px 10px rgba(0,0,0,0.2);">
                                <div style="color: white; font-weight: bold; font-size: 2em;">${managerInitials}</div>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #DA291C; font-size: 1.3em; margin-bottom: 5px;">${data.manager.name}</div>
                                ${data.manager.nationality ? `<div style="color: #666; font-size: 1em;">${data.manager.flag || '🌍'} ${data.manager.nationality}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Define icons for each position
            const positionIcons = {
                'Goalkeeper': '🧤',
                'Defender': '🛡️',
                'Midfielder': '⚙️',
                'Attacker': '⚽'
            };
            
            // Loop through each position and display the players
            Object.keys(data.squad).forEach(position => {
                const players = data.squad[position];
                
                // Only show this position if there are players
                if (players.length > 0) {
                    html += `
                        <div style="margin-bottom: 30px;">
                            <h3 style="color: #DA291C; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 3px solid #DA291C; display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 1.5em;">${positionIcons[position] || '👤'}</span>
                                ${position}s
                                <span style="background: #DA291C; color: white; padding: 2px 10px; border-radius: 15px; font-size: 0.8em; margin-left: 10px;">${players.length}</span>
                            </h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
                    `;
                    
                    // Display each player in this position
                    players.forEach(player => {
                        // Get player's initials for their avatar
                        const initials = player.name.split(' ').map(word => word[0]).join('').toUpperCase();
                        
                        html += `
                            <div style="background: linear-gradient(to bottom right, #f8f9fa, #fff); padding: 18px; border-radius: 8px; border-left: 4px solid #DA291C; box-shadow: 0 2px 5px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s;" 
                                 onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 4px 12px rgba(218,41,28,0.2)';" 
                                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.08)';">
                                
                                <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px;">
                                    <!-- Player Avatar with Initials -->
                                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #DA291C, #8B0000); display: flex; align-items: center; justify-content: center; border: 3px solid #FFD700; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                        <div style="text-align: center;">
                                            <div style="color: white; font-weight: bold; font-size: 1.3em; line-height: 1;">${initials}</div>
                                            <div style="color: #FFD700; font-size: 0.7em; font-weight: bold; margin-top: 2px;">#${player.number}</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Shirt Number Badge -->
                                    <div style="flex: 1;">
                                        <div style="background: #DA291C; color: white; padding: 5px 12px; border-radius: 5px; font-weight: bold; font-size: 1.2em; display: inline-block; margin-bottom: 5px;">
                                            #${player.number}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Player Name -->
                                <div style="font-weight: bold; color: #333; font-size: 1.1em; margin-bottom: 8px;">${player.name}</div>
                                
                                <!-- Age and Flag -->
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                                    ${player.age && player.age !== 'N/A' ? 
                                        `<div style="color: #666; font-size: 0.9em; background: #f0f0f0; padding: 4px 10px; border-radius: 12px;">Age: ${player.age}</div>` 
                                        : '<div></div>'}
                                    ${player.flag ? `<div style="font-size: 2em;">${player.flag}</div>` : ''}
                                </div>
                                
                                <!-- Nationality -->
                                ${player.nationality ? `<div style="color: #999; font-size: 0.85em; margin-top: 8px; font-weight: 500;">${player.nationality}</div>` : ''}
                            </div>
                        `;
                    });
                    
                    html += '</div></div>';
                }
            });
            
            html += '</div></div>';
            squadDiv.innerHTML = html;
            
        } else {
            // Show error if we couldn't get the squad data
            squadDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #dc3545;">Squad data unavailable</p>';
        }
        
    } catch (error) {
        // Show error if something went wrong
        console.error('Squad error:', error);
        squadDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #dc3545;">Error loading squad data. Please try again.</p>';
    }
}

// Get Manchester United fixtures and results - shows recent matches and upcoming games
async function getMatches() {
    const matchesDiv = document.getElementById('matchesData');
    
    // Show a friendly loading message while we fetch the data
    matchesDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Loading fixtures...</p>';
    
    try {
        // Fetch match data from our backend API
        const response = await fetch(`${BASE_URL}/matches`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        // Check if we successfully got the match data
        if (response.ok && (data.recentResults || data.upcomingFixtures)) {
            // Start building our HTML with a hide/show button
            let html = `
                <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                    <button onclick="toggleFixtures()" id="toggleFixturesBtn" style="background: #DA291C; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: 500; transition: background 0.3s;">
                        Hide Fixtures
                    </button>
                </div>
                <div id="fixturesContent" style="background: white; border-radius: 8px; overflow: hidden; margin-top: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            `;
            
            // SECTION 1: Display Recent Results if we have any
            if (data.recentResults && data.recentResults.length > 0) {
                // Add the "Recent Results" header
                html += `
                    <div style="background: linear-gradient(135deg, #DA291C 0%, #8B0000 100%); padding: 20px;">
                        <h3 style="color: white; margin: 0; font-size: 1.5em; display: flex; align-items: center; gap: 10px;">
                            <span>📊</span> Recent Results
                        </h3>
                    </div>
                    <div style="padding: 15px;">
                `;
                
                // Loop through each recent match and display it
                data.recentResults.forEach((match, index) => {
                    // Figure out if Man United was playing at home
                    const isHome = match.homeTeam.includes('Manchester United');
                    
                    // Check if Man United won, drew, or lost this match
                    const isWin = match.score.includes('-') && (
                        (isHome && parseInt(match.score.split('-')[0]) > parseInt(match.score.split('-')[1])) ||
                        (!isHome && parseInt(match.score.split('-')[1]) > parseInt(match.score.split('-')[0]))
                    );
                    const isDraw = match.score.includes('-') && match.score.split('-')[0].trim() === match.score.split('-')[1].trim();
                    const isLoss = match.score.includes('-') && !isWin && !isDraw;
                    
                    // Set the background color and icon based on the result
                    let backgroundColor = '#f0f0f0';
                    let resultIcon = '';
                    if (isWin) {
                        backgroundColor = '#E8F5E9';  // Light green for wins
                        resultIcon = '✅';
                    } else if (isDraw) {
                        backgroundColor = '#FFF3E0';  // Light orange for draws
                        resultIcon = '⚪';
                    } else if (isLoss) {
                        backgroundColor = '#FFEBEE';  // Light red for losses
                        resultIcon = '❌';
                    }
                    
                    // Build the HTML for this match
                    html += `
                        <div style="background: ${backgroundColor}; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #DA291C;">
                            <!-- Match date and competition -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div style="color: #666; font-size: 0.9em;">
                                    ${match.date} • ${match.competition}
                                </div>
                                <div style="font-size: 1.5em;">${resultIcon}</div>
                            </div>
                            
                            <!-- Teams and score -->
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <!-- Home team -->
                                <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                                    ${match.homeCrest ? `<img src="${match.homeCrest}" style="width: 30px; height: 30px;">` : ''}
                                    <span style="font-weight: ${isHome ? 'bold' : 'normal'}; color: ${isHome ? '#DA291C' : '#333'};">${match.homeTeam}</span>
                                </div>
                                
                                <!-- Score -->
                                <div style="font-size: 1.3em; font-weight: bold; color: #DA291C; padding: 0 20px;">${match.score}</div>
                                
                                <!-- Away team -->
                                <div style="flex: 1; display: flex; align-items: center; gap: 10px; justify-content: flex-end;">
                                    <span style="font-weight: ${!isHome ? 'bold' : 'normal'}; color: ${!isHome ? '#DA291C' : '#333'};">${match.awayTeam}</span>
                                    ${match.awayCrest ? `<img src="${match.awayCrest}" style="width: 30px; height: 30px;">` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            // SECTION 2: Display Upcoming Fixtures if we have any
            if (data.upcomingFixtures && data.upcomingFixtures.length > 0) {
                // Add the "Upcoming Fixtures" header
                html += `
                    <div style="background: linear-gradient(135deg, #37003C 0%, #510449 100%); padding: 20px;">
                        <h3 style="color: white; margin: 0; font-size: 1.5em; display: flex; align-items: center; gap: 10px;">
                            <span>📅</span> Upcoming Fixtures
                        </h3>
                    </div>
                    <div style="padding: 15px;">
                `;
                
                // Loop through each upcoming match and display it
                data.upcomingFixtures.forEach((match, index) => {
                    // Check if Man United is playing at home
                    const isHome = match.homeTeam.includes('Manchester United');
                    
                    // The first match in the list is the next match, so highlight it
                    const isNextMatch = index === 0;
                    
                    // Build the HTML for this fixture
                    html += `
                        <div style="background: ${isNextMatch ? '#FFF8E1' : 'white'}; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: ${isNextMatch ? '2px solid #FFD700' : '1px solid #ddd'}; ${isNextMatch ? 'box-shadow: 0 3px 10px rgba(255,215,0,0.3);' : ''}">
                            <!-- Show "NEXT MATCH" badge for the upcoming game -->
                            ${isNextMatch ? '<div style="color: #F57C00; font-weight: bold; font-size: 0.85em; margin-bottom: 8px;">⭐ NEXT MATCH</div>' : ''}
                            
                            <!-- Match date, time, and competition -->
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div style="color: #666; font-size: 0.9em;">
                                    ${match.date} • ${match.time}
                                </div>
                                <div style="background: #DA291C; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.8em;">
                                    ${match.competition}
                                </div>
                            </div>
                            
                            <!-- Teams (no score yet since the match hasn't been played) -->
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <!-- Home team -->
                                <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
                                    ${match.homeCrest ? `<img src="${match.homeCrest}" style="width: 30px; height: 30px;">` : ''}
                                    <span style="font-weight: ${isHome ? 'bold' : 'normal'}; color: ${isHome ? '#DA291C' : '#333'};">${match.homeTeam}</span>
                                </div>
                                
                                <!-- VS indicator -->
                                <div style="font-size: 1.3em; font-weight: bold; color: #999; padding: 0 20px;">${match.score}</div>
                                
                                <!-- Away team -->
                                <div style="flex: 1; display: flex; align-items: center; gap: 10px; justify-content: flex-end;">
                                    <span style="font-weight: ${!isHome ? 'bold' : 'normal'}; color: ${!isHome ? '#DA291C' : '#333'};">${match.awayTeam}</span>
                                    ${match.awayCrest ? `<img src="${match.awayCrest}" style="width: 30px; height: 30px;">` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += '</div>';
            }
            
            html += '</div>';
            matchesDiv.innerHTML = html;
            
        } else {
            // Show error message if no match data is available
            matchesDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #dc3545;">No match data available</p>';
        }
    } catch (error) {
        // Show error message if something went wrong
        console.error('Error loading fixtures:', error);
        matchesDiv.innerHTML = '<p style="text-align: center; padding: 20px; color: #dc3545;">Error loading fixtures. Please try again.</p>';
    }
}

// Show or hide the fixtures section when the button is clicked
function toggleFixtures() {
    const fixturesContent = document.getElementById('fixturesContent');
    const toggleButton = document.getElementById('toggleFixturesBtn');
    
    // Check if the fixtures are currently hidden
    if (fixturesContent.style.display === 'none') {
        // Show the fixtures
        fixturesContent.style.display = 'block';
        toggleButton.textContent = 'Hide Fixtures';
        toggleButton.style.background = '#DA291C';  // Red button
    } else {
        // Hide the fixtures
        fixturesContent.style.display = 'none';
        toggleButton.textContent = 'Show Fixtures';
        toggleButton.style.background = '#37003C';  // Purple button
    }
}