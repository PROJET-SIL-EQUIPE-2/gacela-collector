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

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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


io.on('connection', async (socket) => {
    //Send All data on client connection
    console.log("Hi")


    const cars_statuses = await prisma.VehiculesStatus.findMany()

    // Return data on connection ?
    socket.emit("fetch_cars_data", cars_statuses)

});

client.subscribe('car/data', function (err) {
    if (err) return
    console.log("SUBSCRIBED")
    client.on('message', async function (topic, message) {
        if (topic === "car/data"){
            io.fetchSockets()
                .then((sockets) => {
                    sockets.forEach(async (socket) => {
                        console.log("Sending event")
                        try {
                            const {
                                matricule,
                                temperature,
                                speed,
                                charge,
                                lat,long
                            } = JSON.parse(message.toString())
                            // console.log(JSON.parse(message.toString()))
                            // const inserted = await pgClient.query('INSERT INTO cars (matricule, temperature, speed, charge) VALUES ($1, $2, $3, $4) RETURNING matricule, temperature, speed, charge', [matricule, temperature, speed, charge])
                            const data = await prisma.VehiculesStatus.upsert({
                                where:{
                                    matricule: matricule,
                                },
                                update: {
                                    temperature: temperature,
                                    speed: speed,
                                    charge: charge,
                                    lat: lat,
                                    long: long
                                },
                                create: {
                                    matricule: matricule,
                                    temperature: temperature,
                                    speed: speed,
                                    charge: charge,
                                    lat: lat,
                                    long: long
                                }
                            })
                            if (!data){
                                console.error("Could not insert record")
                            }else{
                                socket.emit("fetch_car_data", data)
                            }
                        }catch (e) {
                            console.error(e)
                        }
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