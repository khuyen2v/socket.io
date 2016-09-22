var mongoose = require('mongoose');

var courseSchema = new mongoose.Schema({
    name: String,
    iid: Number
}, {collection: 'course'});

module.exports = mongoose.model('Course', courseSchema);