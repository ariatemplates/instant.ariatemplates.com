var qs      = require('querystring'),
    request = require('request');

var Cache   = require('./cache'),
    version = require('../package.json').version;


var api                = 'https://api.github.com',
    DEFAULT_CACHE_SIZE = 2000;

var get_cache_key = function(self, scheme) {
  if (self.options.token) {
    if (~["/gists", "/gists/starred"].indexOf(scheme)) {
      return self.options.token + ":" + scheme;
    }
  }
  return scheme;
};

var process = function(self, scheme, opts, fn) {
  var options, type, cached, last_modified, _;

  if (typeof opts === "function") {
    fn = opts;
    opts = {};
  } else {
    if (fn === null) {
      throw new Error('[Gistme Error] Specifying a callback to Gistme API calls is mandatory');
    }
  }

  options = {
    json: true, //automatically parse the body response
    url: api + scheme,
    method: "GET",
    headers: {
      "User-Agent": "IntantAT/" + version + " (http://instant.ariatemplates.com/)"
    }
  };

  // Custom Headers
  if (opts.headers) {
    for (_ in opts.headers) {
      options.headers[_] = opts.headers[_];
    }
    delete opts.headers;
  }


  // Oauth for the request, by default we are anonymous (60 requests/hour/ip)
  type = "anonym ";
  if (!self.anonymous) {
    if (self.options.token) {
      // We are not anonymous and we have an oauth token
      type = self.options.token.substr(0, 7);
      options.headers["Authorization"] = "token " + self.options.token;
    } else if (self.options.client_id) {
      // We are not anonymous and we have an oauth client_id/client_secret
      type = "client ";
      options.url += "?" + qs.stringify({'client_id': self.options.client_id, 'client_secret': self.options.client_secret});
    }
  } else {
    if (self.options.client_id) {
      // We are anonymous but we have an oauth client_id/client_secret
      type = "client ";
      options.url += "?" + qs.stringify({'client_id': self.options.client_id, 'client_secret': self.options.client_secret});
    }
  }

  if (self.options.verbose) {
    console.log("[Gistme]",type,"\t", "scheme:", scheme);
  }

  // Overlaying the options
  for(_ in opts) {
    options[_] = opts[_];
  }

  // Let's lookup the cache for the Last-Modified header
  cached = self.cache.get(get_cache_key(self, scheme));
  if (cached) {
    if (self.options.verbose) {
      console.log("[Gistme]", type, "\t", "scheme:", options.method, scheme, "\t", "already in cache,", "last-modified:", cached.last_modified);
      console.log("[Gistme]", type, "\t", "scheme:", options.method, scheme, "\t", "using etag:", cached.etag);
    }
    options.headers["If-None-Match"] = cached.etag;
    options.headers["If-Modified-Since"] = cached.last_modified;
  }

  request(options, function(error, response, body) {
    var rate_limit, status_code = response.statusCode;

    if (self.options.verbose) {
      console.log("[Gistme]", type, "\t", "scheme:", options.method, scheme, "\t", "status code:", status_code);
      console.log("[Gistme]", type, "\t", "scheme:", options.method, scheme, "\t", "rate:", response.headers['x-ratelimit-remaining'], "/", response.headers['x-ratelimit-limit']);
    }

    if (status_code !== 200 && status_code !== 201 && status_code !== 204 && status_code !== 304) {
      error = body;
    }

    // We update the cache
    if (status_code === 200 || status_code === 201) {
      if (self.options.verbose) {
        console.log("[Gistme]", type, "\t", "scheme:", options.method, scheme, "\t", "adding to cache, etag:", response.headers["etag"]);
      }
      self.cache.put(get_cache_key(self, scheme), {
        'etag': response.headers["etag"],
        'last_modified': response.headers["last-modified"],
        'body': body
      });
    }

    // Resource did not changed since last-modified, grab cached value
    if (status_code === 304) {
      //cached = self.cache.get(get_cache_key(self, scheme));
      body = cached.body;
    }


    rate_limit = parseInt(response.headers['x-ratelimit-remaining'], 10) <= 0;
    if (!error && rate_limit) {
      console.error("[Gistme]", type, "\t", "rate:", "remaining rate limit is < 10");
      error = {
        message: 'You exceeded your rate limit'
      };
    }

    return fn.call(self, error, response, body);
  });
};

var assertNotNull = function(_, msg) {
  if (_ === null) {
    throw new Error("[Gistme Error] " + msg);
  }
};

var assertNotEmpty = function(_, msg) {
  if (_ === "") {
    throw new Error("[Gistme Error] " + msg);
  }
};

