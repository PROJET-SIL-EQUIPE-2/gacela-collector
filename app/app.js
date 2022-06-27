const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});
const mqtt = require('mqtt');
const dotenv = require("dotenv")
const cors = require("cors");
const path = require("path");
const { Client } = require('pg')

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const axios = require("axios")

const carsService = require("./services/vehicules/cars.service")

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

    socket.on("join", (room) => {
        console.log(`Socket wants to join room ${room}`)
        socket.join(room)
    })

    const cars_statuses = await prisma.VehiculesStatus.findMany()

    // Return data on connection ?
    // socket.emit("fetch_cars_data", cars_statuses)
    io.emit("fetch_cars_data", cars_statuses)
});

client.subscribe('car/data', function (err) {
    if (err) return
    console.log("SUBSCRIBED")
    client.on('message', async function (topic, message) {
        if (topic === "car/data"){
            try {
                const {
                    matricule,
                    temperature,
                    speed,
                    charge,
                    lat,long
                } = JSON.parse(message.toString())
                console.log(JSON.parse(message.toString()))
                let agent = await carsService.getAMOfCar(matricule)
                /*
                * Send car data to agent's socket identified by
                * socket id
                * */
                console.log(agent)
                if (agent){
                    io.to(`agent_${agent.agent_id}`).emit("fetch_car_data", {
                        matricule,
                        temperature,
                        speed,
                        charge,
                        lat, long
                    })
                }

                // Check if car is part of a valid reservation
                let carReservation = await carsService.getRunningReservation(matricule);
                if (carReservation){
                    // Emit event to locataire
                    console.log(`Sending to locataire_${carReservation.locataireId}#car_${carReservation.carId}`)
                    io.to(`locataire_${carReservation.locataireId}#car_${carReservation.carId}`).emit("fetch_car_data", {
                        matricule,
                        lat, long
                    })
                }

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
                await prisma.VehiculesStatusHistory.create({
                    data: {
                        matricule: matricule,
                        temperature: temperature,
                        speed: speed,
                        charge: charge,
                        lat: lat,
                        long: long
                    }
                });

                if (!data){
                    console.error("Could not insert record")
                }else{
                    /*
                    * Sending Emit event after db update is kinda mandatory here
                    * since web client need car id also
                    * */
                    io.to("web").emit("fetch_car_data", data)
                }
            }catch (e) {
                console.error(e)
            }
        }
    })
})




// On blocked
// Send notification to AM when car is blocked

client.subscribe("car/panne", (err) => {
    if (err) throw Error(err)
    client.on("message", async (topic, message) => {
        // TODO: Replace with panne
        // ODB sends panne details
        if (topic === "car/panne"){
            const {
                matricule,
                panne_type,
                lat,
                long
            } = JSON.parse(message.toString());
            const agent = carsService.getAMOfCar(matricule)
            switch (panne_type) {
                case "blocked":
                    // TODO Creat task by posting to main backend
                    if (agent){

                        // create  notification
                        let res = await axios.post(process.env.BACKEND_API_URL + "notifications", {
                            title: "A car is blocked",
                            body: `One of your cars is blocked, matricule is ${matricule}, it's position is ${lat}, ${long}`,
                            agent_id: agent.agent_id
                        })
                        // TODO: Create task
                        res = await axios.post(process.env.BACKEND_API_URL + "tasks/create", {
                            important: true,
                            description: `Unlock car of matricule ${matricule}, it's position is ${lat}, ${long}`,
                            agent_id: agent.agent_id
                        })
                        console.log(res.data)
                    }
                    break
                case "test1":
                    break
                case "test2":
                    break
                default:
                    break
            }
        }
    })
})



// Finish trajet
client.subscribe("trajet/finish", (err) => {
    if(err) throw Error(err)
    client.on("message", async (topic, message) => {
        if (topic === "trajet/finish"){
            const {matricule} = JSON.parse(message.toString())
            try {
                let carReservation = await carsService.getRunningReservation(matricule)
                console.log(carReservation)
                io.to(`locataire_${carReservation.locataireId}#car_${carReservation.carId}`).emit("finish", "Good luck x)")

            }catch (e) {
                io.to("error-room").emit(e.message)
                console.log(e.message)
            }


        }
    })
})

instrument(io, {
    auth: false
})

server.listen(app.get("port"), () => {
    console.log(`listening on *:${app.get("port")}`);
});
