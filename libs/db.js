const spicedPg = require('spiced-pg');

const db = spicedPg(
    process.env.DATABASE_URL ||
    `postgres://postgres:postgres@localhost:5432/socialnetwork`
);

exports.insertUser = function(first, last, email, password) {
    return db.query(
        `
        INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        Returning id
        `,
        [first, last, email, password]
    );
};

exports.getUserByEmail = function(email) {
    return db.query(
        `
        SELECT *
        FROM users
        WHERE email = $1
        `,
        [email]
    );
};

exports.getUserById = function(id) {
    return db.query(
        `
        SELECT id, first, last, url, bio
        FROM users
        WHERE id = $1
        `,
        [id]
    );
};

exports.insertCode = function(code, email) {
    return db.query(
        `
        INSERT INTO password_reset_codes (code, email)
        VALUES ($1, $2)
        `,
        [code, email]
    );
};

exports.getCode = function(email) {
    return db.query(
        `
        SELECT code FROM password_reset_codes
        WHERE email = $1 AND CURRENT_TIMESTAMP - created_at < INTERVAL '10 minutes'
        ORDER BY id DESC
        LIMIT 1
        `,
        [email]
    );
};

exports.updatePw = function(email, password) {
    return db.query(
        `
        UPDATE users
        SET password = $2
        WHERE email = $1
        `,
        [email, password]
    );
};

exports.updateImage = function(id, url) {
    return db.query(
        `
        UPDATE users
        SET url = $2
        WHERE id = $1
        `,
        [id, url]
    );
};

exports.updateBio = function(id, bio) {
    return db.query(
        `
        UPDATE users
        SET bio = $2
        WHERE id = $1
        Returning bio
        `,
        [id, bio]
    );
};

exports.getFriendshipStatus = function(sender_id, receiver_id) {
    return db.query(
        `
        SELECT * FROM friendships
        WHERE (receiver_id = $2 AND sender_id = $1)
        OR (receiver_id = $1 AND sender_id = $2)
        `,
        [sender_id, receiver_id]
    );
};

exports.makeFriendRequest = function(sender_id, receiver_id) {
    return db.query(
        `
        INSERT INTO friendships (sender_id, receiver_id)
        VALUES ($1, $2)
        `,
        [sender_id, receiver_id]
    );
};

exports.acceptFriendRequest = function(sender_id, receiver_id) {
    return db.query(
        `
        UPDATE friendships
        SET accepted = true
        WHERE (receiver_id = $2 AND sender_id = $1)
        OR (receiver_id = $1 AND sender_id = $2)
        `,
        [sender_id, receiver_id]
    );
};

exports.deleteFriendship = function(sender_id, receiver_id) {
    return db.query(
        `
        DELETE FROM friendships
        WHERE (receiver_id = $2 AND sender_id = $1)
        OR (receiver_id = $1 AND sender_id = $2)
        `,
        [sender_id, receiver_id]
    );
};

exports.getRecentUsers = function() {
    return db.query(
        `
        SELECT * FROM users
        ORDER BY id DESC
        LIMIT 3
        `
    );
};

exports.getUsers = function(name) {
    return db.query(
        `
        SELECT id, first, last, url FROM users
        WHERE (first ILIKE $1)
        OR (last ILIKE $1)
        ORDER BY first ASC
        `,
        [name + '%']
    );
};

exports.getFriends = function(id) {
    return db.query(
        `
        SELECT users.id, first, last, url, accepted, sender_id
        FROM friendships
        JOIN users
        ON (accepted = false AND receiver_id = $1 AND sender_id = users.id)
        OR (accepted = false AND sender_id = $1 AND receiver_id = users.id)
        OR (accepted = true AND receiver_id = $1 AND sender_id = users.id)
        OR (accepted = true AND sender_id = $1 AND receiver_id = users.id)
        `,
        [id]
    );
};

exports.makeFriendRequest = function(sender_id, receiver_id) {
    return db.query(
        `
        INSERT INTO friendships (sender_id, receiver_id)
        VALUES ($1, $2)
        `,
        [sender_id, receiver_id]
    );
};

exports.getLastTenChatMessages = function() {
    return db.query(
        `
        SELECT users.id AS "userId", users.first, users.last, users.url, chat_messages.id AS "messageId", chat_messages.message, chat_messages.created_at
        FROM chat_messages
        LEFT JOIN users
        ON users.id = sender_id
        WHERE receiver_id is null
        ORDER BY chat_messages.id DESC
        LIMIT 10
        `
    );
};

exports.insertChatMessage = function(message, sender_id) {
    return db.query(
        `
        INSERT INTO chat_messages (message, sender_id)
        VALUES ($1, $2)
        Returning created_at, id
        `,
        [message, sender_id]
    );
};

exports.insertPrivateMessage = function(message, sender_id, receiver_id) {
    return db.query(
        `
        INSERT INTO chat_messages (message, sender_id, receiver_id)
        VALUES ($1, $2, $3)
        Returning created_at, id
        `,
        [message, sender_id, receiver_id]
    );
};

exports.getPrivateMessages = function(sender_id, receiver_id) {
    return db.query(
        `
        SELECT users.id AS "userId", users.first, users.last, users.url, chat_messages.id AS "messageId", chat_messages.message, chat_messages.created_at
        FROM chat_messages
        JOIN users
        ON (receiver_id = $2 AND sender_id = $1 AND sender_id = users.id)
        OR (receiver_id = $1 AND sender_id = $2 AND sender_id = users.id)
        `,
        [sender_id, receiver_id]
    );
};

exports.getForums = function() {
    return db.query(
        `
        SELECT forums.*, COUNT(threads.id) AS "numberOfThreads", COUNT(posts.id) AS "numberOfPosts"
        FROM forums
        LEFT JOIN threads
        ON forums.id = forum_id
        LEFT JOIN posts
        ON thread_id = threads.id
        GROUP BY forums.id
        `
    );
};

exports.getThreads = function(forumId) {
    return db.query(
        `
        SELECT threads.*, users.id, first, last
        FROM threads
        LEFT JOIN users
        ON threads.creator_id = users.id
        WHERE forum_id = $1
        `,
        [forumId]
    );
};

exports.getPostsByThreadId = function(threadId) {
    return db.query(
        `
        SELECT posts.*, users.id, first, last, url
        FROM posts
        LEFT JOIN users
        ON poster_id = users.id
        WHERE thread_id = $1
        `,
        [threadId]
    );
};

exports.getPostsByUserId = function(userId) {
    return db.query(
        `
        SELECT *
        FROM posts
        WHERE poster_id = $1
        `,
        [userId]
    );
};

exports.getReactions = function(postId) {
    return db.query(
        `
        SELECT *
        FROM post_reactions
        WHERE post_id = $1
        `,
        [postId]
    );
};

exports.insertThread = function(forumId, userId, title) {
    return db.query(
        `
        INSERT INTO threads (forum_id, creator_id, title)
        VALUES ($1, $2, $3)
        `,
        [forumId, userId, title]
    );
};

exports.insertPost = function(threadId, userId, content) {
    return db.query(
        `
        INSERT INTO posts (thread_id, poster_id, content)
        VALUES ($1, $2, $3)
        `,
        [threadId, userId, content]
    );
};

exports.insertReaction = function(postId, userId, reaction) {
    return db.query(
        `
        INSERT INTO post_reactions (post_id, user_id, reaction)
        VALUES ($1, $2, $3)
        `,
        [postId, userId, reaction]
    );
};
