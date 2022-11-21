const UserModel = require("./userSchema.js")
const crypto = require('crypto');
const AuthMiddleWare = require("./authMiddleware.js")





exports.createUser = async (req, res) => {
  if(!req.body.username || req.body.username.length == 0)
  {
    res.status(401).json("Must Provide Username");
    return;
  }

  let potentialUser;
  
  try
  {
    potentialUser = await UserModel.findByUsername(req.body.username)
  }
  catch (err) {
    console.log(err)
    return res.status(500).send();
  }


  try
  {
    if (potentialUser != null) {
      res.status(401).json("Username already exists");
      return;
    }

    if(!req.body.password || req.body.password.length == 0)
    {
      res.status(401).json("Must Provide Password");
      return;
    }


    var passwordHash = "";
    var email = "";
    var salt = "";

    if(req.body.email)
    {
      email = req.body.email;
    }

    salt = crypto.randomBytes(16).toString("hex");
    
    passwordHash = crypto.pbkdf2Sync(req.body.password, salt,  
      1000, 64, `sha512`).toString(`hex`)

    let permission = 0;

    var user = { username: req.body.username, password: passwordHash, email: email, salt: salt, permissionLevel: permission};
    UserModel.createUser(user)
      .then((result) => {
          const token = generateAccessToken({ username: req.body.username });
          res.status(200).json(token);
          res.status(201).send({id: result._id});
      });
  }
  catch(err)
  {
    console.log(err)
    res.status(500).json("Server Error")
  }
}

exports.login = async (req, res) => {
    if(!req.body.username || req.body.username.length == 0)
    {
      res.status(401).json("Must Provide Username");
      return;
    }

    let user;
    
    try
    {
      user = await UserModel.findByUsername(req.body.username)
    }
    catch (err) {
      console.log(err)
      return res.status(500).send();
    }

    try
    {
      if (user == null) {
        res.status(404).json("User " + req.body.username + " does not exist");
        return;
      }
  
      if(!req.body.password || req.body.password.length == 0)
      {
        res.status(401).json("Must Provide Password");
        return;
      }
  
      var userPass = user.password;
      var salt = user.salt;
      
      passwordHash = crypto.pbkdf2Sync(req.body.password, salt,  
        1000, 64, `sha512`).toString(`hex`); 
  
      if(passwordHash == userPass)
      {
        const token = AuthMiddleWare.generateAccessToken({ username: req.body.username });
        res.status(200).json(token);
      }
      else
      {
        res.status(401).json("Login Details Not Correct");
      }
    }
    catch(err)
    {
      console.log(err);
      res.status(500).json("Server Error")
    }
    
}