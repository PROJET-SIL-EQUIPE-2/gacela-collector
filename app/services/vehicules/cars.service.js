const PrismaClient = require("@prisma/client").PrismaClient;
const prisma = new PrismaClient();


const getAMOfCar = async (matricule) => {
    try {
        let car = await prisma.Vehicules.findFirst({
            where: {
                matricule: matricule
            }
        })
        return await prisma.AgentsMaintenance.findUnique({
            where: {
                agent_id: car.responsable
            }
        });
    }catch (e){
        return null
    }
}

const getRunningReservation = async (matricule) => {

        let car = await prisma.Vehicules.findFirst({
            where: {
                matricule: matricule
            }
        })
        if (!car){
            throw Error("No car of that matricule was found")
        }


        let reservation = await prisma.Reservations.findFirst({
            where: {
                vehicule_id: car.vehicule_id
            }
        })
        if (!reservation) {
            throw Error("No reservation was found")
        }
        let locataire = await prisma.Locataires.findUnique({
            where: {
                id: reservation.locataire_id
            }
        })
        if (!locataire) {
            throw  Error("No locataire associated found")
        }
        return  {
            locataireId: locataire.id,
            carId: car.vehicule_id
        }

}

module.exports = {
    getAMOfCar,
    getRunningReservation
}