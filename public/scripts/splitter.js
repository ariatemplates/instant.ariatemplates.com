(function () {
  var $ = function (id) {return document.getElementById(id);},
      SPLITTER_DIM = 4,
      currentSplitter = null;

  var Splitter = function (splitterId, callback) {
    this.handle = $(splitterId);
    this.proxy = $(splitterId + "-proxy");
    this.callback = callback;
    this.orientation = "horizontal";
    this.handle.addEventListener("mousedown", this.onHandleMousedown.bind(this));
  };

  Splitter.prototype.onHandleMousedown = function (evt) {
    currentSplitter = this;
    this.updatePosFromEvent(this.proxy, evt);
    this.proxy.classList.remove("splitter-proxy-hidden");
    evt.preventDefault();
  };

  Splitter.prototype.afterMouseUp = function (evt) {
    this.updatePosFromEvent(this.handle, evt);
    this.proxy.classList.add("splitter-proxy-hidden");
    currentSplitter = null;
  };

  Splitter.prototype.updatePosFromEvent = function (el, evt) {
    if (this.orientation == "vertical") {
      el.style.top = (evt.pageY - (SPLITTER_DIM/2)) + "px";
    } else {
      el.style.left = (evt.pageX - (SPLITTER_DIM/2)) + "px";
    }
  };

  var onDocMouseup = function (evt) {
    if (currentSplitter) {
      currentSplitter.callback(evt);
      currentSplitter.afterMouseUp(evt);
      evt.preventDefault();
    }
  };

  var onDocMousemove = function (evt) {
    if (currentSplitter) {
      currentSplitter.updatePosFromEvent(currentSplitter.proxy, evt);
      evt.preventDefault();
    }
  };

  document.addEventListener("mouseup", onDocMouseup);
  document.addEventListener("mousemove", onDocMousemove);

  new Splitter("splitter", function (evt) {window.instant.edit.onSplitterReleased(evt.pageX - (SPLITTER_DIM/2), SPLITTER_DIM);});

})();