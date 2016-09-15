/**
 * Generates restful API
 * @param null
 * @return func
 */
var fs 	= require('fs')
	, async	= require('async')
	, _	= require('underscore')
	, ApiFS	= require('./api-fs')
	, db = require('mongoose');


function ApiModel(creds){
	errLog										= [];
	errLog.connOpen 					= "Connection successful to database.";
	errLog.connErr						= "Connection failed to database.";
	errLog.setModelsLoading		=	'Loading model: ';
	errLog.setModelsDone			= 'All files loaded into module cache.';
	errLog.setSchemasBegin		= 'Checking health for schemas...';
	errLog.setSchemasOk				= 'Schema injected properly: ';
	errLog.setSchemasDone			= 'All schemas are healthy.';

	this.creds = creds;
}


/* testing this file change */

/**
 * require() each file from bootstrap
 * @desc callback to register()
 * @param Mixed
 * @return Function
 */
ApiModel.prototype.setModels = function(modelfile, callback){
	for(var i=0;i<modelfile.length;i++) {
		console.log(errLog.setModelsLoading +  modelfile[i]);
		//; require() is blocking, we want to assure that
		//; all files are loaded into the cache gracefully
		//; we're using async to prevent any core modules
		//; from loading in the wrong order since the amount of models
		//; can grow quickly, require() sync first then async.
		require(modelfile[i]);
		if(!_.contains(Object.keys(require('module')._cache), modelfile[i])) callback(false)
	}
		callback(console.log(errLog.setModelsDone))
}


/**
 * Mongoose connect param
 * @desc Connect to the db
 * @param Null
 * @return Object
 */
ApiModel.prototype.connectMongoDb = function(self, callback){

	var strAuth, dbBuild, authDb;

	authDb =
		(
			_.isUndefined(this.creds.dbUser) &&
			_.isUndefined(this.creds.dbPass)
		) ?
		strAuth=':' : null;

	dbBuild =
		'mongodb://'+
		this.creds.dbUser+
		strAuth+
		this.creds.dbPass+
		'@'+
		this.creds.dbHost+
		':'+
		this.creds.dbPort+
		'/'+
		this.creds.dbName;

	(db instanceof Object) ?
		db.connect(dbBuild) : db.disconnect();

	db.connection.on('open', function(){
		callback(console.log(errLog.connOpen));
	}
	,
	db.connection.on('error', function(){
		db.disconnect()
		callback(console.log(errLog.connErr));
	}));
}


/**
 * Check that schemas are valid
 * @desc schemas are valid construct
 * @param Void
 * @return Boolean
 */
ApiModel.prototype.setSchemas = function(modelfile, self, callback){
	console.log(errLog.setSchemasBegin)
	for(var i=0;i<modelfile.length;i++){
		self.getModels(modelfile[i], callback);
		console.log(errLog.setSchemasOk + modelfile[i]);
	}
	callback(console.log(errLog.setSchemasDone));
}

/**
 * Handle models, return err if not
 * @desc Request model from mongoose
 * @param Object
 * @return Object
 */
ApiModel.prototype.getModels = function(item, callback){
	sanitizeSchemaName(item, function(schemaName){
		callback(db.model(schemaName));
	});
}

/**
 * Load schemas into Mongoose
 * @desc Loads schemas from ApiFS.scan()
 * @param Array
 * @return Object
 */
ApiModel.prototype.modelConductor = function(results){

	var self = this;
	var modelfile = results;

	async.series(
	{
				setModels 			: async.apply(self.setModels, modelfile)
			, connectMongoDb 	: async.apply(self.connectMongoDb, self)
			,	setSchemas 			: async.apply(self.setSchemas, modelfile, self)
	});
}

/**
 * Utility for schema names
 * @desc split, pop and slice *{^_^}*
 * @param Array
 * @return Function
 */
function sanitizeSchemaName(dirtyName, callback){
	var n
	n=dirtyName.split("/").pop(-1);
	n=n.split(".");
	n=n[0].charAt(0).toUpperCase() + n[0].slice(1);
	callback(n);
}



/**
 * This is a comment header
 * @desc this is a description
 * @param type
 * @return type
 */

exports = module.exports = ApiModel;
