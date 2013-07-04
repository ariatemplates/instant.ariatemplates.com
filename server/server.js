var express   = require('express'),
    http      = require('http'),
    path      = require('path'),
    less      = require('less-middleware'),
    everyauth = require('everyauth'),
    async     = require('async'),
    crypto    = require('crypto');

var config  = require('./config.json'),
    locals  = require('./locals'),
    flash   = require('./middlewares/flash'),
    Gistme  = require('./gistme'),
    Errors  = require('./errors');

/* PATHS */
var __public = path.join(__dirname, '..', 'public'),
    __stylesheets = path.join(__dirname, 'stylesheets'),
    __views = path.join(__dirname, 'views');


/* OAUTH CONFIG */
var usersById = [];

everyauth.everymodule.findUserById( function (req, userId, callback) {
  return callback(null, usersById[userId]);
});

everyauth.everymodule.handleLogout( function(req, res) {
  req.logout(); //Added by everyauth
  req.session.destroy();
  everyauth.everymodule.redirect(res, everyauth.everymodule.logoutRedirectPath());
});

everyauth.github
  .entryPath('/login')
  .appId(config.github.client_id)
  .appSecret(config.github.client_secret)
  .callbackPath('/auth/callback')
  .scope('gist')
  .findOrCreateUser( function (session, accessToken, accessTokenExtra, githubUserMetadata) {
    if (!session.starred) {
      session.starred = [];
    }
    return usersById[githubUserMetadata.id] || (usersById[githubUserMetadata.id] = {
      'id': githubUserMetadata.id,
      'accessToken': accessToken,
      'accessTokenExtra': accessTokenExtra,
      'name': githubUserMetadata.name,
      'login': githubUserMetadata.login,
      'avatar': githubUserMetadata.avatar_url
    });
  })
  .redirectPath('/');

var app = express();
var server = http.createServer(app);

app.configure(function() {
  app.set('views', __views);
  app.set('view engine', 'jade');
  app.enable('trust proxy');
});

app.configure('development', function() {
  app.use(less({
    src: __stylesheets,
    dest: path.join(__public, 'css'),
    prefix: "/css"
  }));
});

app.use(express.static(__public))
  .use(express.favicon())
  .use(express.bodyParser())
  .use(express.methodOverride())
  .use(express.cookieParser())
  .use(express.session({
    key: 'instant.sid',
    secret: 'instantat4thewinoftemplate',
    cookie: { maxAge: (7 * 24 * 60 * 60 * 1000) }
  }))
  .use(everyauth.middleware())
  .use(flash.middleware());

locals.init(app);

app.use(app.router);

/* Error Middlewares */
app.use(function(err, req, res, next) {
  if (err.stack) {
    console.error(err.stack);
  }
  next(err);
});

app.use(function(err, req, res, next) {
  if (req.xhr) {
    if (err instanceof Errors.UserNotFound) {
      return res.send(404, "Sorry we don't know any " + err.message);
    }
    if (err instanceof Errors.InstantNotFound) {
      return res.send(404, "Sorry the instant you are looking for does not exist");
    }
    return res.send(500, "o_O Something apparently just broke !");
  }
  next(err);
});

app.use(function(err, req, res, next) {
  if (err instanceof Errors.UserNotFound) {
    res.status(404);
    return res.render("unknown", {
      message: "Sorry,<br />We don't know any <span class='highlight'>"+err.message+"</span> !"
    });
  }
  if (err instanceof Errors.InstantNotFound) {
    res.status(404);
    return res.render("unknown", {
      message: "Sorry,<br />The instant you are looking for <span class='highlight'>does not exist</span> !"
    });
  }

  res.status(500);
  return res.render('500', {
    message: "o_O Something apparently just broke !"
  });
});

/* USER CHECK MIDDLEWARE */
var userMustBeLoggedIn = function(req, res, next) {
  if (req.loggedIn) {
    return next();
  }
  req.flash("error", "You must be logged in to perform this action");
  return res.redirect("/");
};


var gistme;
var getGistme = function(req, res, next) {
  if (!gistme) {
    gistme = new Gistme({
      'verbose': ('development' == app.get('env')),
      'client_id': config.github.client_id,
      'client_secret': config.github.client_secret,
      'cache': {
        'size': 1000,
        'debug': false
      }
    });
  }
  if (req.user) {
    gistme.setToken(req.user.accessToken);
  } else {
    gistme.activateAnonymous(true);
  }
  req.gistme = gistme;
  return next();
};

