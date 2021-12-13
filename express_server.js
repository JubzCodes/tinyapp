const express = require("express");
const app = express();
const PORT = 8080;
const { generateRandomString, findUserByEmail, authenticateUser, urlsForUser } = require('./helpers');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
app.use(cookieSession({
  name: 'session',
  keys: ["keys1"]}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

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


app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if(!userId) {
    res.redirect("/login");
  } else  {
    const templateVars = { urls: urlsForUser(userId, urlDatabase),
    user: users[userId] };
    res.render("urls_index", templateVars);
  }
});


app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
    if (!userId) {
      res.redirect("/login");
    } else {
      const templateVars = {
      shortURL:req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL],
      user: users[userId]};
      res.render("urls_new", templateVars);
    }
});


app.get("/u/:shortURL", (req, res) => {
  const URLObj = urlDatabase[req.params.shortURL];
  if (!URLObj) {
    return res.status(404).send("Error: 404 - Request page not found \nShortURL does not exist");
  }
  res.redirect(URLObj.longURL);
});

app.get("/register", (req, res) => {
  const templateVars = { user: null };
  res.render("register", templateVars);
});

// app.get("/register", (req, res) => {
//   const userId = req.session.user_id;
//   const templateVars = { user: users[userId] };
//   res.render("register", templateVars);
// });

app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('login', templateVars);
});

// app.get("/login", (req, res) => {
//   const userId = req.session.user_id;
//   const templateVars = { user: users[userId] };
//   res.render("login", templateVars);
// });


app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.shortURL;
  const templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[userId]
  };
  res.render("urls_show", templateVars);
  
// if (userId === urlDatabase[shortURL].userID) {
//   } else {
//     res.status(401).send("401- Authorized users can only edit their own urls!")
//   }

});


app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const userId = req.session.user_id;
  //console.log(userId);
  //console.log(urlDatabase[req.params.shortURL].userID);
  if (userId === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.longURL
    return res.redirect(`/urls`);
  } else {
    res.status(401).send("401- Authorized users can only edit their own urls!")
  }
});


app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId
  }

  res.redirect(`/urls/${shortURL}`);
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
 if (userId === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect(`/urls`);
  } else {
    res.status(401).send("401- Authorized users can only delete their own urls!")
  }
});


app.post("/register", (req, res) => {
  const userId = Math.random().toString(36).substring(2, 8)
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = findUserByEmail(email, users);

  if (user) {
    res.status(400).send('400 - Sorry, user already exists!');
    return;
  }

  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
  }
  users[userId] = newUser;
  req.session["user_id"] = userId;
  res.redirect("/urls" );
});


app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = authenticateUser(email, password, users);
  if (user) {
    req.session["user_id"] = user.id;
    res.redirect('/urls');
    return;
  }
  res.status(401).send('401 - wrong credentials!');
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});