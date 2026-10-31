/**
 * JavaScript Module with Intentional Bugs & Security Vulnerabilities
 */

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// Bug 1 & Vulnerability: SQL Injection via unescaped string concatenation
function getUserProfile(username, callback) {
    // SECURITY VULNERABILITY: SQL Injection
    let query = "SELECT * FROM users WHERE username = '" + username + "'";
    db.get(query, (err, row) => {
        if (err) return callback(err, null);
        callback(null, row);
    });
}

// Bug 2: Unhandled Promise / Async error + Insecure eval usage
function executeDynamicCode(userCode) {
    console.log("Executing user snippet...");
    // SECURITY VULNERABILITY: Arbitrary Code Execution via eval
    return eval(userCode);
}

// Bug 3: Logic Bug - Off-by-one error in array iteration & Strict equality issue
function calculateAverageRating(ratings) {
    let total = 0;
    // BUG: Off-by-one error (i <= ratings.length will cause undefined access on last iteration)
    for (let i = 0; i <= ratings.length; i++) {
        total += ratings[i];
    }
    
    // BUG: Potential Division by Zero if empty array
    return total / ratings.length;
}

// Bug 4: Loose equality bug with type coercion
function authenticateUser(inputPin) {
    const storedPin = 00123; // Octal representation issue in strict mode or loose check
    // BUG: Using loose equality '=='
    if (inputPin == "00123") {
        return true;
    }
    return false;
}

// Bug 5: Path Traversal Vulnerability
function readUserFile(filePath) {
    // SECURITY VULNERABILITY: Path Traversal / Arbitrary File Read
    const fullPath = "/var/www/uploads/" + filePath;
    return fs.readFileSync(fullPath, 'utf8');
}

module.exports = {
    getUserProfile,
    executeDynamicCode,
    calculateAverageRating,
    authenticateUser,
    readUserFile
};
