# mapchoir

[Choir.io](http://choir.io/) integration for
[maps.stamen.com](http://maps.stamen.com/).

## How?

1. maps.stamen.com tiles are served via [Fastly](http://fastly.net/).
2. Fastly [syslogs](http://help.papertrailapp.com/kb/hosting-services/fastly)
   request URLs, HTTP referrers, and user agents to
   [papertrail](https://papertrailapp.com/) using the format `"%r"
   "req.http.referer" "req.http.user-agent"`.
3. `mapchoir` follows [papertrail
   events](http://help.papertrailapp.com/kb/how-it-works/http-api#events) (in
   `tail()`) and outputs them to a stream.
4. A pipeline is created using [`through`](https://github.com/dominictarr/through).
5. Stream events are pushed to Choir.io.

## Why?

Why not?

## Environment Variables

* `PAPERTRAIL_TOKEN` - papertrail token.
* `CHOIR_IO_API_KEY` - choir.io API key.
