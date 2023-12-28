const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const { log } = require("console");

app.use(
  cors({
    origin: "*",
  })
);

const receivedPaymentAlerts = [];
const confirmationstatus = {};
let confirmed = false;
let canceled = false;

app.use(bodyParser.json());

app.set("view engine", "ejs");

app.post("/fromPaymentAlert", (req, res) => {
  //   console.log(req.body);
  newRequest = req.body.data;
  receivedPaymentAlerts.push(newRequest);
  res.status(200).send("received successfully");
});

app.post("/confirm/:tabId", (req, res) => {
  console.log(req.params.tabId);
  const tabId = req.params.tabId;
  // const status = confirmationstatus[tabId];
  const action = req.body.Action;
  //   console.log(status);
  if (action === "confirm") {
    confirmed = true;
    confirmationstatus[tabId] = "confirm";
    console.log("confirmed");
    receivedPaymentAlerts.splice(req.body.index, 1);
    res.status(200).send();
  } else {
    canceled = true;
    res.status(201).send();
  }
});
app.post("/success/:tabId", (req, res) => {
  const tabId = req.params.tabId;
  console.log("/success :", tabId);
  if (confirmationstatus[tabId] === "confirm") {
    confirmed = false;
    delete confirmationstatus[tabId];
    res.status(200).send("confirmed");
  }
});

// app.post("/success", (req, res) => {
//   if (confirmed) {
//     confirmed = false;
//     res.status(200).send("confirmed");
//   }
// });

app.get("/paid", (req, res) => {
  res.render("paid");
});

app.get("/canceled", (req, res) => {
  res.render("canceled");
});

app.get("/", (req, res) => {
  res.render("base", {
    title: "payment alert",
    AlertValue: receivedPaymentAlerts,
  });
});

app.listen(8080, () => {
  console.log("server running on port 8080");
});
