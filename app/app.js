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
const { Client } = require('pg')

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

const pgClient = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'postgres',
    password: 'timescale',
    port: 5432,
})


pgClient.connect()


io.on('connection', async (socket) => {
    //Send All data on client connection
    console.log("Hi")
    const query = {
        name: "fetch-all",
        text: "SELECT * FROM cars"
    }

    // Return data on connection ?
    pgClient.query(query, (err, res) => {
        if (!err){
            socket.emit("fetch_cars_data", res.rows)
        }
    })


    // client.subscribe('car/data', function (err) {
    //     if (err) return
    //     console.log("SUBSCRIBED")
    //     client.on('message', async function (topic, message) {
    //         if (topic === "car/data"){
    //             try {
    //                 const {matricule, temperature, speed, charge} = JSON.parse(message.toString())
    //                 // console.log(JSON.parse(message.toString()))
    //                 const inserted = await pgClient.query('INSERT INTO cars (matricule, temperature, speed, charge) VALUES ($1, $2, $3, $4) RETURNING matricule, temperature, speed, charge', [matricule, temperature, speed, charge])
    //                 if (!inserted){
    //                     console.err("Could not insert record")
    //                 }else{
    //                     socket.emit("fetch_car_data", inserted.rows)
    //                 }
    //             }catch (e) {
    //                 console.err(e)
    //             }
    //
    //         }
    //     })
    // })
});

client.subscribe('car/data', function (err) {
    if (err) return
    console.log("SUBSCRIBED")
    client.on('message', async function (topic, message) {
        if (topic === "car/data"){
            // try {
            //     const {matricule, temperature, speed, charge} = JSON.parse(message.toString())
            //     // console.log(JSON.parse(message.toString()))
            //     const inserted = await pgClient.query('INSERT INTO cars (matricule, temperature, speed, charge) VALUES ($1, $2, $3, $4) RETURNING matricule, temperature, speed, charge', [matricule, temperature, speed, charge])
            //     if (!inserted){
            //         console.err("Could not insert record")
            //     }else{
            //         socket.emit("fetch_car_data", inserted.rows)
            //     }
            // }catch (e) {
            //     console.err(e)
            // }

            io.fetchSockets()
                .then((sockets) => {

                    sockets.forEach((socket) => {
                        console.log("Sending event")
                        // try {
                        //     const {matricule, temperature, speed, charge} = JSON.parse(message.toString())
                        //     // console.log(JSON.parse(message.toString()))
                        //     const inserted = await pgClient.query('INSERT INTO cars (matricule, temperature, speed, charge) VALUES ($1, $2, $3, $4) RETURNING matricule, temperature, speed, charge', [matricule, temperature, speed, charge])
                        //     if (!inserted){
                        //         console.err("Could not insert record")
                        //     }else{
                        //         socket.emit("fetch_car_data", inserted.rows)
                        //     }
                        // }catch (e) {
                        //     console.err(e)
                        // }
                        // socket.emit("fetch_car_data", JSON.parse(message.toString()))
                    })
                })
                .catch((err) => {
                        console.error(err)
                    }
                )

        }
    })
})



server.listen(app.get("port"), () => {
    console.log(`listening on *:${app.get("port")}`);
});