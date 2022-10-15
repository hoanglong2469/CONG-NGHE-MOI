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
const AWS =require('aws-sdk');
const { S3 } = require('aws-sdk');
const config=new AWS.Config({
    accessKeyId:'AKIA6PDLSOFCEKQX22RS',
    secretAccessKey:'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',
    region:'ap-southeast-1'
});
AWS.config=config;

const docClient = new AWS.DynamoDB.DocumentClient();

const tableName='SinhVien';

app.get('/', (req, res) => {
 const params={
    TableName: tableName,
 };

 docClient.scan(params,(err,data)=>{
    if(err){
        res.send('Internal Server Error');
    }else{
        return res.render('index',{sinhViens:data.Items});
    }
 })
})

// const CLOUD_FRONT_URL='';

app.post("/", upload.fields([]), (req, res) => {
    const {stt, ma_sv, ten_sv,ns_sv,lop_sv } = req.body;
    const params = {
        TableName: tableName,
        Item: {
            "stt":stt,
            "ma_sv": ma_sv,
            "ten_sv": ten_sv,
            "ns_sv": ns_sv,
            "lop_sv": lop_sv
        },
    };

    docClient.put(params, (err, data) => {
        if (err) {
            console.log(err);
            res.send("Inrenal server error");
        } else {
            return res.redirect("/");
        }
    });
});

app.post('/delete',upload.fields([]),(req,res)=>{
    const listItems = Object.keys(req.body);
    if(listItems == 0){
        return res.redirect("/");
    }

    function onDeleteItem(index){
        const params = {
            TableName: tableName,
            Key:{
                "ma_sv":listItems[index]
            }
        }
        docClient.delete(params,(err,data)=>{
            if (err) {
                console.log(err);
                res.send("Inrenal server error");
            } else {
                if(index > 0){
                    onDeleteItem(index-1);
                } else{
                    return res.redirect("/");
                }
                }
        })
    }

    onDeleteItem(listItems.length-1);
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))