CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    about VARCHAR(25),
    is_verified BOOL DEFAULT false,
    verification_token VARCHAR(255),
    photoURL VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE friends (
    id UUID PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES users(id),
    user2_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user1_id, user2_id),
    CHECK (user1_id <> user2_id)
);

CREATE TABLE friendRequests (
    id UUID PRIMARY KEY,
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (sender_id, receiver_id),
    CHECK (sender_id <> receiver_id)
);

DROP TABLE friends;
DROP TABLE friendRequests;
DROP TABLE users;

SELECT* FROM users;
SELECT* FROM friends;
SELECT* FROM friendRequests;