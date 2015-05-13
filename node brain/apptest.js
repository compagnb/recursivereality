//include library
var neurosky = require('./lib')

//relay app name and key
var client = neurosky.createClient({
	appName:'NodeNeuroSky',
	appKey:'0fc4141b4b45c675cc8d3a765b8d71c5bde9390'
})

//receive data
client.on('data',function(data){
	console.log(data.eSense)
});

// open socket
client.connect()
