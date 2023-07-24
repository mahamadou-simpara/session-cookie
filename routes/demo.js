const express = require("express");

const db = require("../data/database");
const bcrypt = require("bcrypt");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  let userData = req.session.inputData;

  if (!userData) {
    userData = {
      email: "",
      message: "",
      confirmEmail: "",
      password: "",
    };
  }

  req.session.inputData = null;

  res.render("signup", { userData: userData });
});

router.get("/login", function (req, res) {

  let userData = req.session.inputData;

  if (!userData) {
    userData = {
      email: "",
      message: "",
      password: "",
    };
  }

  req.session.inputData = null;

  res.render("login", { userData: userData});
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  console.log(userData);
  const enteredEmail = userData.email;
  const enteredConfirmEmail = userData["confirm-email"];
  const enteredPassword = userData.password;

  if (
    !enteredEmail ||
    !enteredConfirmEmail ||
    enteredEmail !== enteredConfirmEmail ||
    enteredPassword.trim().length < 6 ||
    !enteredEmail.includes("@")
  ) {
    console.log("Incorrect input !");
    req.session.inputData = {
      email: enteredEmail,
      message: "Incorrect input, please try with a good one ! ",
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };
    req.session.save(function () {
      res.redirect("/signup");
    });
    return;
  }

  const password = await bcrypt.hash(enteredPassword, 12);

  const result = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (result) {
    console.log("Existing email, Please try another email !");
    req.session.inputData = {
      email: enteredEmail,
      message: "Existing email, Please try another email ! ",
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };
    req.session.save(function () {
      res.redirect("/signup");
    });
    return;
  }

  //  console.log(password);

  const user = {
    email: enteredEmail,
    confirmEmail: enteredConfirmEmail,
    password: password,
  };

  await db.getDb().collection("users").insertOne(user);

  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  console.log(userData);
  const enteredEmail = userData.email;
  const enteredPassword = userData.password;

  const result = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail });

  if (!result) {
    console.log("Incorrect email !");
    req.session.inputData = {
      email: enteredEmail,
      message: "Incorrect Input ! ",
      password: enteredPassword,
    };
    req.session.save(function () {
      res.redirect("/login");
    });
    return;
  }

  const testPassword = await bcrypt.compare(enteredPassword, result.password);

  if (!testPassword) {
    console.log("Incorrect Password !");
    req.session.inputData = {
      email: enteredEmail,
      message: "Incorrect Password  ! ",
      password: enteredPassword,
    };
    req.session.save(function () {
      res.redirect("/login");
    });
    return;
  }

  console.log(result);

  req.session.user = { id: result._id, email: result.email };
  req.session.isAuthenticated = true;

  req.session.save(function () {
    res.redirect("/profile");
  });
});

router.get("/admin", function (req, res) {
  console.log(req.session.user);

  if (!req.session.isAuthenticated || !req.session.user) {
    console.log("You're not allowed !");
    return res.redirect("/401");
  }
  if (!req.session.isAdmin) {
    return res.status("402").redirect("/402");
  }

  res.render("admin");
});

router.get("/profile", function (req, res) {
  console.log(req.session.user);

  if (!req.session.isAuthenticated || !req.session.user) {
    console.log("You're not allowed !");
    return res.redirect("/401");
  }

  res.render("profile");
});

router.post("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;

  req.session.save(function () {
    res.redirect("/login");
  });
});

router.get("/401", function (req, res) {
  res.render("401");
});

router.get("/402", function (req, res) {
  res.render("402");
});

module.exports = router;
