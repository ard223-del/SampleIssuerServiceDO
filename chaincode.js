
const fetch = (...args) =>
require('node-fetch').then(({default: fetch}) => fetch(...args));


exports.getKeyFromDID = async (DID) => {
    let userPass = process.env.user + ":" + process.env.pass;
    const res = await fetch(process.env.ChaincodeUrl, { 
        method: 'get', 
        headers: {
            'Authorization': 'Basic '+Buffer.from(userPass, 'utf8').toString('base64'), 
            'Content-Type': 'application/x-www-form-urlencoded'
        }, 
        body: {
            "chaincode": process.env.Chaincode,
            "args": [
                "GetKeyById",
                DID
            ],
            "sync": true
        }
    });


    console.log(res);
    if(!res.ok)
    {
        return null;
    }
    
    return res.body;
}