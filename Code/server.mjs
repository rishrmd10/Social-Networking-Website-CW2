import express from 'express';
import session from 'express-session';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Serve PUBLIC folder
app.use(express.static(path.join(__dirname, "public")));

// Serve UPLOADS folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// mongodb connection details
const MONGO_URL = 'mongodb+srv://rishon:1sARe2nqf0NDYj5w@cluster0.6k2nbwk.mongodb.net/?appName=Cluster0';
const DB_NAME = 'socialnetwork';
let db;

// connect to mongodb database
async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGO_URL);
        db = client.db(DB_NAME);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// middleware setup
app.use(express.json());

// CORS configuration - allows requests from file:// and http://localhost
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// session configuration
app.use(session({
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,  // set to true in production with https
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
    }
}));

// create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// serve static files - Code folder contains public and js
app.use(express.static(path.join(__dirname, 'Code', 'public')));
app.use('/js', express.static(path.join(__dirname, 'Code', 'js')));
app.use('/uploads', express.static(uploadsDir));

// multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }  // 5MB file size limit
});

// serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Not authenticated' });
    }
}

// POST /M00994477/users - register a new user
app.post('/M00994477/users', async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;
        
        // validate all fields are provided
        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        const users = db.collection('users');
        
        // check if username or email already exists
        const existingUser = await users.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username or email already exists' 
            });
        }
        
        // hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // insert new user into database
        const result = await users.insertOne({
            username,
            email,
            password: hashedPassword,
            fullName,
            createdAt: new Date(),
            following: []  // array to store users they follow
        });
        
        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully',
            userId: result.insertedId
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// GET /M00994477/users - search for users
app.get('/M00994477/users', requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query required' 
            });
        }
        
        const users = db.collection('users');
        
        // search by username or full name (case insensitive)
        const results = await users.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { fullName: { $regex: q, $options: 'i' } }
            ]
        }, {
            projection: { password: 0 }  // don't send password to client
        }).toArray();
        
        res.json({ 
            success: true, 
            users: results 
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// GET /M00994477/login - check login status
app.get('/M00994477/login', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ 
            loggedIn: true, 
            username: req.session.username 
        });
    } else {
        res.json({ 
            loggedIn: false 
        });
    }
});

// POST /M00994477/login - login user
app.post('/M00994477/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password required' 
            });
        }
        
        const users = db.collection('users');
        const user = await users.findOne({ username });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // verify password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // create session for user
        req.session.userId = user._id.toString();
        req.session.username = user.username;
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            username: user.username
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// DELETE /M00994477/login - logout user
app.delete('/M00994477/login', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error logging out' 
            });
        }
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    });
});

