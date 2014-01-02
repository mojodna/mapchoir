"use strict";

var stream = require("stream"),
    util = require("util");

var env = require("require-env"),
    request = require("crequest");

var BinarySplitter = require("./lib/binary-splitter");

var CHOIR_IO_API_KEY = env.require("CHOIR_IO_API_KEY"),
    LOG_URL = env.require("LOG_URL"),
    SAMPLE_RATE = process.env.SAMPLE_RATE || 100;

var LogStream = function(url) {
  stream.PassThrough.call(this);

  // TODO error / close handling
  var source = request.get(url);
  source.pipe(this);
};

util.inherits(LogStream, stream.PassThrough);

var ChoirStream = function(key) {
  stream.Writable.call(this);

  this._write = function(chunk, encoding, callback) {
    // sample
    if (Math.random() * 100 <= SAMPLE_RATE) {
      var parts = chunk.toString().trim().split('"'),
          referrer = parts[3],
          agent = parts[5],
          style = parts[1].split("/")[1];

      if (style.indexOf("?") < 0) {
        // skip raw watercolor URLs

        var text = util.format("%s: <a href=\"%s\">%s</a>", style, referrer, referrer);

        if (referrer === "(null)") {
          text = util.format("%s: %s", style, agent);
        }

        // fire and forget
        request.post({
          uri: "https://api.choir.io/" + key,
          form: {
            label: style,
            sound: "n/" + Math.round(Math.random()),
            text: text
          }
        }, function(err, rsp, body) {
          if (err) {
            console.warn(err.stack);
            return;
          }

          if (rsp.statusCode !== 200) {
            console.warn(body);
            return;
          }
        });
      }
    }

    return callback();
  };
};

util.inherits(ChoirStream, stream.Writable);

new LogStream(LOG_URL)
  .pipe(new BinarySplitter())
  .pipe(new ChoirStream(CHOIR_IO_API_KEY));
