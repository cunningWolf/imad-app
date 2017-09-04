var express = require('express');
var morgan = require('morgan');
var path = require('path');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(session({
    secret:'somerandomvalue',
    cookie:{maxAgeOf: 1000*60*60*24*30}
}));

var articles = {
    'article-one':{
                title: 'Article One by GB',
                heading: 'Article One',
                date: 'August 12 2017',
                content: `<p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>
                        <p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>
                        <p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>
                        <p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>`
        
    },
    'article-two':{
                title: 'Article Two by GB',
                heading: 'Article Two',
                date: 'August 12 2017',
                content: `<p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>
                        <p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>
                        <p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>
                        <p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>`
        
    },
    'article-three':{
                title: 'Article Three by GB',
                heading: 'Article Three',
                date: 'August 12 2017',
                content: `<p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>
                        <p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>
                        <p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>
                        <p>
                            My first article .My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article 
                            My first article My first article My first article My first article My first article My first article My first article 
                        </p>`
        
    },
};

function createTemplate(data){
    var title = data.title;
    var heading = data.heading;
    var date = data.date;
    var content = data.content;
    
    var htmlTemplate = `
<html>
    
    <head>
        
        <title>
          ${heading}
        </title>
        <meta name = "viewport" content = "width=device-width, initial-scale=1"> 
        <link href="/ui/style.css" rel="stylesheet" />
        <style>
           
        </style>
    </head>
    <body>
        <div class="container">
                    <div>
                        <a href = "/">Home</a>
                    </div>
                    <hr/>
                    <h3>
                        ${heading}
                    </h3>
                    <div>
                        ${date.toDateString()}
                    </div>
                    <div>
                       ${content}
                    </div>
         </div>
        
    </body>
    
</html>`;

return htmlTemplate;
}

var Pool =  require('pg').Pool;

var config = {
    user : 'gauravtcs15',
    database: 'gauravtcs15',
    host: 'db.imad.hasura-app.io',
    port: '5432',
    password: process.env.DB_PASSWORD
};

var pool = new Pool(config);

var counter = 0;

app.get('/counter', function (req, res) {
  counter = counter + 1;
  res.send(counter.toString());
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname,'ui','index.html'));
});
var names = [];
app.get('/submit-name',function(req,res){
    //getting name from req
    var name = req.query.name;
    names.push(name);
    res.send(JSON.stringify(names));
    
});

app.get('/test-db',function(req,res){
    pool.query('Select * from test',function(err,result){
        if(err){
            res.status(500).send(err.toString());
        }
        else{
            res.send(JSON.stringify(result.rows));
        }
    })
});

app.post('/login',function(req,res){
      var username = req.body.username;
   var password = req.body.password;
   
   pool.query('Select * from "user" where username = $1',[username],function(err,result){
       if(err){
           res.status(500).send(err.toString());
       } 
       else{
           if( result.rows.length === 0){
               res.send(403).send('username/password is invalid');
           }
           else{
                var dbString = result.rows[0].password;
                var salt = dbString.split('$')[2];
                var hashedPassword = hash(password,salt);
                if(hashedPassword === dbString){
                    req.session.auth = {userId: result.rows[0].id};
                    //sesion setting a cookie with as session id
                    //server side it maps the session id to an object
                    //oject contains 
                    res.send('credentials are correct');
                }
                else{
                    res.send(403).send('username/password is invalid');
                }
           }
          
           res.send('user successfully created'+username);
       } 
   });
});

app.get('/check-login',function(req,res){
   if(req.session && req.session.auth && res.session.auth.userId){
       res.send('you are logged in: '+ req.session.auth.userId.toString());
   }
   else
   {
       res.send('you are not loggd in');
   }
   
});

app.post('/create-user',function(req,res){
   
   
   var username = req.body.username;
   var password = req.body.password;
   var salt = crypto.randomBytes(128).toString('hex');
   var dbString = hash(password,salt);
   pool.query('insert into "user"(username,password) values ($1,$2)',[username,dbString],function(err,result){
       if(err){
           res.status(500).send(err.toString());
       } 
       else{
           res.send('user successfully created'+username);
       } 
   });
});


app.get('/hash/:input',function(req,res){
    var hashed = hash(req.params.input,'saltissalty');
   res.send(hashed);
});

function hash (input,salt){
    var hashed = crypto.pbkdf2Sync(input,salt,10000,512,'sha512');
   return ["pbkdf2Sync","10000",salt,hashed.toString('hex')].join("$");
}

app.get('/articles/:articleName', function (req,res) {
    
    pool.query("select * from article where title = $1",[req.params.articleName],function(err,result){
       if(err){
           res.status(500).send(err.toString());
       } 
       else{
           if(result.rows.length === 0){
               res.status(404).send('Article not Found');
           }
           else{
               var articleData = result.rows[0];
               res.send(createTemplate(articleData));
           }
       }
    });
   
});

app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/ui/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'main.js'));
});

app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});


// Do not change port, otherwise your app won't run on IMAD servers
// Use 8080 only for local development if you already have apache running on 80

var port = 80;
app.listen(port, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