// POST /M00994477/reset-password - reset user password
app.post('/M00994477/reset-password', async (req, res) => {
    try {
        const { username, email, newPassword } = req.body;
        
        if (!username || !email || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        const users = db.collection('users');
        
        // find user by username and email
        const user = await users.findOne({ username, email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found with that username and email' 
            });
        }
        
        // hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // update password
        await users.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
        );
        
        res.json({ 
            success: true, 
            message: 'Password reset successful' 
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/change-password - change password while logged in
app.post('/M00994477/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }
        
        const users = db.collection('users');
        const user = await users.findOne({ _id: new ObjectId(req.session.userId) });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }
        
        // hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // update password
        await users.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
        );
        
        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/profile-picture - update profile picture
app.post('/M00994477/profile-picture', requireAuth, upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }
        
        const profilePicUrl = `/uploads/${req.file.filename}`;
        
        // update user's profile picture in database
        const users = db.collection('users');
        await users.updateOne(
            { _id: new ObjectId(req.session.userId) },
            { $set: { profilePicture: profilePicUrl } }
        );
        
        res.json({ 
            success: true, 
            profilePicUrl 
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/contents - create a new post
app.post('/M00994477/contents', requireAuth, async (req, res) => {
    try {
        const { content, imageUrl } = req.body;
        
        if (!content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Content is required' 
            });
        }
        
        const contents = db.collection('contents');
        
        // insert new post into database
        const result = await contents.insertOne({
            username: req.session.username,
            userId: req.session.userId,
            content,
            imageUrl: imageUrl || null,
            createdAt: new Date()
        });
        
        res.status(201).json({ 
            success: true, 
            message: 'Post created successfully',
            contentId: result.insertedId
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// GET /M00994477/contents - search for posts
app.get('/M00994477/contents', requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query required' 
            });
        }
        
        const contents = db.collection('contents');
        
        // search in post content (case insensitive)
        const results = await contents.find({
            content: { $regex: q, $options: 'i' }
        }).sort({ createdAt: -1 }).toArray();  // newest first
        
        res.json({ 
            success: true, 
            contents: results 
        });
    } catch (error) {
        console.error('Error searching contents:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/friend-request - Send a friend request to another user
app.post('/M00994477/friend-request', requireAuth, async (req, res) => {
    try {
        const { toUsername } = req.body;
        
        // Make sure they provided a username
        if (!toUsername) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username is required' 
            });
        }
        
        // Can't send a friend request to yourself
        if (toUsername === req.session.username) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot send friend request to yourself' 
            });
        }
        
        const users = db.collection('users');
        
        // Check if the user they want to follow exists
        const targetUser = await users.findOne({ username: toUsername });
        if (!targetUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Check if already following this user
        const currentUser = await users.findOne({ _id: new ObjectId(req.session.userId) });
        if (currentUser.following && currentUser.following.includes(toUsername)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Already following this user' 
            });
        }
        
        // Check if request already sent
        const requestsCollection = db.collection('friendRequests');
        const existingRequest = await requestsCollection.findOne({
            from: req.session.username,
            to: toUsername,
            status: 'pending'
        });
        
        if (existingRequest) {
            return res.status(400).json({ 
                success: false, 
                message: 'Friend request already sent' 
            });
        }
        
        // Create the friend request
        await requestsCollection.insertOne({
            from: req.session.username,
            to: toUsername,
            status: 'pending',
            createdAt: new Date()
        });
        
        res.json({ 
            success: true, 
            message: `Friend request sent to ${toUsername}` 
        });
    } catch (error) {
        console.error('Error sending friend request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// GET /M00994477/friend-requests - Get all pending friend requests for current user
app.get('/M00994477/friend-requests', requireAuth, async (req, res) => {
    try {
        const requestsCollection = db.collection('friendRequests');
        
        // Find all pending requests sent TO the current user
        const requests = await requestsCollection.find({
            to: req.session.username,
            status: 'pending'
        }).sort({ createdAt: -1 }).toArray();
        
        res.json({ 
            success: true, 
            requests: requests 
        });
    } catch (error) {
        console.error('Error getting friend requests:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/friend-request/accept - Accept a friend request
app.post('/M00994477/friend-request/accept', requireAuth, async (req, res) => {
    try {
        const { fromUsername } = req.body;
        
        if (!fromUsername) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username is required' 
            });
        }
        
        const requestsCollection = db.collection('friendRequests');
        const users = db.collection('users');
        
        // Find the friend request
        const request = await requestsCollection.findOne({
            from: fromUsername,
            to: req.session.username,
            status: 'pending'
        });
        
        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Friend request not found' 
            });
        }
        
        // Update the request status to accepted
        await requestsCollection.updateOne(
            { _id: request._id },
            { $set: { status: 'accepted', acceptedAt: new Date() } }
        );
        
        // Add each user to the other's following list
        await users.updateOne(
            { username: fromUsername },
            { $addToSet: { following: req.session.username } }
        );
        
        await users.updateOne(
            { username: req.session.username },
            { $addToSet: { following: fromUsername } }
        );
        
        res.json({ 
            success: true, 
            message: `You and ${fromUsername} are now friends!` 
        });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/friend-request/reject - Reject a friend request
app.post('/M00994477/friend-request/reject', requireAuth, async (req, res) => {
    try {
        const { fromUsername } = req.body;
        
        if (!fromUsername) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username is required' 
            });
        }
        
        const requestsCollection = db.collection('friendRequests');
        
        // Find and update the request
        const result = await requestsCollection.updateOne(
            {
                from: fromUsername,
                to: req.session.username,
                status: 'pending'
            },
            { $set: { status: 'rejected', rejectedAt: new Date() } }
        );
        
        if (result.modifiedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Friend request not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Friend request rejected' 
        });
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/posts/like - Like a post
app.post('/M00994477/posts/like', requireAuth, async (req, res) => {
    try {
        const { postId } = req.body;
        
        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }
        
        const contents = db.collection('contents');
        
        // Add the current user to the post's likes array
        const result = await contents.updateOne(
            { _id: new ObjectId(postId) },
            { 
                $addToSet: { likes: req.session.username },
                $pull: { dislikes: req.session.username } // Remove from dislikes if it's there
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }
        
        // Get the updated like count
        const post = await contents.findOne({ _id: new ObjectId(postId) });
        const likeCount = post.likes ? post.likes.length : 0;
        
        res.json({ 
            success: true, 
            message: 'Post liked',
            likeCount: likeCount
        });
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/posts/unlike - Unlike a post
app.post('/M00994477/posts/unlike', requireAuth, async (req, res) => {
    try {
        const { postId } = req.body;
        
        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Post ID is required' 
            });
        }
        
        const contents = db.collection('contents');
        
        // Remove the current user from the post's likes array
        const result = await contents.updateOne(
            { _id: new ObjectId(postId) },
            { $pull: { likes: req.session.username } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }
        
        // Get the updated like count
        const post = await contents.findOne({ _id: new ObjectId(postId) });
        const likeCount = post.likes ? post.likes.length : 0;
        
        res.json({ 
            success: true, 
            message: 'Post unliked',
            likeCount: likeCount
        });
    } catch (error) {
        console.error('Error unliking post:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/follow - follow another user
app.post('/M00994477/follow', requireAuth, async (req, res) => {
    try {
        const { followUsername } = req.body;
        
        if (!followUsername) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username to follow is required' 
            });
        }
        
        // can't follow yourself
        if (followUsername === req.session.username) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot follow yourself' 
            });
        }
        
        const users = db.collection('users');
        
        // check if user to follow exists
        const userToFollow = await users.findOne({ username: followUsername });
        if (!userToFollow) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // add to following array (addToSet prevents duplicates)
        const result = await users.updateOne(
            { _id: new ObjectId(req.session.userId) },
            { $addToSet: { following: followUsername } }
        );
        
        if (result.modifiedCount > 0) {
            res.json({ 
                success: true, 
                message: `Now following ${followUsername}` 
            });
        } else {
            res.json({ 
                success: true, 
                message: `Already following ${followUsername}` 
            });
        }
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// DELETE /M00994477/follow - unfollow a user
app.delete('/M00994477/follow', requireAuth, async (req, res) => {
    try {
        const { followUsername } = req.body;
        
        if (!followUsername) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username to unfollow is required' 
            });
        }
        
        const users = db.collection('users');
        
        // remove from following array
        await users.updateOne(
            { _id: new ObjectId(req.session.userId) },
            { $pull: { following: followUsername } }
        );
        
        res.json({ 
            success: true, 
            message: `Unfollowed ${followUsername}` 
        });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// GET /M00994477/feed - get user's personalized feed
app.get('/M00994477/feed', requireAuth, async (req, res) => {
    try {
        const users = db.collection('users');
        const contents = db.collection('contents');
        
        // get current user's following list
        const currentUser = await users.findOne({ 
            _id: new ObjectId(req.session.userId) 
        });
        
        // if not following anyone, return empty feed
        if (!currentUser || !currentUser.following || currentUser.following.length === 0) {
            return res.json({ 
                success: true, 
                feed: [] 
            });
        }
        
        // get posts only from users they are following
        const feed = await contents.find({
            username: { $in: currentUser.following }
        }).sort({ createdAt: -1 }).toArray();  // newest first
        
        res.json({ 
            success: true, 
            feed 
        });
    } catch (error) {
        console.error('Error getting feed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// GET /M00994477/following - get list of users you're following
app.get('/M00994477/following', requireAuth, async (req, res) => {
    try {
        const users = db.collection('users');
        
        // Get current user with their following list
        const currentUser = await users.findOne({ 
            _id: new ObjectId(req.session.userId) 
        });
        
        if (!currentUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // If not following anyone, return empty array
        if (!currentUser.following || currentUser.following.length === 0) {
            return res.json({ 
                success: true, 
                following: [] 
            });
        }
        
        // Get full user details for each person they're following
        const followingUsers = await users.find({
            username: { $in: currentUser.following }
        }, {
            projection: { 
                password: 0,  // Don't send password
                _id: 0        // Don't need ID
            }
        }).toArray();
        
        res.json({ 
            success: true, 
            following: followingUsers 
        });
    } catch (error) {
        console.error('Error getting following list:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// GET /M00994477/profile - get current user's profile
app.get('/M00994477/profile', requireAuth, async (req, res) => {
    try {
        const users = db.collection('users');
        
        const user = await users.findOne(
            { _id: new ObjectId(req.session.userId) },
            { projection: { password: 0 } }  // Don't send password
        );
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Ensure profilePicture field exists
        if (!user.profilePicture) {
            user.profilePicture = null;
        }
        
        res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// POST /M00994477/upload - upload image file
app.post('/M00994477/upload', requireAuth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }
        
        // return the URL path to the uploaded image
        const imageUrl = `/uploads/${req.file.filename}`;
        
        res.json({ 
            success: true, 
            imageUrl 
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// GET /M00994477/matches - get man utd fixtures and results
app.get('/M00994477/matches', requireAuth, async (req, res) => {
    try {
        // Fetch Manchester United fixtures from football-data.org API
        const response = await axios.get('https://api.football-data.org/v4/teams/66/matches', {
            params: {
                season: 2025
            },
            headers: {
                'X-Auth-Token': '55e8c3f7ee684cf28e1f2b2316d26c57'
            }
        });
        
        const apiData = response.data;
        
        if (apiData.matches && apiData.matches.length > 0) {
            // Get current date
            const today = new Date();
            
            // Separate matches into past and future
            const allMatches = apiData.matches.map(match => {
                const matchDate = new Date(match.utcDate);
                const isPast = matchDate < today;
                
                return {
                    date: matchDate.toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                    }),
                    time: matchDate.toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    homeTeam: match.homeTeam.name,
                    awayTeam: match.awayTeam.name,
                    homeCrest: match.homeTeam.crest,
                    awayCrest: match.awayTeam.crest,
                    competition: match.competition.name,
                    status: match.status,
                    score: match.score.fullTime.home !== null ? 
                           `${match.score.fullTime.home} - ${match.score.fullTime.away}` : 'vs',
                    isPast: isPast,
                    matchDate: matchDate
                };
            });
            
            // Sort by date (most recent first for past, soonest first for future)
            allMatches.sort((a, b) => a.matchDate - b.matchDate);
            
            // Get last 5 results and next 5 fixtures
            const pastMatches = allMatches.filter(m => m.isPast).slice(-5).reverse();
            const futureMatches = allMatches.filter(m => !m.isPast).slice(0, 5);
            
            res.json({ 
                success: true, 
                recentResults: pastMatches,
                upcomingFixtures: futureMatches
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'No match data available for Manchester United'
            });
        }
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching match data from API'
        });
    }
});

// GET /M00994477/standings - get premier league standings for 2025/26 season
app.get('/M00994477/standings', requireAuth, async (req, res) => {
    try {
        // Fetch Premier League standings from football-data.org API
        const response = await axios.get('https://api.football-data.org/v4/competitions/PL/standings', {
            params: {
                season: 2025
            },
            headers: {
                'X-Auth-Token': '55e8c3f7ee684cf28e1f2b2316d26c57'
            }
        });
        
        const apiData = response.data;
        
        // Check if we got standings data
        if (apiData.standings && apiData.standings.length > 0) {
            // Get the full league table (first array in standings)
            const table = apiData.standings[0].table;
            
            // Format the data for our frontend
            const standings = table.map(team => ({
                position: team.position,
                team: team.team.name,
                crest: team.team.crest,
                played: team.playedGames,
                won: team.won,
                drawn: team.draw,
                lost: team.lost,
                points: team.points,
                goalsFor: team.goalsFor,
                goalsAgainst: team.goalsAgainst,
                goalDifference: team.goalDifference
            }));
            
            res.json({ 
                success: true, 
                standings: standings
            });
        } else {
            // No standings data available
            res.status(404).json({
                success: false,
                message: 'No standings data available for the 2025/26 season'
            });
        }
    } catch (error) {
        console.error('Error getting standings:', error.message);
        
        // Return error response
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching standings from API'
        });
    }
});

// Serve the HTML file at root
app.get('/M00994477', (req, res) => {
    res.sendFile(path.join(__dirname, 'uploads', 'webpage.html'));
});

// start the server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}/M00994477`);
    });
});

// GET /M00994477/squad - get manchester united squad 2025/26 season
app.get('/M00994477/squad', requireAuth, async (req, res) => {
    try {
        // Official Manchester United 2025/26 Premier League Squad 
        //TODO: Images may not load due to Transfermarkt restrictions so other things may be needed
        const squad2025 = {
            'Goalkeeper': [
                { name: 'Altay Bayindir', number: 1, age: 27, nationality: 'Turkey', flag: '🇹🇷', photo: 'https://img.a.transfermarkt.technology/portrait/big/302BasedOn558-1692258940.jpg?lm=1' },
                { name: 'Tom Heaton', number: 22, age: 38, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', photo: 'https://img.a.transfermarkt.technology/portrait/big/42310-1631866990.jpg?lm=1' },
                { name: 'Senne Lammens', number: 40, age: 23, nationality: 'Belgium', flag: '🇧🇪', photo: 'https://img.a.transfermarkt.technology/portrait/big/592358-1625228739.jpg?lm=1' },
                { name: 'Dermot Mee', number: 50, age: 21, nationality: 'Ireland', flag: '🇮🇪', photo: 'https://img.a.transfermarkt.technology/portrait/big/811927-1701705084.jpg?lm=1' }
            ],
            'Defender': [
                { name: 'Diogo Dalot', number: 20, age: 25, nationality: 'Portugal', flag: '🇵🇹', photo: 'https://img.a.transfermarkt.technology/portrait/big/357147-1694609670.jpg?lm=1' },
                { name: 'Matthijs de Ligt', number: 4, age: 25, nationality: 'Netherlands', flag: '🇳🇱', photo: 'https://img.a.transfermarkt.technology/portrait/big/326031-1723814853.jpg?lm=1' },
                { name: 'Harry Maguire', number: 5, age: 32, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', photo: 'https://img.a.transfermarkt.technology/portrait/big/177907-1664352765.jpg?lm=1' },
                { name: 'Tyrell Malacia', number: 12, age: 25, nationality: 'Netherlands', flag: '🇳🇱', photo: 'https://img.a.transfermarkt.technology/portrait/big/398742-1659009674.jpg?lm=1' },
                { name: 'Lisandro Martinez', number: 6, age: 27, nationality: 'Argentina', flag: '🇦🇷', photo: 'https://img.a.transfermarkt.technology/portrait/big/anten339352-1694008583.jpg?lm=1' },
                { name: 'Noussair Mazraoui', number: 3, age: 27, nationality: 'Morocco', flag: '🇲🇦', photo: 'https://img.a.transfermarkt.technology/portrait/big/340456-1723809623.jpg?lm=1' },
                { name: 'Luke Shaw', number: 23, age: 29, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', photo: 'https://img.a.transfermarkt.technology/portrait/big/183288-1631869792.jpg?lm=1' },
                { name: 'Rhys Bennett', number: 41, age: 23, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', photo: 'https://img.a.transfermarkt.technology/portrait/big/838682-1685012527.jpg?lm=1' },
                { name: 'Leny Yoro', number: 15, age: 19, nationality: 'France', flag: '🇫🇷', photo: 'https://img.a.transfermarkt.technology/portrait/big/866828-1722932673.jpg?lm=1' },
                { name: 'Patrick Dorgu', number: 13, age: 20, nationality: 'Denmark', flag: '🇩🇰', photo: 'https://img.a.transfermarkt.technology/portrait/big/875273-1697703929.jpg?lm=1' }
            ],
            'Midfielder': [
                { name: 'Bruno Fernandes', number: 8, age: 30, nationality: 'Portugal', flag: '🇵🇹', photo: 'https://img.a.transfermarkt.technology/portrait/big/240306-1694610076.jpg?lm=1' },
                { name: 'Casemiro', number: 18, age: 33, nationality: 'Brazil', flag: '🇧🇷', photo: 'https://img.a.transfermarkt.technology/portrait/big/16306-1723814658.jpg?lm=1' },
                { name: 'Mason Mount', number: 7, age: 26, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', photo: 'https://img.a.transfermarkt.technology/portrait/big/346483-1693400380.jpg?lm=1' },
                { name: 'Manuel Ugarte', number: 25, age: 24, nationality: 'Uruguay', flag: '🇺🇾', photo: 'https://img.a.transfermarkt.technology/portrait/big/603923-1725354638.jpg?lm=1' },
                { name: 'Kobbie Mainoo', number: 37, age: 20, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', photo: 'https://img.a.transfermarkt.technology/portrait/big/882028-1697551814.jpg?lm=1' },
                { name: 'Toby Collyer', number: 43, age: 21, nationality: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', photo: 'https://img.a.transfermarkt.technology/portrait/big/808175-1685013018.jpg?lm=1' }
            ],
            'Attacker': [
                { name: 'Amad Diallo', number: 16, age: 22, nationality: 'Ivory Coast', flag: '🇨🇮', photo: 'https://img.a.transfermarkt.technology/portrait/big/528977-1727698671.jpg?lm=1' },
                { name: 'Matheus Cunha', number: 10, age: 25, nationality: 'Brazil', flag: '🇧🇷', photo: 'https://img.a.transfermarkt.technology/portrait/big/440158-1634554941.jpg?lm=1' },
                { name: 'Bryan Mbeumo', number: 19, age: 25, nationality: 'Cameroon', flag: '🇨🇲', photo: 'https://img.a.transfermarkt.technology/portrait/big/346505-1693823629.jpg?lm=1' },
                { name: 'Benjamin Sesko', number: 9, age: 21, nationality: 'Slovenia', flag: '🇸🇮', photo: 'https://img.a.transfermarkt.technology/portrait/big/697679-1725437093.jpg?lm=1' },
                { name: 'Joshua Zirkzee', number: 11, age: 24, nationality: 'Netherlands', flag: '🇳🇱', photo: 'https://img.a.transfermarkt.technology/portrait/big/483840-1723810075.jpg?lm=1' }
            ]
        };
        
        res.json({ 
            success: true, 
            squad: squad2025,
            manager: {
                name: 'Ruben Amorim',
                nationality: 'Portugal',
                flag: '🇵🇹',
                dateOfBirth: '1985-01-27',
                photo: 'https://img.a.transfermarkt.technology/portrait/big/66710-1682683637.jpg?lm=1'
            },
            teamInfo: {
                name: 'Manchester United FC',
                crest: 'https://crests.football-data.org/66.png',
                founded: 1878,
                venue: 'Old Trafford',
                website: 'http://www.manutd.com'
            }
        });
    } catch (error) {
        console.error('Error getting squad:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 'N/A';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}