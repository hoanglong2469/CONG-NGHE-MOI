const port = 3000

const express = require('express')
const app = express()

const data= require('./store')

const multer=require('multer');
const upload=multer();

app.use(express.static('./templates'))
app.set('view engine','ejs')
app.set('views','./templates')

// //config aws dynamodb
// const AWS =require('aws-sdk')
// const config=new AWS.Config({
//     accessKeyId:'AKIA6PDLSOFCLR4FCEEE',
//     secretAccessKey:'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',
//     region:'ap-southeast-1'
// });
// AWS.config=config;

app.get('/', (req, res) => {
 return res.render('index',{data,data})
})

app.post('/',upload.fields([]),(req,res)=>{
 data.push(req.body)
 return res.redirect('/');
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))