const bcrypt = require('bcryptjs');

const generateRandomString = function() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    randomString += randomChar;
  }
  return randomString;
};


const findUserByEmail = (email, users) => {
  for (let userId in users) {
    const user = users[userId];

    if (user.email === email) {
      return user;
    }
  }

  return undefined;
};


const authenticateUser = (email, password, db) => {
  const user = findUserByEmail(email, db);
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (user && bcrypt.compareSync(password, hashedPassword)) {
    return user;
  }

  return false;
};

const urlsForUser = (id, database) => {
  const urls = {};
  for (let shortURLs in database) {
    if (database[shortURLs].userID === id) {
      urls[shortURLs] = database[shortURLs];
    }
  }
  return urls;
}

module.exports = { generateRandomString, findUserByEmail, authenticateUser, urlsForUser }; 