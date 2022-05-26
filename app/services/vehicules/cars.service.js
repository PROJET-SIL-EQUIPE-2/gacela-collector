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

module.exports = {
    getAMOfCar
}