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
    try {
        let car = await prisma.Vehicules.findFirst({
            where: {
                matricule: matricule
            }
        })


        let reservation = await prisma.Reservations.findFirst({
            where: {
                vehicule_id: car.vehicule_id
            }
        })
        let locataire = await prisma.Locataires.findUnique({
            where: {
                id: reservation.locataire_id
            }
        })
        return  {
            locataireId: locataire.id,
            carId: car.vehicule_id
        }
    }catch (e) {
        console.error(e)
    }
}

module.exports = {
    getAMOfCar,
    getRunningReservation
}