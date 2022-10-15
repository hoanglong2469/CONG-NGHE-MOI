
const port = 3000

const express = require('express')
const path=require('path')
const app = express()
const {v4:uuid}=require("uuid");

const data= require('./store')

app.use(express.static('./templates'))
app.set('view engine','ejs')
app.set('views','./templates')

//config aws dynamodb
const AWS =require('aws-sdk');
const config=new AWS.Config({
    accessKeyId:'AKIA3EHD5J5ZI6XSSTF5',
    secretAccessKey:'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',
    region:'ap-southeast-1'
});
AWS.config=config;
//s3
const s3 = new AWS.S3 ({
    accessKeyId:'AKIA3EHD5J5ZI6XSSTF5',
    secretAccessKey:'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',
});

const docClient = new AWS.DynamoDB.DocumentClient();

const tableName='SanPhamSua';

//config upload
const multer=require('multer');

const storage=multer.memoryStorage({
    destination(req,file,callback){
        callback(null,'');
    },
})

function checkFileType(file,cb){
    const fileTypes=/jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const minetype = fileTypes.test(file.mimetype);
    if(extname && minetype){
        return cb(null,true);
    }
    return cb("Error:Image Only");
}

const upload=multer({
    storage,
    limits:{fieldSize: 2000000},
        fileFilter(req,file,cb){
            checkFileType(file,cb);
    },
});

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

// app.post("/", upload.fields([]), (req, res) => {
//     const { ma_sp, ten_sp,sl_sp } = req.body;
//     const params = {
//         TableName: tableName,
//         Item: {
//             "ma_sp": ma_sp,
//             "ten_sp": ten_sp,
//             "sl_sp": sl_sp
//         },
//     };

//     docClient.put(params, (err, data) => {
//         if (err) {
//             console.log(err);
//             res.send("Inrenal server error");
//         } else {
//             return res.redirect("/");
//         }
//     });
// });

//Update api create item
const CLOUD_FRONT_URL='https://d2urh2phrjrxki.cloudfront.net/';

app.post('/',upload.single('image'),(req,res) =>{
    const {ma_sp,ten_sp,sl_sp} =req.body;
    const image=req.file.originalname.split(".");

    const fileType=image[image.length -1];

    const filePath = `${uuid() + Date.now().toString()}.${fileType}`;
   
    const params={
        Bucket : "uploads3-bucket-long-2001",
        Key :filePath,
        Body:req.file.buffer
    }

    //upload co hinh anh
  s3.upload(params,(err,data)=>{
    if (err) {
        console.log(err);
        res.send("Inrenal server error");
    } else {
        const newItem={
            TableName: tableName,
            Item: {
            "ma_sp": ma_sp,
            "ten_sp": ten_sp,
            "sl_sp": sl_sp,
            "image_url": `${CLOUD_FRONT_URL}${filePath}`
            },
        }

        docClient.put(newItem, (err, data) => {
            if (err) {
                console.log(err);
                res.send("Inrenal server error");
            } else {
                return res.redirect("/");
            }
        }); 
    }   
})
});

app.post('/delete',upload.single('image'),(req,res)=>{
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`))