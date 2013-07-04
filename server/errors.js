var util = require('util')

var NotFoundError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'NotFoundError';
};
util.inherits(NotFoundError, Error);
NotFoundError.prototype.name = 'NotFoundError';

var UserNotFoundError = function (msg) {
  UserNotFoundError.super_.call(this, msg, this.constructor);
};
util.inherits(UserNotFoundError, NotFoundError);
UserNotFoundError.prototype.name = 'UserNotFoundError';

var InstantNotFoundError = function (msg) {
  InstantNotFoundError.super_.call(this, msg, this.constructor);
};
util.inherits(InstantNotFoundError, NotFoundError);
InstantNotFoundError.prototype.name = 'InstantNotFoundError';


var NotAllowedError = function(msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'NotAllowedError';
};
util.inherits(NotAllowedError, Error);
NotAllowedError.prototype.name = 'NotAllowedError';


module.exports = {
  NotFound: NotFoundError,
  UserNotFound: UserNotFoundError,
  InstantNotFound: InstantNotFoundError,
  NotAllowed: NotAllowedError
};