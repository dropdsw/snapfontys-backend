require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')
const morgan = require('morgan')
const rabbit = require('./controllers/rabbitMQController')



const app = express()
app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(morgan('dev'));


rabbit.connectToRabbitMQ();


app.use('/api', require('./routes/postRouter'))
app.use('/api', require('./routes/commentRouter'))



const URI = process.env.MONGODB_URL
mongoose.connect(URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
}, err => {
    if (err) throw err;
    console.log('Connected to mongodb')
})

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'))
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'))
    })
}


const port = process.env.PORT || 8084
app.listen(port, () => {
    console.log('Server is running on port', port)
})