(function(exports) {

  var delete_instant = function(elem) {
    var choice =  window.confirm("Are you sure you want to delete this instant ?\nDeletion is permanent.");
    if (choice) {
      window.location = "/" + elem.dataset.userLogin + "/" + elem.dataset.id + "/delete";
    }
  };

  exports.iat = {
    'delete': delete_instant
  };

})(window);