"use strict";

var http = require("http"),
    stream = require("stream"),
    util = require("util");

var async = require("async"),
    env = require("require-env"),
    request = require("crequest");

var BinarySplitter = require("./lib/binary-splitter");

var CHOIR_IO_API_KEY = env.require("CHOIR_IO_API_KEY"),
    LOG_URL = env.require("LOG_URL"),
    SAMPLE_RATE = +process.env.SAMPLE_RATE || 100;

http.globalAgent.maxSockets = 20;

var LogStream = function(url) {
  stream.PassThrough.call(this);

  var source = request.get({
    uri: url,
    timeout: 0
  });

  source.pipe(this);
};

util.inherits(LogStream, stream.PassThrough);

var SamplingStream = function(rate) {
  stream.Transform.call(this);

  this._transform = function(chunk, encoding, callback) {
    if (Math.random() * 100 <= rate) {
      this.push(chunk);
    }

    return callback();
  };
};

util.inherits(SamplingStream, stream.Transform);

var ChoirStream = function(key) {
  stream.Writable.call(this);

  var queue = async.queue(function(task, callback) {
    // throttle submitted events
    if (queue.length() > 0) {
      return callback();
    }

    return request.post({
      uri: "https://api.choir.io/" + key,
      form: {
        label: task.style,
        sound: "n/" + Math.round(Math.random()),
        text: task.text
      },
      timeout: 2000
    }, function(err, rsp, body) {
      if (err) {
        console.warn(err.stack);
      }

      if (rsp.statusCode !== 200) {
        console.warn(body);
      }

      return callback();
    });
  }, http.globalAgent.maxSockets);

  this._write = function(chunk, encoding, callback) {
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

      queue.push({
        style: style,
        text: text
      });

      return callback();
    }
  };
};

util.inherits(ChoirStream, stream.Writable);

new LogStream(LOG_URL)
  .pipe(new BinarySplitter())
  .pipe(new SamplingStream(SAMPLE_RATE))
  .pipe(new ChoirStream(CHOIR_IO_API_KEY));
