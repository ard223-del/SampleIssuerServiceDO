const UserModel = require("./userSchema.js")
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

  
dotenv.config();
  
  
  exports.generateAccessToken = (username) => {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
  }

  exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
  
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
      //console.log(err);
  
      if (err) return res.sendStatus(403)
  
      req.jwt = user
  
      next()
    })
  }

  exports.minimumPermissionLevelRequired = (required_permission_level) => {
    return async (req, res, next) => {
        let user = await UserModel.findByUsername(req.jwt.username)
        req.user = user
        let user_permission_level = parseInt(user.permissionLevel);

        if (user_permission_level >= required_permission_level) {
            return next();
        } else {
            return res.status(403).json("You do not have permission");
        }
    };
  };