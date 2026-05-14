require('colors')

module.exports = {
    name: 'ready',
    execute: (client) => {
        client.on('ready', () => {
            console.log(`✅ Estoy en línea como [${client.user.username}]`.green)
        })
    }
}
