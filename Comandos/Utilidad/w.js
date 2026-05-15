const Discord = require('discord.js')

module.exports = {
    name: 'w',
    description: 'Envía un mensaje $w',
    type: Discord.ApplicationCommandType.ChatInput,

    run: async(client, interaction) => {
        interaction.reply({ content: '$w' })
    }
}
