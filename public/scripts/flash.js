(function() {
  var $ = function (id) { return document.getElementById(id); },
      $$ = function(selector) { return document.querySelector(selector); };

  var flash = $$("#flash"),
      show_timeout = 250, hide_timeout = 10000;
})(window);