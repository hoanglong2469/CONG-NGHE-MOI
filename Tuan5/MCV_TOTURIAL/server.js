const port = 3000

const express = require('express')
const app = express()
const {v4:uuid}=require("uuid");

const data= require('./store')

const multer=require('multer');
const upload=multer();

app.use(express.static('./templates'))
app.set('view engine','ejs')
app.set('views','./templates')

// //config aws dynamodb
const AWS =require('aws-sdk');
const config=new AWS.Config({
    accessKeyId:'',
    secretAccessKey:'',
    region:'ap-southeast-1'
});
AWS.config=config;

const docClient = new AWS.DynamoDB.DocumentClient();

const tableName='SanPham';

app.get('/', (req, res) => {
 const params={
    TableName: tableName,
 };

 docClient.scan(params,(err,data)=>{
    if(err){
        res.send('Internal Server Error');
    }else{
        return res.render('index',{sanPhams:data.Items});
    }
 })
})

app.post("/", upload.fields([]), (req, res) => {
    const { ma_sp, ten_sp,sl_sp } = req.body;
    const params = {
        TableName: tableName,
        Item: {
            "ma_sp": ma_sp,
            "ten_sp": ten_sp,
            "sl_sp": sl_sp
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
                "ma_sp":listItems[index]
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

const storage=multer.memoryStorage({
    destination(req,file,callback){
        callback(null,'');
    },
})

function checkFile(file,cb){
    
}

app.listen(port, () => console.log(`Example app listening on port ${port}!`))