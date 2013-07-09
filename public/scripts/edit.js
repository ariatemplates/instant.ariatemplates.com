(function(instant) {
  var $ = instant.$,
      $$ = instant.$$;

  var editors = {},
      errors_manager,
      editors_types = ['tpl', 'script', 'style', 'data'],
      ICON_TITLE_EXPAND = "Expand to full height",
      ICON_TITLE_COLLAPSE = "Collapse",
      code, preview, splitter;

  /**
   * ACE Editor helper to change the shortcut for an existing built-ins command.
   * The exec handler will be taken from the existing command. Will log an error if the command does not exist.
   * @param {Editor} editor Ace editor to update
   * @param {String} commandName
   * @param {String} winShortcut/macShortcut shortcuts for Win/Mac (eg "Ctrl+L", "Command+G")
   * @return {Boolean} true only if the command was successfully added
   */
  var reassignCommand = function (editor, commandName, winShortcut, macShortcut) {
    var prevCommand = editor.commands.byName[commandName];
    if (typeof prevCommand == "undefined") {
      console.error("[instantAt:reassignCommand]Command " + cmdName + " does not exist.");
      return false;
    } else {
      // addCommand will remove the command before creating the new one
      editor.commands.addCommand({
        name: commandName,
        bindKey: {win : winShortcut, mac : macShortcut},
        exec: prevCommand.exec,
        readOnly: prevCommand.readOnly
      });
      return true;
    }
  };


  /**
   * Initialize all 4 ACE editors with associated theme, modes
   */
  var initEditor = function(name, mode) {
    var editor, panel;

    editor = ace.edit(name+"-editor");
    editor.setTheme("ace/theme/monokai");
    editor.setFontSize("14px");
    editor.getSession().setMode(mode);
    editor.getSession().setUseWrapMode(true);

    editor.on('change', refresh);

    reassignCommand(editor, "gotoline", "Ctrl-G", "Command-G");

    panel = document.querySelector("." + name + ".panel");

    panel.addEventListener("transitionend", function(evt) {
      if (evt.propertyName === "top") {
        panel.classList.toggle("transitioning");
        editor.resize();
      }
    }, false);

    editors[name] = {
      editor: editor,
      panel: panel
    };

    // Keyboard management
    keymage('defmod-'+(editors_types.indexOf(name) + 1), function() { return fullscreen_from_kb(name); });
  };

  var getEditor = function(name) {
    return editors[name].editor;
  };

  var setPositionInPx = function(elem, positionName, value) {
    elem.style[positionName] = value + "px";
  };


  var loadTemplate = function() {
    var tpl_content = getEditor('tpl').getValue(),
        data = loadModel();
    var tplString = "{Template {$classpath : 'InstantTemplate', $hasScript:true, $css:['InstantTemplateStyle']}}"+tpl_content+"{/Template}";
    aria.templates.TplClassGenerator.parseTemplate(tplString, false, {
        fn : function (res, args) {
          if (res.classDef) {
            errors_manager.removeError("tpl");
            loadTemplateInPreview(res.classDef, data);
          }
        }
      },{ "file_classpath" : "InstantTemplate" }
    );
  };
  var loadTemplateInPreview = function(classDef, data) {
    aria.core.ClassMgr.$on({
      "classComplete": {
        fn : onTemplateLoaded, args: data, scope : window
      }
    });
    Aria["eval"](classDef);
  };

  var loadModel = function() {
    try {
      //errors.removeError("data");
      eval("var data = " + getEditor('data').getValue() + ";");
    } catch(e) {
      //errors.setError("data","[DATA MODEL ERROR] : " + e.message);
      var data = {};
    }
    return data;
  };

  var loadTemplateScript = function() {
    var script_content = getEditor('script').getValue();
    try {
      eval("Aria.tplScriptDefinition("+script_content+");");
      //errors.removeError("script");
    } catch (e) {
      //errors.setError("script", "[SCRIPT ERROR] : " + e.message);
    }
  };
  var onTemplateLoaded = function(evt, data) {
    if (evt.refClasspath == "InstantTemplate") {
      Aria.loadTemplate({
        classpath: "InstantTemplate",
        div: "preview",
        data: data
      });
      aria.core.ClassMgr.$removeListeners({
        "classComplete": {
          fn : onTemplateLoaded, scope : window
        }
      });
    }
  };
  var loadTemplateStyle = function () {
    var css_content = getEditor('style').getValue();
    var tplString = "{CSSTemplate {$classpath : 'InstantTemplateStyle'}}"+css_content+"{/CSSTemplate}";
    aria.templates.CSSClassGenerator.parseTemplate(tplString, false, {
        fn : function (res, args) {
          if (res.classDef) {
            errors_manager.removeError("style");
            Aria["eval"](res.classDef);
          } else {
            errors_manager.setError("style", "[STYLE ERROR] : " + e.message);
          }
        }
      },{ "file_classpath" : "InstantTemplateStyle" }
    );
  };

  // Refresh preview from model
  var refresh = function () {
    try {
      aria.templates.TemplateManager.unloadTemplate("InstantTemplate");
      aria.templates.CSSMgr.unloadClassPathDependencies("InstantTemplate", ["InstantTemplateStyle"]);
    } catch (o_O) {
      // I can haz lazyness
    }
    loadModel();
    loadTemplateScript();
    loadTemplateStyle();
    loadTemplate();
  };



  var init = function(initial_code_width) {
    code = $('code'),
    preview = $('preview-wrapper'),
    splitter = $('splitter');

    if (initial_code_width) {
      setPositionInPx(code, "width", initial_code_width);
      setPositionInPx(preview, "left", initial_code_width);
      setPositionInPx(splitter, "left", initial_code_width);
    }

    initEditor("tpl", "ace/mode/aria");
    initEditor("script", "ace/mode/javascript");
    initEditor("style", "ace/mode/aria");
    initEditor("data", "ace/mode/javascript");

    keymage('esc', reset_fullscreen);

    errors_manager = new ErrorsManager(editors);

    refresh();
  };

  var fullscreen_from_kb = function(name) {
    var icon = $$(".panel."+name+" .actions i");
    reset_fullscreen();
    setTimeout( function() { fullscreen(name, icon); }, 400);
    return false;
  };

  var reset_fullscreen = function() {
    var panel;
    editors_types.forEach(function(name) {
      panel = editors[name].panel;
      if (panel.classList.contains("transitioning") && ! panel.classList.contains("full-screen")) {
        panel.classList.remove("transitioning");
      }
      if (panel.classList.contains("full-screen")) {
        fullscreen(name, $$(".panel."+name+" .actions i"));
      }
    });
  };

  var fullscreen = function(name, icon) {
    var panel = editors[name].panel, editor = editors[name].editor, title;
    icon.classList.toggle("icon-resize-full");
    icon.classList.toggle("icon-resize-small");
    icon.title = (icon.title === ICON_TITLE_EXPAND ? ICON_TITLE_COLLAPSE: ICON_TITLE_EXPAND);

    panel.classList.toggle("transitioning");
    panel.classList.toggle("full-screen");

    var resize = function() {
      if (panel.classList.contains("transitioning")) {
        editor.resize();
        requestAnimationFrame(resize);
      }
    };
    requestAnimationFrame(resize);
  };

  var on_splitter_released = function(position) {
    setPositionInPx(code, "width", position);
    setPositionInPx(preview, "left", position);
    editors_types.forEach(function(name) {
      getEditor(name).resize();
    });
  };

  var save_instant = function(elem) {
    var instant_id = elem.dataset.id, userLogin = elem.dataset.userLogin;
    var data = {
      tpl: getEditor("tpl").getValue(),
      script: getEditor("script").getValue(),
      style: getEditor("style").getValue(),
      data: JSON.stringify(loadModel())
    };
    instant.at_ajax({
      url: "/" + userLogin + "/" + instant_id,
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      data: JSON.stringify(data)
    }, function(response) {
      if (response.ok) {
        var icon = elem.getElementsByTagName("i")[0];
        icon.classList.remove('icon-save');
        icon.classList.add('icon-ok');
        setTimeout(function () {
          icon.classList.remove('icon-ok');
          icon.classList.add('icon-save');
        }, 2000);
      }
    });
  };

  var save_anonymous_instant = function(elem) {
    var instant_id = elem.dataset.id, admin_hash = elem.dataset.adminHash;
    var data = {
      tpl: getEditor("tpl").getValue(),
      script: getEditor("script").getValue(),
      style: getEditor("style").getValue(),
      data: JSON.stringify(loadModel())
    };
    instant.at_ajax({
      url: "/anonymous/" + instant_id + "/" + admin_hash,
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      },
      data: JSON.stringify(data)
    }, function(response) {
      console.log(response);
    });
  };

  instant.edit = {
    'init': init,
    'fullscreen': fullscreen,
    'onSplitterReleased': on_splitter_released,
    'save': save_instant,
    'save_anonymous': save_anonymous_instant,
    'editor': getEditor
  };
})(window.instant);