(function(exports) {
  var $ = function (id) {return document.getElementById(id);},
      $$ = function(selector) {return document.querySelector(selector);};

  var menu_item = $$("header nav .locals"),
      menu_list = $$("header nav .locals ul"),
      header = $$("header .header"),
      footer = $$("footer .footer"),
      locals,
      i, l, item;



  var getLocals = function() {
    return window.localStorage.getItem("local_instants");
  };

  var setLocals = function(locals) {
    window.localStorage.setItem("local_instants", JSON.stringify(locals));
  };

  var remove = function(instantPageId) {
    locals = JSON.parse(getLocals());
    for (var i = 0, l = locals.length; i < l; i++) {
      var instant = locals[i];
      if (instant.id === instantPageId) {
        locals.splice(i, 1);
        break;
      }
    }
    setLocals(locals);
  };

  var delete_local = function(elem) {
    var id = elem.dataset.id, choice =  window.confirm("Are you sure you want to delete this instant ?\nYou won't be able to retrieve it anymore.");
    if (choice) {
      remove(id);
      header.removeChild(elem.parentNode);
    }
  };

  var appendItem = function(item, first, last) {
    var instant = document.createElement('li');
    instant.innerHTML = ["<a href='/anonymous/"+item.id+"/"+item.admin_hash+"' title='"+(item.description || "")+"'>",
      "<i class='left icon-file-text'></i>",
      "<i class='right icon-trash' data-id='"+item.id+"' title='Remove from this list' onclick='window.locals.delete(this); return false;'></i>",
      item.name,
    "</a>"].join("");

    menu_list.appendChild(instant);
  };

  var notify_footer_local = function(item) {
    var info = document.createElement("span");
    info.innerHTML = "<span title='This instant has been created locally from this computer. It is not attached to any user account'><i class='icon-info badge'></i>local instant created from this computer</span>";
    footer.appendChild(info);
  };

  var notify_header_upload = function(item) {
    var action = document.createElement("a");
    action.classList.add("action");
    action.href = "/anonymous/" + item.id + "/attach";
    action.title = "Attach this anonymous instant to your user account";
    action.innerHTML = "<i class='icon-cloud-upload'></i><span>Attach</span>";

    header.appendChild(action);
  };

  var init = function(userLoggedIn, instantPageId) {
    locals = getLocals();
    if (locals) {
      locals = JSON.parse(locals);
      for (i = 0, l = locals.length; i < l; i++) {
        item = locals[i];
        appendItem(item, i === 0, i === l - 1);
        // We are on the associated gist page
        if (item.id === instantPageId) {
          notify_footer_local(item);
          if (userLoggedIn) {
            notify_header_upload(item);
          }
        }
      }
      if (l > 0) {
        menu_item.classList.remove("hidden");
      }
    }
  };

  var add = function(instantPageId, adminHash, name, description) {
    locals = getLocals();
    if (locals) {
      locals = JSON.parse(locals);
    } else {
      locals = [];
    }
    locals.push({
      id: instantPageId,
      name: name,
      description: description,
      admin_hash: adminHash
    });
    setLocals(locals);
  };

  exports.locals = {
    'init': init,
    'add': add,
    'delete': delete_local,
    'remove': remove
  };

})(window);