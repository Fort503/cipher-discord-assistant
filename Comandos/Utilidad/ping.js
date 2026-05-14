const Discord = require('discord.js')
const cor = require('../../config').discord.color

module.exports = {
    name: 'ping',
    description: '¡Mira mi ping!',
    type: Discord.ApplicationCommandType.ChatInput,

    run: async(client, interaction) => {
        const embed = new Discord.EmbedBuilder()
        .setColor(cor)
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
        .setDescription(`👋 ¡Hola **${interaction.user.username}**, mi ping está en \`${client.ws.ping}ms\`.`)

        interaction.reply({ embeds: [embed] })
    }
}