var validateInstantGist = function (gist) {
  return gist.files && 'instant.json' in gist.files && gist['public'] === true;
};

var extractNamesDescription = function(gists) {
  var i, l = gists.length, gist, meta;
  for(i = 0; i < l; i++) {
    gist = gists[i], meta = gist.description.split(/\n{2}|(?:\r\n){2}/ig);
    gist.instant_name = meta.shift();
    gist.instant_description = meta.join("\n\n") || "No description";
  }
  return gists;
};

var processGistsList = function(callback) {
  return function(error, gists) {
    var id, i, l, gist, meta;
    if (error) {
      return callback(null, []);
    }

    gists = gists.filter(validateInstantGist);

    if (gists.length === 0) {
      return callback(null, false);
    }

    return callback(null, extractNamesDescription(gists));
  };
};

var getInstantGists = function(gistme, username, callback) {
  if (username) {
    gistme.all(username, processGistsList(callback));
  } else {
    gistme.all(processGistsList(callback));
  }
};

var getInstantStarredGists = function(gistme, callback) {
  gistme.starred(processGistsList(callback));
};

var createInitialComment = function(gistme, gist) {
    initial_comment = "Created by Instant Aria Templates, viewable on http://instant.ariatemplates.com/" + gist.user.login + "/" + gist.id;
    gistme.comment_create(gist.id, initial_comment, function(error, comment) {
      if (error) {
        console.error("Error while creating the initial comment for gist#"+gist.id, JSON.stringify(error));
      }
    });
};


/* EXPRESS ROUTES */
var file_404 = function(req, res) {
  res.status(404);
  res.send();
};

app.get("/InstantTemplate.tpl", file_404);
app.get("/InstantTemplateScript.js", file_404);
app.get("/InstantTemplateStyle.tpl.css", file_404);

app.get("/", function(req, res) {
  if (req.loggedIn) {
    res.redirect("/"+req.user.login);
  } else {
    res.render("home");
  }
});

app.get(/(terms|about)/, function(req, res) {
  res.render(req.params[0]);
});

app.get("/anonymous/new", function(req, res) {
  req.flash("info", [
    "<strong>Are you a Github user ?</strong> If yes you should consider using your Github account to login.",
    "You could benefit from favorites, forking, comments, sharing and many more features..."
  ].join(""));
  res.render("new_instant");
});

app.post("/anonymous/new", getGistme, function(req, res) {
  var gistme = req.gistme,
      name = (req.param('name') || "New Instant"),
      description = (req.param('description') || ""), metadata, data, admin_hash;

  gistme.setToken(config.github.anonymous_token);

  admin_hash = crypto.createHash('md5').update(Date.now().toString()).digest("hex").substr(0, 6);

  metadata = {
    'name': name,
    'description': description,
    'admin_hash': admin_hash,
    'anonymous': true,
    'data': {
    }
  };
  data = {
    'description': name + '\n\n' + description,
    'public': false,
    files: {
      "instant.json": { 'content': JSON.stringify(metadata,null, 2)+"\n" },
      "Template.tpl": { 'content': app.locals.get_default_content("TPL") },
      "TemplateScript.js": { 'content': app.locals.get_default_content("SCRIPT") },
      "TemplateStyle.tpl.css": { 'content': app.locals.get_default_content("STYLE") }
    }
  };

  // Creating the new gist
  gistme.create(data, function(error, gist) {
    if (error) {
      req.flash("error", "Something bad happened while creating your anonymous instant...");
      return res.render("new_instant", {
        'name': name,
        'description': description
      });
    }
    req.session.new_anonymous = gist.id;
    res.redirect("/anonymous/" + gist.id + "/" + admin_hash);
  });

});

app.get("/new", userMustBeLoggedIn, function(req, res) {
  res.render("new_instant");
});

