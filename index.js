"use strict";

var util = require("util");

var async = require("async"),
    env = require("require-env"),
    request = require("crequest"),
    through = require("through");

var DELAY = 2000;

var eventsSearch = function(params, callback) {
  return request.get({
    uri: "https://papertrailapp.com/api/v1/events/search",
    qs: params,
    headers: {
      "X-Papertrail-Token": env.require("PAPERTRAIL_TOKEN")
    }
  }, function(err, rsp, body) {
    if (err) {
      return callback(err);
    }

    var payload = body.events.map(function(x) {
      var parts = x.message.split('"'),
          req = parts[1],
          referrer = parts[3],
          agent = parts[5];

      if (referrer === "(null)") {
        referrer = "";
      }

      return {
        request: req,
        referrer: referrer,
        agent: agent
      };
    });

    return callback(null, payload, { min_id: body.max_id }, body.reached_record_limit);
  });
};

var tail = function() {
  var params = {},
      stream = through();

  async.forever(function(callback) {
    return eventsSearch(params, function(err, data, _params, immediate) {
      if (err) {
        return callback(err);
      }

      data.forEach(function(x) {
        stream.write(util.format("%s\t%s\t%s\n", x.request, x.referrer, x.agent));
      });

      params = _params;

      if (immediate) {
        return callback();
      }

      setTimeout(callback, DELAY);
    });
  }, function(err) {
    console.error(err.stack);
  });

  return stream;
};

tail()
  .pipe(through(function(data) {
    var parts = data.split("\t"),
        req = parts[0],
        referrer = parts[1],
        style = req.split(" ")[1].split("/")[1];

    return request.post({
      uri: "https://api.choir.io/" + env.require("CHOIR_IO_API_KEY"),
      form: {
        label: style,
        sound: "n/" + Math.round(Math.random()),
        text: util.format("%s: %s", style, referrer || "unknown"),
        sprinkle: DELAY
      }
    }, function(err, rsp, body) {
      if (err) {
        console.error(err.stack);
        return;
      }

      if (rsp.statusCode !== 200) {
        console.error(body);
        return;
      }
    });
  }));
