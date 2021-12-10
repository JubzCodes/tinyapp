const express = require("express");
const app = express();
const PORT = 8080; 
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
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

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };

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

  return false;
};


const authenticateUser = (email, password, db) => {
  const user = findUserByEmail(email, db);

  if (user && user.password === password) {
    return user;
  }

  return false;
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
  const user = users[req.cookies["user_id"]]
  const templateVars = { urls: urlDatabase,
  user };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId) {
    const templateVars = { user: users[userId] };
    res.render("urls_new", templateVars);
  } else {
    res.send("Must Have An Account To Make Tiny URLS!");
  }
});


app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});


app.get("/register", (req, res) => {
  const templateVars = { user: null };
  res.render("register", templateVars);
});


app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('login', templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  // const shortURL = req.params.shortURL;
  // const longURL = urlDatabase[shortURL];
  // const userId = req.cookies["user_id"];
  const templateVars = { 
    shortURL:req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL, 
    user: users[userId]};
  res.render("urls_show", templateVars);
});


app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.longURL
  res.redirect(`/urls`); 
});


app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: users[userId]
  }
  res.redirect(`/urls`);
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


app.post("/register", (req, res) => {

  const userId = Math.random().toString(36).substring(2, 8)
  const email = req.body.email;
  const password = req.body.password;
  
  const user = findUserByEmail(email, users);

  if (user) {
    res.status(400).send('400 - Sorry, user already exists!');
    return;
  }

  const newUser = {
    id: userId, 
    email, 
    password,
  }
  users[userId] = newUser;
  res.cookie("user_id", userId)
  res.redirect("/urls" );
});


app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = authenticateUser(email, password, users);
  if (user) {
    res.cookie('user_id', user.id);
    res.redirect('/urls');
    return;
  }
  res.status(401).send('401 - wrong credentials!');
});


app.post("/login", (req, res) => {
  res.cookie("user_id", req.body.user.id);
  res.redirect("/urls");
})


app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
  res.redirect("/urls");
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
