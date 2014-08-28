(function (instant) {
    var $ = instant.$;

    var formatVersion = function (version) {
        return version.replace(/^(\d)(\d)(\d{1,2})$/, "$1.$2.$3");
    };

    instant.atVersion = {
        versions : function (info) {
            var list = info.list;
            if (!list) {
                return;
            }
            var elt = $("atversion");
            var currentVersion = elt.firstChild.value;
            for (var i = 0, l = list.length; i < l; i++) {
                var version = list[i];
                if (version != currentVersion) {
                    var option = document.createElement("option");
                    elt.appendChild(option);
                    option.value = version;
                    option.appendChild(document.createTextNode(formatVersion(version)));
                }
            }
        },
        change : function () {
            var elt = $("atversion");
            var href = window.location.href + "";
            href = href.replace(/atversion=[^&]*/, "");
            href = href.replace(/\?$/, "");
            href += href.indexOf("?") > -1 ? "&" : "?";
            href += "atversion=" + encodeURIComponent(elt.value);
            window.location = href;
        }
    };
})(window.instant);