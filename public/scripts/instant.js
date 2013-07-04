(function(exports) {
  var $ = function (id) { return document.getElementById(id); },
      $$ = function(selector) { return document.querySelector(selector); };

  var help = $('help');

  var show_keyboard_help = function() {
    keymage.pushScope('keyboard-help');
    help.classList.remove("background");
    help.classList.add("visible");
    return false;
  };

  var hide_keyboard_help = function() {
    help.classList.remove("visible");
    setTimeout(function() {
      help.classList.add("background");
    }, 1000);
    keymage.popScope();
  };

  keymage('defmod-shift-/', show_keyboard_help);
  keymage('keyboard-help', 'esc', hide_keyboard_help);


  var ajax = function(options, callback) {
    options.json = true;
    options.header = options.header || {};
    options.header['X-Requested-With'] = "XMLHttpRequest";
    majaX(options, callback);
  };

  var at_ajax = function(options, callback) {
    var req = new aria.core.transport.BaseXHR();
    var opts = {
      url: options.url,
      method: options.method || "GET"
    };
    if (options.data) {
      opts.data = options.data;
    }
    if (options.headers) {
      opts.headers = options.headers;
    }
    req.request(opts, {
      fn: function(a, b, res) {
        callback.call(null, JSON.parse(res.responseText));
      },
      scope: this
    });
  };


  var delete_instant = function(elem) {
    var instant_id = elem.dataset.id, userLogin = elem.dataset.userLogin;
    var choice =  window.confirm("Are you sure you want to delete this instant ?");
    if (choice) {
      ajax({
        url: "/" + userLogin + "/" + instant_id,
        method: "DELETE"
      }, function(response) {

      });
    }
  };

  var star_unstar_instant = function(elem, type) {
    var instant_id = elem.dataset.id,
        userLogin = elem.dataset.userLogin,
        icon = elem.querySelector("i"), text = elem.querySelector("span");
    ajax({
      url: "/" + userLogin + "/" + instant_id + "/" + type
    }, function(response) {
      if (response.ok) {
        icon.classList.toggle("icon-star-empty");
        icon.classList.toggle("icon-star");
        if (text) {
          text.innerHTML = type[0].toUpperCase()+type.substr(1);
        }
      } else {
        console.error(response.error.message);
      }
    });
  };

  var star_instant = function(elem) {
    star_unstar_instant(elem, "star");
  };
  var unstar_instant = function(elem) {
    star_unstar_instant(elem, "unstar");
  };


  exports.instant = {
    '$': $,
    '$$': $$,
    'ajax': ajax,
    'at_ajax': at_ajax,
    'show_keyboard_help': show_keyboard_help,
    'delete': delete_instant,
    'star': star_instant,
    'unstar': unstar_instant
  };
})(window);