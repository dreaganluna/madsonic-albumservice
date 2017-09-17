var init = function()
{
	// startup Restify server
	var server = Restify.createServer({'name': 'madsonic-albumservice'});
	server.use(Restify.fullResponse());
	server.use(Restify.bodyParser());
	server.use(Restify.queryParser());

	server.on("uncaughtException", onUncaughtException);
	server.use(mainHandler);

	server.get("/albums", getAlbums);

	server.listen(config.port, serverUpHandler);

	Winston.info("Server listening through port " + config.port + ".");
}

var mainHandler = function(request, result, next)
{
	// recreate url
	Winston.verbose(request.method + ": " + request.url);
	next();
};

var onUncaughtException = function(request, response, route, err)
{
	Winston.error("Uncaught Exception:\n", err);
	response.send(err); // Resume default behaviour.
}

var serverUpHandler = function()
{
	Winston.log('info', 'Restify server up and running on port ' + config.port);
};


// ================== //
// HANDLER FUNCTIONS: //
// ================== //


var getAlbums = function(request, response, next)
{
	if(request.params.type === "random" && request.params.fromYear)
	{
		// random, by year
		Winston.info("random, by year");
		getAlbumsByPeriod(request.params.user, request.params.pass, request.params.fromYear, request.params.toYear, function(err, albums)
		{
			response.send(getRandomAlbums(albums["madsonic-response"].albumListID3.album, 1));
		});
	}

	next();
};

var getAlbumsByPeriod = function(user, pass, from, to, callback)
{
	var options = JSON.parse(JSON.stringify(_httpOptions));
	options.url = config.api.madsonic.location;
	var client = Restify.createJSONClient(options);

	var endpoint = '/rest2/getAlbumListID3.view';
	endpoint += '?v=2.5.0&c=work-pc-rest&f=json&u=' + config.user;
	endpoint += '&p=' + config.pass;
	endpoint += '&type=byYear';
	endpoint += '&fromYear=' + from;
	endpoint += '&toYear=' + to;
	endpoint += '&size=500';
	// offset?

	Winston.info("Calling API with url: " + endpoint);
	client.get(endpoint, function(err, req, resp, object)
	{
		callback(err, object);
	});
};

var getRandomAlbums = function(albums, qty)
{
	var index = Math.floor((Math.random() * albums.length) + 1);
	return albums[index - 1];
};

// init requirements:
var Winston = require("./node_logging/logger.js")("madsonic-albumservice");
var Restify = require('restify');

// config
var config = require('./config.json');
Winston.info("Started with the following config:\n", JSON.stringify(config));

// init vars
var _httpOptions = {
	headers: {
		"Content-Type": "application/json"
	},
	retry: {
	'retries': 0
	},
	agent: false
};

init();