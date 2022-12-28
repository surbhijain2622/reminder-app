require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")

//APP config
const app = express()
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())

//DB config
const url="mongodb+srv://project:project123@cluster0.aekyu.mongodb.net/?retryWrites=true&w=majority";
const connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    })


const reminderSchema = new mongoose.Schema({
    reminderMsg: String,
    remindAt: String,
    isReminded: Boolean
})
const Reminder = new mongoose.model("reminder", reminderSchema)


//Whatsapp reminding functionality

setInterval(() => {
    Reminder.find({}, (err, reminderList) => {
        if(err) {
            console.log(err)
        }
        if(reminderList){
            reminderList.forEach(reminder => {
                if(!reminder.isReminded){
                    const now = new Date()
                    if((new Date(reminder.remindAt) - now) < 0) {
                        Reminder.findByIdAndUpdate(reminder._id, {isReminded: true}, (err, remindObj)=>{
                            if(err){
                                console.log(err)
                            }
                            const accountSid = process.env.ACCOUNT_SID 
                            const authToken = process.env.AUTH_TOKEN
                            const client = require('twilio')(accountSid, authToken); 
                            client.messages 
                                .create({ 
                                    body: reminder.reminderMsg, 
                                    from: 'whatsapp:+14155238886',       
                                    to: 'whatsapp:+917652850879' 
                                }) 
                                .then(message => console.log(message.sid)) 
                                .done()
                        })
                    }
                }
            })
        }
    })
},1000)
;


//API routes
app.get("/getAllReminder", (req, res) => {
    Reminder.find({}, (err, reminderList) => {
        if(err){
            console.log(err)
        }
        if(reminderList){
            res.send(reminderList)
        }
    })
})
app.post("/addReminder", (req, res) => {
    const { reminderMsg, remindAt } = req.body
    const reminder = new Reminder({
        reminderMsg,
        remindAt,
        isReminded: false
    })
    reminder.save(err => {
        if(err){
            console.log(err)
        }
        Reminder.find({}, (err, reminderList) => {
            if(err){
                console.log(err)
            }
            if(reminderList){
                res.send(reminderList)
            }
        })
    })

})
app.post("/deleteReminder", (req, res) => {
    Reminder.deleteOne({_id: req.body.id}, () => {
        Reminder.find({}, (err, reminderList) => {
            if(err){
                console.log(err)
            }
            if(reminderList){
                res.send(reminderList)
            }
        })
    })
})
const PORT = process.env.PORT ||9000;
app.listen(PORT, () => console.log("Backend started"))




