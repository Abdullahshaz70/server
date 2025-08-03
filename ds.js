const {Pool} = require('pg');

// const pool = new Pool({
//     user:'postgres',
//     host:'localhost',
//     password:'abdullah7062',
//     database:'chatApp',
//     port: 5432,

// });


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;