app.post("/new", userMustBeLoggedIn, getGistme, function(req, res) {
  var gistme = req.gistme,
      name = (req.param('name') || "New Instant"),
      description = (req.param('description') || ""), metadata, data, initial_comment;

  metadata = {
    'name': name,
    'description': description,
    'data': {
    }
  };

  data = {
    'description': name + '\n\n' + description,
    files: {
      "instant.json": { 'content': JSON.stringify(metadata,null, 2)+"\n" },
      "InstantTemplate.tpl": { 'content': app.locals.get_default_content("TPL") },
      "InstantTemplateScript.js": { 'content': app.locals.get_default_content("SCRIPT") },
      "InstantTemplateStyle.tpl.css": { 'content': app.locals.get_default_content("STYLE") }
    }
  };

  // Creating the new gist
  gistme.create(data, function(error, gist) {
    if (error) {
      console.error(error);
      req.flash("error", "Something bad happened while creating your new instant...");
      return res.render("new_instant", {
        'name': name,
        'description': description
      });
    }
    // Creating the initial comment via a delay
    // To prevent being considered as a spammy bot by Github Hubot
    setTimeout(function() {
      createInitialComment(gistme, gist);
    }, 750);

    res.redirect("/" + gist.user.login + "/" + gist.id);
  });
});


app.get("/:username", getGistme, function(req, res, next) {
  var gistme = req.gistme, username = req.param('username');
  if (req.loggedIn && req.user.login === username) {
    async.parallel([ function(callback) {
      getInstantGists(gistme, null, callback);
    }, function(callback) {
      getInstantStarredGists(gistme, callback);
    }], function(error, results) {
      var instants = results[0],
          starred = results[1];

      if (starred) {
        req.session.starred = starred.map(function(gist) { return gist.id; });
      }

      return res.render("list", {
        'user_info': false,
        'public_gists': instants,
        'starred_gists': starred
      });
    });
  } else {
    async.series([function(callback) {
      gistme.user_info(username, callback);
    }, function(callback) {
      getInstantGists(gistme, username, callback);
    }], function(error, results) {
      if (error) {
        if (error.message === "Not Found") {
          return next(new Errors.UserNotFound(username));
        }
      }

      return res.render("list", {
        'user_info': results[0],
        'public_gists': results[1],
        'starred_gists': false
      });
    });
  }
});

app.get("/anonymous/:instant_id", getGistme, function(req, res, next) {
  var gistme = req.gistme, instant_id = req.param('instant_id');

  gistme.setToken(config.github.anonymous_token);
  gistme.fetch(instant_id, function(error, gist) {
    if (error) {
      if (error.message == "Not Found") {
        return next(new Errors.InstantNotFound(instant_id));
      }
      return next(new Error());
    }
    res.render("anonymous_instant", {
      'admin': false,
      'gist': gist
    });
  });
});

app.get("/anonymous/:instant_id/:admin_hash", getGistme, function(req, res, next) {
  var gistme = req.gistme,
      instant_id = req.param('instant_id'),
      admin_hash = req.param('admin_hash'),
      fetch_admin_hash,
      new_anonymous = req.session.new_anonymous,
      metadata;

  gistme.setToken(config.github.anonymous_token);
  gistme.fetch(instant_id, function(error, gist) {
    if (error) {
      if (error.message === "Not Found") {
        return next(new Errors.InstantNotFound(instant_id));
      }
      return next(new Error());
    }
    metadata = JSON.parse(gist.files['instant.json'].content);
    fetch_admin_hash = metadata.admin_hash;
    if (fetch_admin_hash !== admin_hash) {
      req.flash("error", "<strong>Wrong credentials</strong> You can not open this anonymous gist in update mode.");
      return res.redirect("/anonymous/"+gist.id);
    }

    gist.name = metadata.name;
    gist.admin_hash = fetch_admin_hash;

    if(new_anonymous) {
      delete req.session.new_anonymous;
    }

    res.render("anonymous_instant", {
      'admin': true,
      'gist': gist,
      'new_instant': new_anonymous
    });
  });
});

app.get("/:username/:instant_id", getGistme, function(req, res, next) {
  var gistme = req.gistme, username = req.param('username'), instant_id = req.param('instant_id');
  gistme.fetch(instant_id, function(error, gist) {
    if (error) {
      if (error.message === "Not Found") {
        return next(new Errors.InstantNotFound(instant_id));
      }
      return next(new Error());
    }
    res.render("instant", {
      'gist': gist
    });
  });
});

