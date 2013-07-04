var moment = require('moment'),
    path   = require('path');

var date_patterns = {
  'short': "MM/DD",
  'medium': "MM/DD/YYYY",
  'long': "dddd, MM/DD/YYYY",
  'full': "dddd, MMMM Do YYYY, h:mm:ss a"
};

var defaut_content = {
  TPL: "{macro main()}\n    <h1>Hello Instant Aria Templates</h1>\n{/macro}\n",
  SCRIPT: "({\n    $classpath:'InstantTemplateScript',\n    $prototype : {\n      myMethod: function() {\n      }\n    }\n})\n",
  STYLE: "{macro main()}\n{/macro}\n",
  DATA: "{\n}"
};

var static_helpers = {


  template_name: function(filename) {
    var name = path.basename(filename, ".jade");
    //small-hack
    if (~name.indexOf("anonymous")) {
      name = name.replace("anonymous_", "");
    }
    return name;
  },

  date_patterns: date_patterns,
  date: function(str_date, pattern) {
    return pattern ? moment(str_date).format(pattern) : moment(str_date).format();
  },

  linkify: function (text){
    if (text) {
        text = text.replace(
            /((https?\:\/\/)|(www\.))(\S+)(\w{2,4})(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi,
            function(url){
                var full_url = url;
                if (!full_url.match('^https?:\/\/')) {
                    full_url = 'http://' + full_url;
                }
                return '<a href="' + full_url + '" target="_blank">' + url + '</a>';
            }
        );
        text = text.replace(/\r\n|\n|\r/ig, "<br />");
    }
    return text;
  },

  get_default_content: function(type) {
    return defaut_content[type.toUpperCase()];
  }
};

var dynamic_helpers = {
  is_starred: function(req, res, next) {
    res.locals.is_starred = function(gist_id) {
      return (req.session.starred && ~req.session.starred.indexOf(gist_id));
    };
    next();
  }
};

module.exports = {
  'init': function(app) {
    // Initialisation of `static` helpers, directly attached to app.locals
    for(var key in static_helpers) {
      app.locals[key] = static_helpers[key];
    }

    // Initialisation of `dynamic` helpers, injected using app.use() and middlewares syntax
    for(key in dynamic_helpers) {
      app.use(dynamic_helpers[key]);
    }
  }
};