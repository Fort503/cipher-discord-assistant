const fs = require('fs').promises
require('colors')
const Discord = require('discord.js')

async function comandosHandler(client) {
    const slashArray = []
    let comandosCargados = []
    client.slashCommands = new Discord.Collection()

    try {
        const folders = await fs.readdir('./Comandos')

        for (const subfolder of folders) {
            const files = await fs.readdir(`./Comandos/${subfolder}/`)

            for (const file of files) {
                if (!file.endsWith('.js')) return

                const command = require(`../Comandos/${subfolder}/${file}`)

                if (!command.name) return

                client.slashCommands.set(command.name, command)
                slashArray.push(command)
                comandosCargados.push(command.name)
            }
        }

        client.on('ready', () => {
            client.guilds.cache.forEach(guild => guild.commands.set(slashArray))
            console.log(`📘 Comandos Cargados: [${comandosCargados.join(', ')}]`.blue)
        })

    } catch (error) {
        console.log('Error al cargar comandos: '.red, error)
    }
}

module.exports = comandosHandler
