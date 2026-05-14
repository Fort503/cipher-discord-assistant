require('colors')
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const Discord = require('discord.js')
const cor = require('../../config').discord.color
const Groq = require('groq-sdk')

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

const historiales = new Map()
const config = require('../../config')

function construirPrompt() {
    const ruta = path.resolve(__dirname, '../../reglas.json')
    let configReglas

    try {
        configReglas = JSON.parse(fs.readFileSync(ruta, 'utf-8'))
    } catch {
        configReglas = { personalidad: 'Eres una IA experta en programación.', reglas: [] }
    }

    const reglasStr = configReglas.reglas.length > 0
        ? '\nReglas:\n- ' + configReglas.reglas.join('\n- ')
        : ''

    return {
        role: 'system',
        content: configReglas.personalidad + reglasStr
    }
}

function limpiarHistorial(canalId) {
    historiales.delete(canalId)
}

function obtenerHistorial(canalId) {
    const ahora = Date.now()
    
    if (historiales.has(canalId)) {
        const entrada = historiales.get(canalId)
        if (ahora - entrada.ultimoUso > config.ia.expiracionMs) {
            limpiarHistorial(canalId)
            return null
        }
        entrada.ultimoUso = ahora
        return entrada.mensajes
    }
    
    if (historiales.size >= config.ia.maxCanales) {
        let canalMasAntiguo = null
        let tiempoMasAntiguo = Infinity
        
        for (const [id, entrada] of historiales.entries()) {
            if (entrada.ultimoUso < tiempoMasAntiguo) {
                tiempoMasAntiguo = entrada.ultimoUso
                canalMasAntiguo = id
            }
        }
        
        if (canalMasAntiguo) {
            limpiarHistorial(canalMasAntiguo)
        }
    }
    
    const nuevoHistorial = [construirPrompt()]
    historiales.set(canalId, {
        mensajes: nuevoHistorial,
        ultimoUso: ahora
    })
    
    return nuevoHistorial
}

module.exports = {
    name: 'ask',
    description: 'Pregúntale algo a la IA.',
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'mensaje',
            description: 'Escribe tu mensaje o pregunta.',
            type: Discord.ApplicationCommandOptionType.String,
            required: true
        }
    ],

    run: async(client, interaction) => {
        const mensaje = interaction.options.getString('mensaje')

        await interaction.deferReply()

        try {
            let historial = obtenerHistorial(interaction.channel.id)
            let historialExpirado = false
            
            if (!historial) {
                historialExpirado = true
                historial = obtenerHistorial(interaction.channel.id)
            }
            
            historial.push({ role: 'user', content: mensaje })

            const completion = await groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: historial
            })

            const respuesta = completion.choices?.[0]?.message?.content || 'Lo siento, no pude generar una respuesta.'

            historial.push({ role: 'assistant', content: respuesta })

            const system = historial[0]
            const rest = historial.slice(1)
            if (rest.length > config.ia.maxMensajes) {
                rest.splice(0, 2)
            }
            
            const entrada = historiales.get(interaction.channel.id)
            if (entrada) {
                entrada.mensajes = [system, ...rest]
            }

            if (respuesta.length > 1800) {
                const fileName = `${interaction.user.username}.txt`
                const filePath = path.join(__dirname, fileName)
                const preg = mensaje.length > 100 ? mensaje.slice(0, 100) + '...' : mensaje
                fs.writeFileSync(filePath, `Tú: ${mensaje}\n\n${respuesta}`, 'utf-8')

                const contenido = historialExpirado
                    ? `⚠️ **${interaction.user.username}**: Tu conversación anterior expiró por inactividad.\n\n**${interaction.user.username}:** ${preg}\n📚 La respuesta completa está en el archivo.`
                    : `**${interaction.user.username}:** ${preg}\n📚 La respuesta completa está en el archivo.`

                await interaction.editReply({
                    content: contenido,
                    files: [filePath]
                })

                fs.unlinkSync(filePath)
            } else {
                const embed = new Discord.EmbedBuilder()
                    .setColor(cor)
                    .setDescription(historialExpirado 
                        ? `⚠️ Tu conversación anterior expiró por inactividad.\n\n${respuesta}`
                        : respuesta
                    )
                    .setFooter({ text: `${interaction.user.username}: ${mensaje}` })
                    .setTimestamp()

                await interaction.editReply({ embeds: [embed] })
            }
        } catch (error) {
            console.error('Error en /ask:'.red, error)
            await interaction.editReply('❌ Ocurrió un error al generar la respuesta.')
        }
    }
}
