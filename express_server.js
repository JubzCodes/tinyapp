// Requires---------------------------------------------------------------
const express = require("express");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { generateRandomString, findUserByEmail, authenticateUser, urlsForUser } = require('./helpers');

const app = express();
const PORT = 8080;

// App.uses---------------------------------------------------------------
app.use(cookieSession({
  name: 'session',
  keys: ["keys1"]}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// Client information---------------------------------------------------------------
const urlDatabase = {
    b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW"
    },
    i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW"
    }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

// app.get routes---------------------------------------------------------------
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (users[userId]) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if(users[userId] === undefined) {
    return res.status(404).send("Error: 403 - Request page not found \nYou need to log in!");
  }
    const templateVars = { urls: urlsForUser(userId, urlDatabase),
    user: users[userId] };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if(users[userId] === undefined) {
    return res.status(404).send("Error: 403 - Request page not found \nYou need to log in!");
  }
    else {
      const templateVars = {
      shortURL:req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL],
      user: users[userId]};
      res.render("urls_new", templateVars);
    }
});

app.get("/u/:id", (req, res) => {
  const URLObj = urlDatabase[req.params.id];
  if (!URLObj) {
    return res.status(404).send("Error: 404 - Request page not found \nShortURL does not exist");
  }
  res.redirect(URLObj.longURL);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const URLObj = urlDatabase[req.params.id];
  if (URLObj === undefined) {
    return res.status(404).send("Error: 404 - Request page not found \nShortURL does not exist");
  }
  const userUrl = urlDatabase[shortURL].userID;
  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[userId]
  };
  if (users[userId] === undefined) {
    return res.status(404).send("Error: 403 - Request page not found \nYou need to log in!");
  }
  
  if (userId !== userUrl) {
    return res.status(404).send("Error: 401 - Request page not found \nShort URL Already owned!");
  }
  res.render("urls_show", templateVars);
});

// app.get routes (register/login-----------------------------------------------------
app.get("/register", (req, res) => {
  const templateVars = { user: null };
  res.render("register", templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('login', templateVars);
});

// app.post routes---------------------------------------------------------------
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const userId = req.session.user_id;
  if (userId === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.longURL
    return res.redirect(`/urls`);
  } else {
    res.status(401).send("Error : 401- Authorized users can only edit their own urls!")
  }
});

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId
  }

  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session.user_id;
 if (userId === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls`);
  } else {
    res.status(401).send("Error : 401- Authorized users can only delete their own urls!")
  }
});

// app.get register/login/logout------------------------------------------------------
app.post("/register", (req, res) => {
  const userId = Math.random().toString(36).substring(2, 8)
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = findUserByEmail(email, users);
  if (email.length === 0 || password.length === 0) {
    res.status(400).send('Error : 400 - Email or Password is empty!');
    return;
  }
  if (user) {
    res.status(400).send('Error : 400 - Sorry, user already exists!');
    return;
  }
  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
  }
  users[userId] = newUser;
  req.session["user_id"] = userId;
  res.redirect("/urls");
});


app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userCheck = findUserByEmail(email, users);

  if (userCheck) {

    const user = authenticateUser(email, password, users);
  
    if (!email) {
      return res.status(403).send("Error: 403 - You don't have permission to access this server. Email not found.");
    } else {
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(403).send("Error: 403 - You don't have permission to access this server. Incorrect password.");
      } else {
        req.session["user_id"] = user.id;
        return res.redirect("/urls");
      }
    }
  }
  return res.status(403).send("Error: 403 - You don't have permission to access this server. You need to register first!.");


});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
})

// app.listen route---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});