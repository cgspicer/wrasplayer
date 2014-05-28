(function() {
  var DOMParser, find, parse;

  DOMParser = require('xmldom-browserify').DOMParser;

  find = function(node, list) {
    var attributes, childNode, childNodeName, childNodes, i, match, x, _i, _j, _ref, _ref1;
    if (node.hasChildNodes()) {
      childNodes = node.childNodes;
      for (i = _i = 0, _ref = childNodes.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        childNode = childNodes[i];
        childNodeName = childNode.nodeName;
        if (/REF/i.test(childNodeName)) {
          attributes = childNode.attributes;
          for (x = _j = 0, _ref1 = attributes.length; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
            match = attributes[x].nodeName.match(/HREF/i);
            if (match) {
              list.push({
                file: childNode.getAttribute(match[0]).trim()
              });
              break;
            }
          }
        } else if (childNodeName !== '#text') {
          find(childNode, list);
        }
      }
    }
    return null;
  };

  parse = function(playlist) {
    var doc, ret;
    ret = [];
    doc = (new DOMParser()).parseFromString(playlist, 'text/xml').documentElement;
    if (!doc) {
      return ret;
    }
    find(doc, ret);
    return ret;
  };

  exports.ASX = {
    name: 'asx',
    parse: parse
  };

}).call(this);

(function() {
  var COMMENT_RE, COMMENT_RE2, EXTENDED, comments, empty, extended, parse, simple;

  EXTENDED = '#EXTM3U';

  COMMENT_RE = /:(-?\d+),(.+)\s*-\s*(.+)\n(.+)/;

  COMMENT_RE2 = /:(-?\d+),(.+)\n(.+)/;

  extended = function(line) {
    var match;
    match = line.match(COMMENT_RE);
    if (match && match.length === 5) {
      return {
        length: match[1],
        artist: match[2],
        title: match[3],
        file: match[4].trim()
      };
    } else {
      match = line.match(COMMENT_RE2);
      if (match) {
        return {
          length: match[1],
          artist: match[2],
          title: match[2],
          file: match[3].trim()
        };
      }
    }
  };

  simple = function(string) {
    return {
      file: string.trim()
    };
  };

  empty = function(line) {
    return !!line.trim().length;
  };

  comments = function(line) {
    return line[0] !== '#';
  };

  parse = function(playlist) {
    var firstNewline;
    firstNewline = playlist.search('\n');
    if (playlist.substr(0, firstNewline) === EXTENDED) {
      return playlist.substr(firstNewline).split('#').filter(empty).map(extended);
    } else {
      return playlist.split('\n').filter(empty).filter(comments).map(simple);
    }
  };

  exports.M3U = {
    name: 'm3u',
    parse: parse
  };

}).call(this);

(function() {
  var LISTING_RE, parse;

  LISTING_RE = /(file|title|length)(\d+)=(.+)\r?/i;

  parse = function(playlist) {
    var index, key, line, match, tracks, value, _, _i, _len, _ref;
    tracks = [];
    _ref = playlist.trim().split('\n');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      match = line.match(LISTING_RE);
      if (match && match.length === 4) {
        _ = match[0], key = match[1], index = match[2], value = match[3];
        if (!tracks[index]) {
          tracks[index] = {};
        }
        tracks[index][key.toLowerCase()] = value;
      }
    }
    return tracks.filter(function(track) {
      return track != null;
    });
  };

  exports.PLS = {
    name: 'pls',
    parse: parse
  };

}).call(this);