app.post("/:username/:instant_id", userMustBeLoggedIn, getGistme, function(req, res, next) {
  var tpl    = req.body.tpl,
      script = req.body.script,
      style  = req.body.style,
      data   = req.body.data,
      metadata, instant_id = req.param('instant_id'), instant_json;

  gistme.fetch(instant_id, function(error, gist) {
    instant_json = JSON.parse(gist.files["instant.json"].content);
    instant_json.data = JSON.parse(data);
    metadata = {
      files: {
        "instant.json": { 'content': JSON.stringify(instant_json, null, 2)+"\n" },
        "InstantTemplate.tpl": { 'content': tpl },
        "InstantTemplateScript.js": { 'content': script },
        "InstantTemplateStyle.tpl.css": { 'content': style }
      }
    };

    gistme.update(instant_id, metadata, function(error, new_gist) {
      if (error) {
        return next(new Error(error.message));
      }
      res.json({'ok': true});
    });
  });
});

app['delete']("/anonymous/:instant_id/:admin_hash", getGistme, function(req, res, next) {
  var gistme = req.gistme,
      instant_id = req.param('instant_id'),
      admin_hash = req.param('admin_hash');

  gistme.setToken(config.github.anonymous_token);
  gistme.fetch(instant_id, function(error, gist) {
    if (error) {
      if (error.message === "Not Found") {
        return next(new Errors.InstantNotFound(instant_id));
      }
      return next(new Error());
    }
    metadata = JSON.parse(gist.files['instant.json'].content);
    fetch_admin_hash = metadata.admin_hash;
    if (fetch_admin_hash !== admin_hash) {
      res.status(401);
      req.flash("error", "<strong>Wrong credentials</strong> You are not allowed to delete this instant");
      return res.redirect("/");
    }

    gistme['delete'](instant_id, function(error, deleted) {
      if (!deleted || error) {
        req.flash('error', 'We apparently did not manage to delete your instant!');
        return res.redirect(req.get("referer"));
      }
      req.flash('info', 'Instant successfully deleted !');
      res.redirect("/");
    });
  });
});

app['delete']("/:username/:instant_id", userMustBeLoggedIn, getGistme, function(req, res) {
  var gistme = req.gistme , username = req.param('username'), instant_id = req.param('instant_id'),
      loggedUserLogin = req.user.login;

  gistme.fetch(instant_id, function(error, gist) {
    if (gist.user.login !== username) {
      return res.json({
        "error": "Whoops... Seems you are trying to do o_O stuff! <strong>You should not!</strong>"
      });
    }

    if (gist.user.login !== loggedUserLogin) {
      return res.json({
        "error": "The instant #" + instant_id + " is not one of yours. You can't delete it !"
      });
    }

    gistme['delete'](instant_id, function(error, deleted) {
      if (!deleted) {
        return res.json({
          "error": "We apparently did not manage to delete the instant #"+instant_id
        });
      }
      return res.json({ "ok": true });
    });
  });
});

app.get("/:username/:instant_id/star", userMustBeLoggedIn, getGistme, function(req, res) {
  var gistme = req.gistme , username = req.param('username'), instant_id = req.param('instant_id');
  gistme.star(instant_id, function(error, starred) {
    if (starred) {
      req.session.starred.push(instant_id);
      if (req.xhr) {
        return res.json({ "ok": true });
      } else {
        req.flash('info', '<strong>Instant #' + instant_id + '</strong> has been added to your starred instants!');
        res.redirect(req.get("referer"));
      }
    } else {
      if (req.xhr) {
        return res.json({
          "error": {
            "message": 'We did not manage to star your instant. Please retry in few seconds.'
          }
        });
      } else {
        req.flash('error', 'We did not manage to star your instant. Please retry in few seconds.');
        res.redirect(req.get("referer"));
      }
    }
  });
});

app.get("/:username/:instant_id/unstar", userMustBeLoggedIn, getGistme, function(req, res) {
  var gistme = req.gistme , username = req.param('username'), instant_id = req.param('instant_id');
  gistme.unstar(instant_id, function(error, unstarred) {
    if (unstarred) {
      req.session.starred.splice(req.session.starred.indexOf(instant_id),1);
      if (req.xhr) {
        return res.json({ "ok": true });
      } else {
        req.flash('info', '<strong>Instant #' + instant_id + '</strong> has been removed from your starred instants!');
        res.redirect(req.get("referer"));
      }
    } else {
      if (req.xhr) {
        return res.json({
          "error": {
            "message": 'We did not manage to unstar your instant. Please retry in few seconds.'
          }
        });
      } else {
        req.flash('error', 'We did not manage to unstar your instant. Please retry in few seconds.');
        res.redirect(req.get("referer"));
      }
    }
  });
});


server.listen(config.port);
