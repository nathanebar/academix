// const {User} = require('../../models');
const { Axis, Team, Course, User } = require('../../models');
const { createJWT } = require('./jwt');

exports.identifyUsername = async (userName) => {
  try {
    /* const user = await User.findOne({
        email: userName.toLowerCase() + '',
      }).select('-createdAt -updatedAt -__v -email -devices'); */
    
    const user = await User.findOne({ 
      where: { username: userName },
      attributes: ['id', 'name', 'militaryid', 'username'] 
    });
    
    if (user) {
      const token = createJWT(user._previousDataValues);
      return { user: user._previousDataValues, token };
    } else {
      return { user: null, token: null };
    }
  } catch (error) {
    console.error('User Not Found Must be regular token', error);
  }
};