
var flash = function(req, res, next) {
  var session = req.session;
  var messages = session.messages || (session.messages = {});

  req.flash = function(type, message, timeout) {
    (messages[type] || (messages[type] = [])).push([message, timeout]);
  };

  res.locals.messages = function(type) {
    if (!type) {
      return messages;
    }
    return (messages[type] || (messages[type] = []));
  };

  res.locals.messages.types = function() {
    return Object.keys(messages);
  };

  res.locals.messages.is_empty = function() {
    for (var type in messages) {
      if (messages[type].length > 0) {
        return false;
      }
    }
    return true;
  };

  next();
};

module.exports = {
  middleware: function() {
    return flash;
  }
};