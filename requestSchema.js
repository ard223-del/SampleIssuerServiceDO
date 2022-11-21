const mongoose = require("./mongoose.js").mongoose;
const Schema = mongoose.Schema;

const requestSchema = new Schema({
    status: Number,
    type: String,
    username: String,
    createdDate: String,
    resolvedDate: String
});

requestSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
requestSchema.set('toJSON', {
    virtuals: true
});

requestSchema.findById = function (cb) {
    return this.model('Requests').find({id: this.id}, cb);
};

const Request = mongoose.model('Requests', requestSchema);




exports.findByUsername = async (username) => {
    return await Request.find({username: username});
};
exports.findByStatus = async (status) => {
    return await Request.find({status: status});
};

exports.customFind = async (params) => {
    return await Request.find(params);
};
exports.findById = (id) => {
    return Request.findById(id)
        .then((result) => {
            result = result.toJSON();
            delete result._id;
            delete result.__v;
            return result;
        });
};

exports.createRequest = (requestData) => {
    const request = new Request(requestData);
    return request.save();
};
exports.createRequest = (requestData, session) => {
    console.log("JWOEGHIOEWHGHEWOGIHEIGIOEIHGE")
    const request = new Request(requestData);
    return Request.create([request], { session: session });
};

exports.list = (perPage, page) => {
    return new Promise((resolve, reject) => {
        Request.find()
            .limit(perPage)
            .skip(perPage * page)
            .exec(function (err, requests) {
                if (err) {
                    reject(err);
                } else {
                    resolve(requests);
                }
            })
    });
};

exports.patchRequest = (id, requestData) => {
    return Request.findOneAndUpdate({
        _id: id
    }, requestData);
};

exports.removeById = (requestId) => {
    return new Promise((resolve, reject) => {
        Request.deleteMany({_id: requestId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};
