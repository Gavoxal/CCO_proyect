import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

async function main() {
    const filePath = 'C:\\Users\\ASUS\\Documents\\Proyectos individuales\\CCO_Proyect\\CCO_proyect\\lista general mvidas.xlsx'
    const form = new FormData()
    form.append('file', fs.createReadStream(filePath))

    console.log('Enviando archivo al endpoint /import/infantes...')
    
    try {
        const res = await axios.post('http://localhost:3000/api/v1/import/infantes', form, {
            headers: form.getHeaders(),
            timeout: 180000 // 3 min
        })
        
        console.log('Respuesta del servidor:')
        console.log(JSON.stringify(res.data, null, 2))
    } catch (err) {
        console.error('Error enviando petición:', err.response?.data || err.message)
    }
}

main()
