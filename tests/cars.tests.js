const carsService = require("../app/services/vehicules/cars.service")


carsService.getRunningReservation("11111111")
.then(data => {
    console.log(data)
})
.catch(e => {
    console.error(e)
})