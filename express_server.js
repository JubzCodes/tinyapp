const express = require("express");
const app = express();
const PORT = 8080; 
const bcrypt = require('bcryptjs');
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
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (user && bcrypt.compareSync(password, hashedPassword)) {
    return user;
  }

  return false;
};


// const urlsForUser = (id) => {
//   if (res.cookies("user_id") === id) {
//     for (const value in urlDatabase) {
//       if (urlDatabase[value].userID === id) {
//         return urlDatabase[value];
//       }
//     }
//   }
// };

const urlsForUser = (id) => {
  const urls = {};
  for (let shortURLs in urlDatabase) {
    if (urlDatabase[shortURLs].userID === id) {
      urls[shortURLs] = urlDatabase[shortURLs];
    }
  }
  return urls;
}


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
  const userId = req.cookies["user_id"];
  console.log("user id:", userId);
  console.log(urlsForUser(userId));
  console.log("users:", users)
  console.log("database", urlDatabase)
  if(!userId) {
    res.redirect("/login");
  } else  {
    const templateVars = { urls: urlsForUser(userId),
    user: users[userId] };
    res.render("urls_index", templateVars);
  }
});


app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
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


app.get('/login', (req, res) => {
  const templateVars = { user: null };
  res.render('login', templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  const templateVars = { 
    shortURL:req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL, 
    user: users[userId]
  };
  return res.render("urls_show", templateVars);
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
    userID: userId
  }

  res.redirect(`/urls/${shortURL}`);
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies["user_id"];
 // if short url belongs to user delete,redirect to /urls
 // ! error message 
  if (shortURL)
  delete urlDatabase[shortURL];
  res.redirect("/urls");
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
