const Records = require('./records.model');
const fs = require("fs")
const csv = require("csv-parser")
const items_por_tanda = 3000
const upload = async (req, res) => {
    const { file } = req;
    cantidad_guardados = 0
    let resultados_parciales = []
    if (!file) return res.status(400).send("Debe ingresar un archivo")
    const stream = fs.createReadStream(file.path).pipe(csv())
    stream.on("data", async (data) => {
        stream.pause()
        resultados_parciales.push(data)
        if (resultados_parciales.length >= items_por_tanda) {
            try {
                await Records.insertMany(resultados_parciales)
                cantidad_guardados += resultados_parciales.length
                resultados_parciales = []


            } catch (error) {
                return res.status(500).send("Error al cargar datos")
            }
        }
        stream.resume()
    })
    stream.on("end", async () => {
        if (resultados_parciales.length > 0) {
            try {
                await Records.insertMany(resultados_parciales)
                cantidad_guardados += resultados_parciales.length
                resultados_parciales = []

            } catch (error) {
                return res.status(400).send(`Detalles del error: ${error}`)
            }
        }
        fs.unlink(file.path, (error) => {
            if (error) console.log("Error al eliminar el archivo")
        })
        res.send({ msg: `Se han guardado ${cantidad_guardados} registros` })

    })


};

const list = async (_, res) => {
    try {
        const data = await Records
            .find({})
            .sort({_id: -1})
            .limit(10)
            .lean();

        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json(err);
    }
};

module.exports = {
    upload,
    list,
};
