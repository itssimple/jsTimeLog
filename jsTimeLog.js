var jsTimeLog = window.jsTimeLog || {};
jsTimeLog.MaxLevels = 5;
jsTimeLog.Debug = false;
jsTimeLog.CurrentLevel = 0;
jsTimeLog.CurrentNS = 'window';
jsTimeLog.BlackList = [
    'jsTimeLog', 'parent', 'top', 'self', 'window', 'frames',
    'document', 'external', '$', 'jQuery', 'theForm', 'Sys',
    '__theFormPostCollection', '_events', 'ol_frame', 'Telerik',
    'capExtent', 'ol_texts', 'ol_caps', 'olInfo', 'ol_text',
    '$telerik', '$common', 'PRUM_EPISODES', 'console', 'chrome',
    'memory', 'postParse', 'o3_frame', '_kgdata', 'window.$addHandler',
    'window.onload', 'window.$', '$addHandler', 'window.jQuery',
    'window.$get', 'window.$create', 'window.$find', 'window.$addHandlers',
    '$get', '$create', '$addHandler', '$addHandlers', 'window.theForm',
    'TelerikCommonScripts', 'commonScripts', '__doPostBack', 'window.__doPostBack'
];
jsTimeLog.Init = function (obj, ns) {
    if (obj === undefined) { return; }
    if (ns !== undefined)
        jsTimeLog.CurrentNS = ns;
    var functions = [];

    jsTimeLog.CurrentLevel++;
    if (jsTimeLog.Debug) console.log("(" + jsTimeLog.CurrentLevel + ") Rewriting " + jsTimeLog.CurrentNS);

    if (jsTimeLog.CurrentLevel >= jsTimeLog.MaxLevel) {
        if(jsTimeLog.Debug) console.log('Reached the maximum depth');
        return;
    }
    var ownObj = Object.getOwnPropertyNames(obj);
    for (var i = 0; i < ownObj.length; i++) {
        if (typeof obj[ownObj[i]] === 'function') {
            if (jsTimeLog.RewriteFunction(obj[ownObj[i]], ownObj[i])) {
                functions.push(ownObj[i]);
            }
        } else if (typeof obj[ownObj[i]] === 'object' && obj[ownObj[i]] !== obj) {
            if (jsTimeLog.BlackList.indexOf(ownObj[i]) !== -1)
            {
                if(jsTimeLog.Debug) console.log(ownObj[i] + ' is blacklisted');
                continue;
            }
            if (typeof ownObj[i] !== 'undefined' && typeof obj[ownObj[i]] !== 'undefined') {
                if (obj[ownObj[i]] !== null && obj[ownObj[i]].toString().replace(/[\[\]]/gi, '').split(' ')[1]) {
                    if (jsTimeLog.Debug) console.log("Going deeper: " + ownObj[i]);

                    jsTimeLog.CurrentNS = jsTimeLog.CurrentNS + '.' + ownObj[i];
                    jsTimeLog.Init(obj[ownObj[i]]);
                }
            }
        }
    }
    jsTimeLog.CurrentLevel--;
    jsTimeLog.CurrentNS = jsTimeLog.CurrentNS.substring(0, jsTimeLog.CurrentNS.lastIndexOf('.'));
};

jsTimeLog.RewriteFunction = function (inputFunction, objectName) {
    var oldFunction = inputFunction.toString();
    if (oldFunction.indexOf('[native code]') > -1) {
        return false;
    }

    var firstBracket = oldFunction.indexOf('{');
    var firstArgument = oldFunction.indexOf('(');
    var lastBracket = oldFunction.lastIndexOf('}');
    var functionname = oldFunction.substring(9, firstArgument);
    var hasReturn = oldFunction.lastIndexOf('return') > -1;
    var blacklisted = jsTimeLog.BlackList.indexOf(jsTimeLog.CurrentNS + '.' + objectName) !== -1;

    if (!blacklisted && eval(jsTimeLog.CurrentNS + "." + objectName) !== undefined) {
        var code = oldFunction.substring(firstBracket + 1, lastBracket);

        code = jsTimeLog.CurrentNS + "." + objectName + " = function " + oldFunction.substring(9, firstBracket) + " {\n" +
			"\tvar __jsT_Start = new Date().getTime();\n\n" +
			code +
			"\n\n\tvar __jsT_End = new Date().getTime();\n" +
			"\t//jsTimeLog.Timings['" + jsTimeLog.CurrentNS + "." + objectName + "'].push(__jsT_End - __jsT_Start);\n" +
			"\tconsole.log('" + objectName + " ' + (__jsT_End - __jsT_Start) + ' ms');\n" +
			"}";
        eval(code);

        if (hasReturn && jsTimeLog.Debug) {
            console.log(oldFunction.toString());
            console.log(code);
        }

        if (typeof jsTimeLog.Timings[jsTimeLog.CurrentNS + "." + objectName] === 'undefined')
            jsTimeLog.Timings[jsTimeLog.CurrentNS + "." + objectName] = [];

        return true;
    } else {
        if(jsTimeLog.Debug) console.log(jsTimeLog.CurrentNS + '.' + objectName + ': Blacklisted');
    }

    return false;
};

jsTimeLog.Timings = {};

window.jsTimeLog = jsTimeLog;
