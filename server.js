
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
 // , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();


var redis = require("redis");

  // Add your cache name and access key.
var redisClient = redis.createClient(6380,'shopdeal.redis.cache.windows.net', {auth_pass: 'jO7xTK/QlyhwvQyWQJ8mvllHPquLPpkzMAMbDwMir0I=', tls: {servername: 'shopdeal.redis.cache.windows.net'}});


var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  hosts: [
    {
      protocol: 'http',
      host: '13.85.74.134',
      port: 9200
    }
  ]
});

client.ping({
  requestTimeout: 30000,

}, function (error) {
  if (error) {
    console.error('Cluster is not available !');
  } else {
    console.log('All clear!');
  }
});



app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  //app.set('view engine', 'jade');
  app.set('view engine', 'ejs');
  app.engine('html', require('ejs').renderFile);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var databaseUrl = "13.85.74.134:27017/ecommerce"; // "username:password@example.com/mydb"
var collections = ["users"]
//var db = require("mongojs").connect(databaseUrl, collections);

var mongojs = require('mongojs');
var db = mongojs(databaseUrl, collections);
//app.get('/', routes.index);
//app.get('/users', user.list);

//CDN
var cloudinary = require('cloudinary');


cloudinary.config({ 
  cloud_name: 'rmishra', 
  api_key: '674386685933353', 
  api_secret: 'U-JdMPulnf3H1dKobheXevwjhio' 
});

//app.use(express.static('public'));

redisClient.on("error", function (err) {
    console.log("Redis Error " + err);
});
app.get('/index.htm', function (req, res) {
   res.sendfile( __dirname + "/" + "index.htm" );
});

app.get('/', function(request, response){
//	 console.log("I am here");
   response.sendfile( path.join(__dirname + "/" +'home.html'));
});


app.get('/process_get', function (req, res) {

	
redisClient.set("key1", "value", function(err, reply) {
        console.log('redis'+reply);
    });

redisClient.get("key1",  function(err, reply) {
        console.log('redis2'+reply);
    });
	var age;
   // Prepare output in JSON format
   var searchItem;
   var displayVal;
	   var jsonObj;
	var arrSearchResults = [],

   response = {
      searchItem:req.query.searchItem
     //last_name:req.query.last_name
   };
  searchItem = response.searchItem;
 console.log("searchItem ElaStic"+searchItem);

client.search({
	
  index: 'products',
  type: 'product',
  body: {
    query: {
      match: {
        desc: searchItem
      }
    }
  }
}).then(results => {
    console.log(results);
    console.log('returned article titles:');
    results.hits.hits.forEach(function(items) {
    console.log('items'+items);
		itemsObj = 	JSON.stringify(items._source);
		console.log("ITEM"+itemsObj);
	
		 arrSearchResults.push(itemsObj);

  });
//   console.log("Size of results"+arrSearchResults.size());
   res.render(__dirname + '/home.html',{ searchResults: arrSearchResults});
}); 
});




app.get('/loadProduct', function (req, res) {
	console.log("Calling MongoDB to load product Details!");	
	var productId = req.query.productId;
	db.products.find({_id: productId}, function(err, products) {
	 console.log("Connect to MongoDB");
	  if( err || !products) console.log("No product found");
	  else products.forEach( function(product) {
		console.log(product);
		//	pName = 	product.name;
			// console.log("pName"+pName);
			productJson = JSON.stringify(product);
	  });
	   console.log("productName from MongoDb"+productJson);

	   res.render(__dirname + '/product description.html',{productInfo : productJson});
});
});


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});



