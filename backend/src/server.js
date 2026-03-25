import 'dotenv/config'
import { buildApp } from './app.js'
import { startEventRemindersCron } from './cron/eventReminders.js';

const PORT = parseInt(process.env.PORT || '3000')
const HOST = process.env.HOST || '0.0.0.0'

const app = await buildApp()

try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`🚀 CCO KidScam API corriendo en http://${HOST}:${PORT}`)

    // Iniciar tareas programadas (cron)
    startEventRemindersCron();

} catch (err) {
    app.log.error(err)
    process.exit(1)
}
