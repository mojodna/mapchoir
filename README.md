# mapchoir

[Choir.io](http://choir.io/) integration for
[maps.stamen.com](http://maps.stamen.com/).

## How?

1. maps.stamen.com tiles are served via [Fastly](http://fastly.net/).
2. Fastly
   [syslogs](https://fastly.zendesk.com/entries/21713181-Remote-log-streaming-setup)
   request URLs, HTTP referrers, and user agents to
   [`log-nexus`](https://github.com/mojodna/log-nexus) using the format `"%r"
   "req.http.referer" "req.http.user-agent"`.
3. `mapchoir` listens to `log-nexus` messages over HTTP and outputs them to
   a stream.
4. Stream events are pushed to Choir.io.

## Why?

Why not?

## Environment Variables

* `CHOIR_IO_API_KEY` - choir.io API key (required).
* `LOG_URL` - [log-nexus](https://github.com/mojodna/log-nexus) URL (required).
* `SAMPLE_RATE` - sample rate (optional).
