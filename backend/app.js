const express = require('express');
const app = express();
const router = require("./src/routes/intent.routes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api",router);

app.get("/",(req,res,next)=>{
    res.send("Welcome to the server!");
});

app.use((err,req,res,next)=>{
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
})

module.exports = app;