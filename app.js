

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require('mongoose');
const fs = require('fs');

// Load the AWS SDK
var AWS = require('aws-sdk'),
    region = "us-east-1",
    secretName = "blogdbpass",
    secret,
    decodedBinarySecret;

// Create a Secrets Manager client
var cred = '';
var client = new AWS.SecretsManager({
    region: region
});
var mongoendpoint = '';


client.getSecretValue({SecretId: secretName}, function(err, data) {
    if (err) {
        if (err.code === 'DecryptionFailureException')
            // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InternalServiceErrorException')
            // An error occurred on the server side.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidParameterException')
            // You provided an invalid value for a parameter.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidRequestException')
            // You provided a parameter value that is not valid for the current state of the resource.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'ResourceNotFoundException')
            // We can't find the resource that you asked for.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
    }
    else {
        // Decrypts secret using the associated KMS CMK.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        if ('SecretString' in data) {
            secret = data.SecretString;
        } else {
            let buff = new Buffer(data.SecretBinary, 'base64');
            decodedBinarySecret = buff.toString('ascii');
        }
    }

    // Your code goes here.

    cred = JSON.parse(secret);
    console.log(cred.username);
    mongoendpoint = 'mongodb://kaizad:' + cred.password +'@blogdb.cluster-csqkl7yoxcrg.us-east-1.docdb.amazonaws.com:27017/?ssl=true&ssl_ca_certs=rds-combined-ca-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false';
    mongoose.connect(mongoendpoint, {
    useNewUrlParser: true,
    ssl: true,
    sslValidate: false,
    sslCA: fs.readFileSync('rds-combined-ca-bundle.pem')})
.then(() => console.log('Connection to DB successful'))
.catch((err) => console.error(err,'Error'));
});




const blogPostSchema = {title: String, content: String, link: String};

const Post = mongoose.model('post', blogPostSchema);

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get('/', function(req, res) {
  Post.find({}, function(err, foundposts) {
    if (!err) {
      res.render('home', {p1: homeStartingContent, posts: foundposts});
    }
  });
});

app.get('/contact', function(req, res) {
  res.render('contact', {p1: aboutContent});
});

app.get('/about', function(req, res) {
  res.render('about', {p1: contactContent});
});

app.get('/compose', function(req, res) {
  res.render('compose');
});

app.get('/posts/:topic', function(req, res) {
  var topic = req.params.topic;
  Post.find({}, function(err, foundposts) {
    foundposts.forEach(function(post) {
      if (_.lowerCase(post.title) === _.lowerCase(topic)) {
        res.render('post', {tit: post.title, con: post.content});
      }
    });
  });

});

app.post('/compose', function(req, res) {
  var link = '/posts/' + req.body.comp.replace(/\s+/g, '-').toLowerCase();
  const blogPost = new Post({title: req.body.comp,
    content: req.body.bpost, link: link});
  blogPost.save();
  res.redirect('/');
})


app.listen(80, function() {
  console.log("Server started on port 80");
});
