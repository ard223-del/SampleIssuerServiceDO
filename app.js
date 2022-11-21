const express = require('express');
const UserModel = require("./userSchema.js")
const RequestModel = require("./requestSchema.js")
const VCRequestModel = require("./requestVCSchema.js")
var bodyParser = require('body-parser')
var app = express()
const AuthMiddleWare = require("./authMiddleware.js");
const AuthorizationController = require("./authorizationController");
const chaincode = require("./chaincode.js");
const cryptojs = require("./cryptojs");
const crypto = require('crypto');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const { verify } = require('./cryptojs.js');


// get config vars
dotenv.config();

let db

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(cors());


app.set('port', process.env.PORT || 4000);


/**
 * Start Express server.
 */
 app.listen(app.get('port'), () => {
    console.log('App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
    console.log('Press CTRL-C to stop\n');
  });

  
  app.post("/api/VC/Issue/Reject/:VC", AuthMiddleWare.authenticateToken, AuthMiddleWare.minimumPermissionLevelRequired(1), async (req, res, next) => {
    let VC;
    try
    {
      VC = await VCRequestModel.findById(req.params.VC)
    }
    catch (err) {
      console.log(err);
      return res.status(500).send();
    }

    if(VC == null)
    {
      res.status(404).json("Request not found.")
      return;
    }
    if(VC.request.type != "issue")
    {
      res.status(403).json("Request must be of type issue")
      return;
    }

    var d1 = new Date();
    let change = {"request.status": -1, "request.resolvedDate": d1.toISOString()};
    VCRequestModel.patchVC(req.params.VC, change)
    res.json({
      "message":"success",
      "data":VC.request
    })
  });




  app.post("/api/VC/Issue/Approve/:VC", AuthMiddleWare.authenticateToken, AuthMiddleWare.minimumPermissionLevelRequired(1), async (req, res, next) => {
    let VC;
    let user;
    try
    {
      VC = await VCRequestModel.findById(req.params.VC)
    }
    catch (err) {
      console.log(err);
      return res.status(500).send();
    }

    if(VC==null)
    {
      res.status(404).json("VC not found.");
      return;
    }
    if(VC.request.type != "issue")
    {
      res.status(403).json("Request must be of type issue")
      return;
    }


    var d1 = new Date();
    let toSign = {credentialSubject: VC.credentialSubject};
    let signature = cryptojs.sign(JSON.stringify(toSign));
    let proof = {"type": "RsaSignature2018", "created": d1.toISOString(), "proofPurpose": "assertionMethod", "jws": signature};

    let change = {"request.status": 1, "request.resolvedDate": d1.toISOString(), "proof": proof};
    VCRequestModel.patchVC(req.params.VC, change)
    res.json({
      "message":"success",
      "data":VC
    })
  });



  app.post("/api/VC/Verify/Approve/:VC", AuthMiddleWare.authenticateToken, AuthMiddleWare.minimumPermissionLevelRequired(1), async (req, res, next) => {
    let VC;
    try
    {
      VC = await VCRequestModel.findById(req.params.VC)
    }
    catch (err) {
      console.log(err);
      return res.status(500).send();
    }

    if(VC == null)
    {
      res.status(404).json("Request not found.")
      return;
    }
    if(VC.request.type != "verify")
    {
      res.status(403).json("Request must be of type issue")
      return;
    }

    var d1 = new Date();
    let change = {"request.status": 1, "request.resolvedDate": d1.toISOString()};
    VCRequestModel.patchVC(req.params.VC, change)
    res.json({
      "message":"success",
      "data":VC.request
    })
  });



  app.post("/api/VC/Verify/Reject/:VC", AuthMiddleWare.authenticateToken, AuthMiddleWare.minimumPermissionLevelRequired(1), async (req, res, next) => {
    let VC;
    try
    {
      VC = await VCRequestModel.findById(req.params.VC)
    }
    catch (err) {
      console.log(err);
      return res.status(500).send();
    }

    if(VC == null)
    {
      res.status(404).json("Request not found.")
      return;
    }
    if(VC.request.type != "verify")
    {
      res.status(403).json("Request must be of type verify")
      return;
    }

    var d1 = new Date();
    let change = {"request.status": -1, "request.resolvedDate": d1.toISOString()};
    VCRequestModel.patchVC(req.params.VC, change)
    res.json({
      "message":"success",
      "data":VC.request
    })
  });



  app.post("/api/VC/Verify/Validate/:VC", async (req, res, next) => {
    let VC;
    try
    {
      VC = await VCRequestModel.findById(req.params.VC)
    }
    catch (err) {
      console.log(err);
      return res.status(500).send();
    }

    if(VC == null)
    {
      res.status(404).json("Request not found.")
      return;
    }

    //const key = await chaincode.getKeyFromDID("test");
    /*
    if(VC.request.type != "verify")
    {
      res.status(403).json("Request must be of type verify")
      return;
    }*/
    const public_key = fs.readFileSync('blank.pub', 'utf-8');
    let toVerify = {credentialSubject: VC.credentialSubject};
    let toVerifyString = JSON.stringify(toVerify);
    let result = cryptojs.verify(toVerifyString, VC.proof.jws, public_key)

    res.json({
      "message":"success",
      "data":result
    })

  });



  


  app.get('/api/getRequests',  AuthMiddleWare.authenticateToken, AuthMiddleWare.minimumPermissionLevelRequired(1), async (req, res) => {
    try
    {
      let requests;
      console.log(req.body.params)
      requests = await VCRequestModel.customFind(req.body.params)
  
      if(requests.length == 0)
      {
        res.status(404).json("No Request Records Found.")
      }

      res.json({
        "message":"success",
        "data":requests
      })
    }
    catch(err)
    {
      console.log(err);
    }
  })

  app.post('/api/createUser', [AuthorizationController.createUser]);

  app.post('/api/login', [AuthorizationController.login]);


  app.post('/api/requestVC', AuthMiddleWare.authenticateToken, async (req, res) => {
    
    let userstring = req.jwt.username
    
    let context = JSON.parse(`[
      "https://www.w3.org/2018/credentials/v1",
      "https://www.w3.org/2018/credentials/examples/v1"
    ]`);
    try
    {
      var d1 = new Date();
      var request = { status: 0, createdDate: d1.toISOString(), type: "issue"};
      var VC = { context: context, credentialSubject: req.body.credentialSubject, username: userstring, request: request};

        await VCRequestModel.createVC(VC)
        .then(async (result) => {
            console.log("here");
            res.status(200).json("Request Made"); 
        });
          
    }
    catch(err)
    {
      console.log(err);
      res.status(500).json("Server Error")
    }
  })

  app.post('/api/uploadVC', AuthMiddleWare.authenticateToken, async (req, res) => {
    
    let userstring = req.jwt.username

    if(!req.body.VC.context || !req.body.VC.credentialSubject || !req.body.VC.proof)
    {
      res.status(403).json("Request Failed: Not all required fields provided"); 
    }

    var d1 = new Date();
    var request = { status: 0, createdDate: d1.toISOString(), type: "verify"};
    var VC = { context: req.body.VC.context, credentialSubject: req.body.VC.credentialSubject, proof: req.body.VC.proof, username: userstring, request: request};

    await VCRequestModel.createVC(VC)
        .then(async (result) => {
            console.log("here");
            res.status(200).json("Request Made"); 
        });
  })

  app.get("/api/Request/:VC", AuthMiddleWare.authenticateToken, async (req, res, next) => {
      let request;
      let user;
      try
      {
        request = await VCRequestModel.findRequestById(req.params.VC)
        user = await UserModel.findByUsername(req.jwt.username);
      }
      catch (err) {
        console.log(err);
        return res.status(500).send();
      }

      if(request!= null)
      {
        if(user.username!=request.username && user.permissionLevel==0)
        {
          res.status(403).json("You don't have permission to access this resource.");
          return;
        }
        res.json({
          "message":"success",
          "data":request
        })
        return;
      }

      res.status(404).json("Request not found.")
  });


  app.get("/api/VC/:VC", AuthMiddleWare.authenticateToken, async (req, res, next) => {
    let VC;
    let user;
    try
    {
      VC = await VCRequestModel.findById(req.params.VC)
      user = await UserModel.findByUsername(req.jwt.username);
    }
    catch (err) {
      console.log('Mongo error', err);
      return res.status(500).send();
    }


    if(VC!=null)
    {
      if(user.username!=VC.username && user.permissionLevel==0)
      {
        res.status(403).json("You don't have permission to access this resource.");
        return;
      }
      res.json({
        "message":"success",
        "data":VC
      })
      return;
    }

    res.status(404).json("VC not found.")
});


  app.get("/api/VCs", AuthMiddleWare.authenticateToken, async (req, res, next) => {
    let VCs;
    try
    {
       VCs = await VCRequestModel.findByUsername(req.jwt.username)
  
      if(VCs.length == 0)
      {
        res.status(404).json("No Request Records Found.")
      }

      res.json({
        "message":"success",
        "data":VCs
      })
    }
    catch(err)
    {
      console.log(err);
    }

   
  });


  app.get("/api/Requests", AuthMiddleWare.authenticateToken, async (req, res, next) => {
    let requests;
    try
    {
       requests = await VCRequestModel.findRequestsByUsername(req.jwt.username)
  
      if(requests.length == 0)
      {
        res.status(404).json("No Request Records Found.")
      }

      res.json({
        "message":"success",
        "data":requests
      })
    }
    catch(err)
    {
      console.log(err);
    }

   
  });

  



  