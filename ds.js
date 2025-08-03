const {Pool} = require('pg');

const pool = new Pool({
    user:'postgres',
    host:'localhost',
    password:'abdullah7062',
    database:'chatApp',
    port: 5432,

});

module.exports = pool;