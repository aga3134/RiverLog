var mongoose = require('mongoose');

var AlertStatisticSchema = new mongoose.Schema({
	time : Date,
	rainfall: Number,
	Flood: Number,
	ReservoirDis : Number,
	highWater  : Number,
	water: Number,
	debrisFlow: Number,
	thunderstorm: Number,
	typhoon: Number
}, {collection: "alertStatistic"});

module.exports = mongoose.model('alertStatistic', AlertStatisticSchema);