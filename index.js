require("dotenv").config();

const serverURl = process.env.REACT_APP_SOCKET_API;
const socketURL = `${serverURl}/socket`;
const pollingURL = `${serverURl}/polling`;

const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.set("view engine", "ejs");

// const express = require("express");
// const app = express();
const http = require("http");
const { Server } = require("socket.io");
// const cors = require("cors");
// app.use(cors());
const server = http.createServer(app);

const receivedPaymentAlerts = [];
const receivedPaymentAlertsFromSocket = [];
const confirmationstatus = {};

if (pollingURL) {
  app.use(
    cors({
      origin: "*",
    })
  );

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
      // confirmed = true;
      confirmationstatus[tabId] = "confirm";
      console.log("confirmed");
      receivedPaymentAlerts.splice(req.body.index, 1);
      res.status(200).send();
    } else if (action === "cancel") {
      // canceled = true;
      confirmationstatus[tabId] = "cancel";
      console.log("canceled");
      receivedPaymentAlerts.splice(req.body.index, 1);
      res.status(201).send();
    }
  });
  app.post("/success/:tabId", (req, res) => {
    const tabId = req.params.tabId;
    console.log("/success :", tabId);
    if (confirmationstatus[tabId] === "confirm") {
      // confirmed = false;
      delete confirmationstatus[tabId];
      res.status(200).send("confirmed");
    } else if (confirmationstatus[tabId] === "cancel") {
      delete confirmationstatus[tabId];
      res.status(201).send();
    }
  });

  app.listen(8080, () => {
    console.log("server running on port 8080");
  });
} else if (socketURL) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  var val = 0;
  const socketRooms = new Map();

  io.on("connection", (socket) => {
    console.log(`user connected: ${val++} , ${socket.id}`);

    socket.on("paymentPageConnected", (data) => {
      let socketId;
      const room = data.NewReceiver.tabId;
      console.log(data.NewReceiver);
      socketRooms.set(socket.id, room);
      for (const [key, value] of socketRooms.entries()) {
        if (value === room) {
          socketId = room;
          break;
        }
      }
      socket.join(room);
      if (data.connected) {
        io.emit("paymentConfirmAlert", {
          receivedValue: data.NewReceiver,
          UniqueId: room,
          socketRoom: socketId,
        });
      }
    });

    socket.on("join_success_room", (data) => {
      const socketID = data.SocketRoom;
      socket.join(socketID);
      console.log("room joined from success page", socketID);
    });

    socket.on("clicked", (data) => {
      const roomName = data.SocketRoom;
      console.log("tab id", data.tabId);
      console.log(`payment confirmed ${roomName}`);
      if (data.clicked) {
        io.to(data.tabId).emit("success", true); // Emit success to specific tabId
      }
    });

    socket.on("canceled", (data) => {
      if (data.cancel) {
        io.to(data.tabId).emit("failed", true);
      }
    });
  });

  server.listen(3009, () => {
    console.log("server running on 3004");
  });
}

app.get("/", (req, res) => {
  res.render("base", {
    title: "payment alert",
    AlertValue: receivedPaymentAlerts,
    AlertValue2: receivedPaymentAlertsFromSocket,
  });
});

app.get("/paid", (req, res) => {
  res.render("paid");
});

app.get("/canceled", (req, res) => {
  res.render("canceled");
});
