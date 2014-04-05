//	General
var express = require('express');
var app = express();
var fs = require('fs');
var dot = require('dot');

app.configure(function(){
	app.use(express.json());
	app.use(express.urlencoded());
  app.use(app.router);
});


//	Mongoose
var mongoose = require('mongoose');
var locationPointSchema = mongoose.Schema({
	latitude : String,
	longitude : String,
	userId : String,
	created : String
});
var LocationPoint = mongoose.model('LocationPoint', locationPointSchema);
var mongoURI = process.env.MONGOLAB_URI;


//	Moment
var moment = require('moment');

app.get('/map', function(req,res){

	mongoose.connect(mongoURI);

	// Insert into MongoDB
	var db = mongoose.connection;

	db.once('open', function callback() {

		LocationPoint.find({},'latitude longitude userId created', function (err, points) {
		  if (err){
		  	res.send(err);
		  }else{
				fs.readFile(__dirname + '/map_template.html', function (err, template) {
		
					if (err) {
						//  #TODO send error when this happens
						res.send(err);
					}else{

						var mapMarkers = '[';

						var i=0;
						for (i=0; i < points.length; i++) {
							var aMarker = '["' + points[i].created + '", ' + points[i].latitude + ', ' + points[i].longitude + ']';
							if (i < points.length-1){
								aMarker = aMarker + ', ';
							}

    					mapMarkers = mapMarkers + aMarker;
						}

						mapMarkers = mapMarkers + ']';

						var data = {
							markers : mapMarkers
						};

				    var templateFn = dot.template(template);
				    var templateHTML = templateFn(data);

				    res.send(templateHTML);

				    db.close();
					}
		  	});
			}
		});
	});
});

app.post('/location', function(req, res){
	//	Log
	console.log('POST /location');
	console.log('latitude=' + req.body.latitude);
	console.log('longitude=' + req.body.longitude);
	console.log('userId=' + req.body.userId);


	mongoose.connect(mongoURI);

	// Insert into MongoDB
	var db = mongoose.connection;

	db.once('open', function callback() {

		var nowString = moment().format('YYYYMMDDHHmmSS');

		var params = {
			latitude : req.body.latitude,
			longitude : req.body.longitude,
			userId : req.body.userId,
			created : nowString 
		};

		var aLocationPoint = new LocationPoint(params);
		aLocationPoint.save(function callback(err, savedLocationPoint){
			if (err){
				console.error(err);

				var response = {
					success : false,
					message : err
				};

				res.send(response);
			}else{
				console.log('Added new location! \n');

				var response = {
					success : true
				};

				res.send(response);
			}

			db.close();
		});
	});

});

var server = app.listen(process.env.PORT || 4000, function() {
		mongoose.connection.on('connected', function () {
			// console.log('Mongoose default connection open to ' + mongoURI);
		});

		mongoose.connection.on('error',function (err) {
			console.log('Mongoose default connection error: ' + err);
		});

		mongoose.connection.on('disconnected', function () {
			// console.log('Mongoose default connection disconnected');
		});
	
    console.log('Listening on port %d', server.address().port);
});