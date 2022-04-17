const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const mqtt = require('mqtt');
const dotenv = require("dotenv")
const cors = require("cors");
const path = require("path");

dotenv.config({
    path: ".env"
})

app.set("port", process.env.PORT || 3000) ;


app.use(cors())

app.use(express.static('static'))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "static", "index.html"));
});

const client = mqtt.connect(process.env.MQTT_SERVER)

io.on('connection', (socket) => {
    client.subscribe('data/temperature', function (err) {
        client.on('message', async function (topic, message) {
            if (topic === "data/temperature"){
                console.log(topic)
                socket.emit("iot_temp", message.toString())
            }
        })
    })

    client.subscribe('data/speed', function (err) {
        client.on('message', async function (topic, message) {
            if (topic === "data/speed"){
                console.log(topic)
                socket.emit("iot_speed", message.toString())
            }
        })
    })
});

server.listen(app.get("port"), () => {
    console.log(`listening on *:${app.get("port")}`);
});