var wrapFn = function(fn) {
  return function(error, response, body) {
    fn(error, body);
  };
};


var Gistme = module.exports = function Gistme(options) {
  this.options = options || {};
  this.options.verbose = (options && options.verbose) || false;
  this.anonymous =  (options && options.anonymous) || false;

  this.cache = new Cache({
    'size': (options && options.cache && options.cache.size) || DEFAULT_CACHE_SIZE,
    'debug': (options && options.cache && options.cache.debug) || false
  });


  if (options && options.client_id) {
    // Specify an application oauth client_id and client_secret to be used for each call
    assertNotNull(options.client_id, "The specified application oauth client_id is null");
    assertNotNull(options.client_secret, "The specified application oauth client_secret is null");
    this.options.client_id = options.client_id;
    this.options.client_secret = options.client_secret;
  }

  /**
   * Activate anonymous mode for all request
   */
  this.activateAnonymous = function(mode) {
    this.anonymous = mode || false;
  };

  /**
   * Specify an oauth token to be used for each call
   */
  this.setToken = function(token) {
    assertNotNull(token, "You must specify an user oauth token");
    this.options.token = token;
    this.anonymous = false;
  };
};


Gistme.prototype = {
  /**
   *  Retrieve user information
   */
  'user_info': function(username, fn) {
    var scheme;
    // Get info for a specific user
    if (typeof username === "string") {
      scheme = '/users/' + username;
      return process(this, scheme, wrapFn(fn));
    }
    fn = username;
    scheme = '/user';
    return process(this, scheme, wrapFn(fn));
  },

  /**
   * Get a single gist.
   * All information, included files content is returned by Github API
   */
  'fetch': function(id, fn) {
    var scheme;
    assertNotNull(id, "You must specify a gist id");
    scheme = '/gists/' + id;
    return process(this, scheme, wrapFn(fn));
  },

  /**
   * Create a new gist.
   * The data format is the folowing one
   * {
   *   "name": "a name",
   *   "description": "the description for this gist",
   *   "files": {
   *     "file1.txt": {
   *       "content": "String file contents"
   *     }
   *   }
   * }
   */
  'create': function(data, fn) {
    var options, _, file, scheme = "/gists";

    //assertNotNull(data.name, "You must specify a name");
    assertNotNull(data.description, "You must specify a description");
    assertNotNull(data.files, "You must specify files for the gist");

    options = {
      'description': data.description,
      'public': true,
      'files': {}
    };

    if ('public' in data) {
      options['public'] = data['public'];
    }

    for (_ in data.files) {
      file = data.files[_];

      assertNotNull(file.content, "You must specify a file content");
      assertNotEmpty(file.content, "The file content for '" + _ + "' can not by empty");

      options.files[_] = {
        'content': file.content
      };
    }

    return process(this, scheme, { 'body': JSON.stringify(options), 'method': "POST" }, wrapFn(fn));
  },

  /**
   * Update a new gist
   */
  'update': function(id, data, fn) {
    var scheme, options = { files: {} }, _, file;
    assertNotNull(id, "You must specify a gist id");

    scheme = "/gists/" + id;
    if (data.files !== null) {
      for (_ in data.files) {
        file = data.files[_];
        if (file !== null) {
          assertNotNull(file.content, "You must specify a file content");
          assertNotEmpty(file.content, "The file content for '" + _ + "' can not by empty");

          options.files[_] = {
            'content': file.content
          };

          if (file.filename !== null) {
            assertNotEmpty(file.filename, "The new filename for '" + _ + "' can not by empty");
            options.files[_]['filename'] = file.filename;
          }

        } else {
          options.files[_] = null;
        }
      }
    }

    return process(this, scheme, { 'body': JSON.stringify(options), 'method': "PATCH" }, wrapFn(fn));
  },

  /**
   * List all gists associated to the given user or token associated one
   */
  'all': function(username, fn) {
    var scheme;
    // Get all public gists for a specific user
    if (typeof username === "string") {
      scheme = '/users/' + username + '/gists';
      return process(this, scheme, wrapFn(fn));
    }
    fn = username;
    // Get all public gists for the authenticated user (associated to token)
    scheme = '/gists';
    return process(this, scheme, wrapFn(fn));
  },

  /**
   * List all starred gists
   */
  'starred': function(fn) {
    var scheme;
    assertNotNull(this.options.token, "GET gists/starred endpoint requires authentication");
    scheme = "/gists/starred";
    return process(this, scheme, wrapFn(fn));
  },

  /**
   * List all pulbic gists
   */
  'public': function(fn) {
    return process(this, "/gists/public", wrapFn(fn));
  },

  /**
   * Star a gist
   */
  'star': function(id, fn) {
    assertNotNull(this.options.token, "PUT /gists/:id/star endpoint requires authentication");
    assertNotNull(id, "You must specify a gist id");
    return process(this, "/gists/" + id + "/star", { method: "PUT" }, function(error, response, body) {
      if (!error && response.statusCode === 204) {
        fn(error, true);
      } else {
        fn(error, false);
      }
    });
  },

  /**
   * Check if a gist is starred
   */
  'is_starred': function(id, fn) {
    assertNotNull(id, "You must specify a gist id");
    return process(this, "/gists/" + id + "/star", function(error, response, body) {
      if (!error && response.statusCode === 204) {
        fn(error, true);
      } else {
        fn(error, false);
      }
    });
  },

  /**
   * Unstar a gist
   */
  'unstar': function(id, fn) {
    assertNotNull(this.options.token, "DELETE /gists/:id/star endpoint requires authentication");
    assertNotNull(id, "You must specify a gist id");

    return process(this, "/gists/" + id + "/star", { method: "DELETE" }, function(error, response, body) {
      if (!error && response.statusCode === 204) {
        fn(error, true);
      } else {
        fn(error, false);
      }
    });
  },

  /**
   * Fork a gist
   */
  'fork': function(id, fn) {
    assertNotNull(this.options.token, "POST /gists/:id/forks endpoint requires authentication");
    assertNotNull(id, "You must specify a gist id");
    return process(this, "/gists/" + id + "/forks", { method: "POST" }, wrapFn(fn));
  },

  /**
   * List all the forks information for the given id
   */
  'forks': function(id, fn) {
    assertNotNull(id, "You must specify a gist id");
    return process(this, "/gists/" + id + "/forks", wrapFn(fn));
  },

  /**
   * Delete a gist
   */
  'delete': function(id, fn) {
    assertNotNull(this.options.token, "DELETE /gists/:id endpoint requires authentication");
    assertNotNull(id, "You must specify a gist id");
    return process(this, "/gists/" + id, { method: "DELETE" }, function(error, response, body) {
      if (!error && response.statusCode === 204) {
        fn(error, true);
      } else {
        fn(error, false);
      }
    });
  },

  /**
   * List all comments
   */
  'comments': function(id, fn) {
    assertNotNull(id, "You must specify a gist id");
    return process(this,
      "/gists/" + id + "/comments",
      {
        'headers': { 'Accept': "application/vnd.github.v3.html+json"}
      },
      wrapFn(fn));
  },

  /**
   * Get a single comment
   */
  'comment_fetch': function(gist_id, id, fn) {
    assertNotNull(gist_id, "You must specify a gist id");
    assertNotNull(id, "You must specify a comment id");
    return process(this,
      "/gists/" + gist_id + "/comments/" + id,
      {
        'headers': { 'Accept': "application/vnd.github.v3.html+json"}
      },
      wrapFn(fn));
  },

  /**
   * Create a comment
   */
  'comment_create': function(id, body, fn) {
    assertNotNull(this.options.token, "POST /gists/:id/comments endpoint requires authentication");
    assertNotNull(id, "You must specify a gist id");
    assertNotNull(body, "You must specify a comment body");
    assertNotEmpty(body, "The comment content can not by empty");

    var data = {
      'body': body
    };

    return process(this, "/gists/" + id + "/comments", { 'body': JSON.stringify(data), method: "POST" }, wrapFn(fn));
  },

  /**
   * Edit a comment
   */
  'comment_edit': function(id, body, fn) {
    assertNotNull(this.options.token, "PATCH /gists/:id/comments endpoint requires authentication");
    assertNotNull(id, "You must specify a gist id");
    assertNotNull(body, "You must specify a comment body");
    assertNotEmpty(body, "The comment content can not by empty");

    var data = {
      'body': body
    };

    return process(this, "/gists/" + id + "/comments", { 'body': JSON.stringify(data), method: "PATCH" }, wrapFn(fn));
  },

  /**
   * Delete a comment
   */
  'comment_delete': function(gist_id, id, fn) {
    assertNotNull(this.options.token, "DELETE /gists/:gist_id/comments/:id endpoint requires authentication");
    assertNotNull(gist_id, "You must specify a gist id");
    assertNotNull(id, "You must specify a comment id");

    return process(this, "/gists/" + gist_id + "/comments/" + id, { method: "DELETE" }, wrapFn(fn));
  }

};