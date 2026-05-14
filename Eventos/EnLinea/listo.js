require('colors')

module.exports = {
    name: 'clientReady',
    execute: (client) => {
        client.on('clientReady', () => {
            console.log(`✅ Estoy en línea como [${client.user.username}]`.green)
        })
    }
}
