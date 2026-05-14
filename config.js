require('dotenv').config()

const config = {
    discord: {
        token: process.env.DISCORD_BOT_TOKEN,
        color: '3498DB'
    },
    ia: {
        maxCanales: 10,
        expiracionMs: 30 * 60 * 1000,
        maxMensajes: 10
    }
}

module.exports = config
