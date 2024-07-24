import express from "express";
import multer from "multer";
import fs from "fs";
import pg from "pg";
import env from "dotenv";

env.config();


const  db=new pg.Client({
    user:process.env.PG_USER,
    host:process.env.HOST,
    database:process.env.DATABASE,
    password:process.env.DATABASE,
    port:process.env.PORT
});

db.connect((err)=>{
    if(err)
        console.log("error in connnecting database");
    else
        console.log("database conneted successfully");
});

const app=express();
const port=3000;

const upload= multer({dest:'uploads/'});

app.get("/",(req,res)=>{
    res.render("index.ejs");
});


app.post("/upload",upload.single('csvFile'),(req,res)=>{
   if(!req.file){
    res.status(400).send("no files were uploaded");
   }else{
    //read the csv file
       fs.readFile(req.file.path,'utf8',(err,data)=>{
           if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading file');
            }try {
                // Split CSV data by lines
                const lines = data.trim().split(/\r?\n/);
                const headers = lines[0].split(',');
          
                // Parse CSV rows into JSON objects
                const jsonArray = lines.slice(1).map(line => {
                  const values = line.split(',');
                  return headers.reduce((obj, header, index) => {
                    obj[header.trim()] = values[index].trim();
                    return obj;
                  }, {});
                });
                   console.log(jsonArray);
                // Insert JSON data into PostgreSQL
                const json_data=JSON.stringify(jsonArray);
                console.log(json_data);
                db.query("insert into users(name,age,address,additional_info) select * from json_to_recordset($1::json) as x(name varchar,age int4,address jsonb ,additional_info jsonb)",[json_data],(err)=>{
                    if(err){
                        console.log('error inserting data into postgresql:',err);
                        res.status(500).send('error inserting data into postgres:');
                    }else{
                        console.log('data inserted successully');
                        res.status(200).send('data inserted successfully');
                    }
                });
              
              } catch (error) {
                console.error('Error processing CSV:', error);
                res.status(500).send('Error processing CSV');
              }

              //delete uploaded file from server
              fs.unlinkSync(req.file.path);
        });

    }
   
});

app.get("/age-distribution",async(req,res)=>{
    try {
        const result = await db.query(`select 
  case
   when age <20 then '<20'
   when age between 20 and 40 then '20-40'
   when age between 41 and 60 then '41-60'
   when age >60 then '>60'
 END as age_range, 
 Count(*) as count
 from users
 group by age_range
 order by age_range`);

        const ageDistribution = result.rows;
        console.log(ageDistribution);
        // Render age distribution table using EJS template
        res.render('age_dis.ejs', { ageDistribution });
    } catch (err) {
        console.error('Error fetching age distribution:', err);
        res.status(500).send('Error fetching age distribution');
    }


});

app.listen(port,()=>{
    console.log("listening on port ${port}");
});