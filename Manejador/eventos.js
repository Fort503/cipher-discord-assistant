const fs = require('fs')
const path = require('path')

function listarArchivos(dir, archivos, carpetaPadre, objetoEventos, client) {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
        const filePath = path.join(dir, file)

        if (fs.statSync(filePath).isDirectory()) {
            listarArchivos(filePath, archivos, file, objetoEventos, client)
        }
        else if (file.endsWith('.js')) {
            const eventModule = require(filePath)
            const eventName = eventModule.name

            archivos.push(`${carpetaPadre}/${file}`)

            if (typeof eventModule.execute === 'function') {
                eventModule.execute(client)
            }

            if (!objetoEventos[carpetaPadre]) objetoEventos[carpetaPadre] = []
            objetoEventos[carpetaPadre].push(eventName)
        }
    })
}

function eventosHandler(client) {
    const eventsPath = path.resolve('./Eventos')
    let eventNames = []
    const objetoEventos = {}

    listarArchivos(eventsPath, eventNames, 'Eventos', objetoEventos, client)

    const eventosCargados = []

    for (let carpetaPadre in objetoEventos) {
        eventosCargados.push(`[${carpetaPadre}: ${objetoEventos[carpetaPadre].join(', ')}]`)
    }

    console.log(`📁 Eventos Cargados: ${eventosCargados.join(' - ')}`.yellow)
}

module.exports = eventosHandler
