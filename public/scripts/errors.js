var ErrorsManager = function(editors) {
  this.editors = editors;
  this.errors = {
    tpl: false,
    style: false
  };

  this.checkAnnotations('script');
  this.checkAnnotations('data');

  this._hackBrowserConsole();
};

ErrorsManager.prototype.getEditor = function(name) {
  return this.editors[name];
};

ErrorsManager.prototype.setError = function (type, content) {
  this.errors[type] = content;
  this.refreshErrors();
};

ErrorsManager.prototype.removeError = function (type) {
  this.setError(type, false);
  this.refreshErrors();
};

ErrorsManager.prototype.refreshErrors = function () {
  var self = this;
  this.updateAnnotations(this.errors['tpl'], this.getEditor('tpl').editor);
  this.updateAnnotations(this.errors['style'], this.getEditor('style').editor);
  this.updateHeaderPanels();
};

ErrorsManager.prototype.checkAnnotations = function(type) {
  var i, l,
      panel = this.editors[type].panel,
      session = this.editors[type].editor.getSession();

  session.on('changeAnnotation', function(evt) {
    var annotations = evt.target.$annotations, annotation;
    panel.classList.remove("error");
    if (annotations && annotations.length) {
      for(i = 0, l = annotations.length; i < l; i++) {
        annotation = annotations[i];
        if (annotation.type === "error") {
          panel.classList.add("error");
          return;
        }
      }
    }
  });
};

ErrorsManager.prototype.updateAnnotations = function (error, aceEditor) {
  if (error) {
    var errorLines = this.extractErrorLines(error),
      annotations = [];
    for (var i = 0 ; i < errorLines.length ; i++) {
      annotations.push({
        row: errorLines[i] - 1, column: 1,
        text: error, type: "error"
      });
    }
    if (!annotations.length) {
      annotations.push({
        row: 0, column: 1,
        text: error, type: "error"
      });
    }

    aceEditor.getSession().setAnnotations(annotations);
  } else {
    aceEditor.getSession().clearAnnotations();
  }
};

ErrorsManager.prototype.updateHeaderPanels = function() {
  for (var _ in this.errors) {
    var panel = this.getEditor(_).panel;
    if (this.errors[_]) {
      panel.classList.add("error");
    } else {
      panel.classList.remove("error");
    }
  }
};

ErrorsManager.prototype.extractErrorLines = function (error) {
  var lines = [],
      matches,
      re    = /line (\d+)/g;
  while (matches = re.exec(error)) {
    lines.push(matches[1]);
  }
  return lines;
};

ErrorsManager.prototype._hackBrowserConsole = function() {
  var errorbkp = console.error;
  var self = this;
  console.error = function (message, originalError) {
    //console.log(arguments);
    if (/(InstantTemplate|Parser|ClassGenerator|TemplateCtxt)\]/.test(message))  {
      if (originalError && originalError.message) {
        message = originalError.message /*+ "\n" + message*/;
      }
      if (/CSS/.test(message)) {
        self.setError("style", message);
      } else {
        self.setError("tpl", message);
      }
    } else {
      if (errorbkp.apply) {
        errorbkp.apply(this, arguments);
      } else {
        errorbkp(arguments[0]);
      }
    }
  };
};