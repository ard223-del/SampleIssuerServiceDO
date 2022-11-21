const mongoose = require("./mongoose.js").mongoose;
const Schema = mongoose.Schema;

const requestSchema = new Schema({
    status: Number,
    type: String,
    username: String,
    createdDate: String,
    resolvedDate: String
});

const VCSchema = new Schema({
    context: Object,
    issuedDate: String,
    credentialSubject: Object,
    proof: Object,
    username: String,
    request: requestSchema
});

VCSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
VCSchema.set('toJSON', {
    virtuals: true
});

VCSchema.findById = function (cb) {
    return this.model('VCs').find({id: this.id}, cb);
};


const VC = mongoose.model('ReqVCs', VCSchema);




exports.findByUsername = async (username) => {
    return await VC.find({username: username});
};

exports.findRequestsByUsername = async (username) => {
    return await VC.find({username: username}).select({id: 1, request: 1, username: 1});
};

exports.customFind = async (params) => {
    return await VC.find(params).select({id: 1, request: 1, username: 1});
};

exports.findById = (id) => {
    return VC.findById(id)
        .then((result) => {
            result = result.toJSON();
            delete result._id;
            delete result.__v;
            return result;
        });
};

exports.findRequestById = (id) => {
    return VC.findById(id).select({id: 1, request: 1, username: 1});
};

exports.createVC = async (VCData) => {
    const vc = new VC(VCData);
    return await vc.save();
};

exports.list = (perPage, page) => {
    return new Promise((resolve, reject) => {
        VC.find()
            .limit(perPage)
            .skip(perPage * page)
            .exec(function (err, VCs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(VCs);
                }
            })
    });
};

exports.patchVC = async (id, VCData) => {
    return await VC.findOneAndUpdate({
        _id: id
    }, VCData);
};

exports.removeById = (VCId) => {
    return new Promise((resolve, reject) => {
        VC.deleteMany({_id: VCId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};
