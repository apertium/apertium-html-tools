Apertium Html-tools
====================

Apertium Html-tools is a web application providing a fully localised interface for text/document translation, analyzation, and generation powered by Apertium. Designed to use only static resources for quick and easy deployment with any web server, it is relatively lightweight and user-friendly. Html-tools relies on an Apertium HTTP API such as [Apertium-apy](http://wiki.apertium.org/wiki/Apertium-apy) or [ScaleMT] (http://wiki.apertium.org/wiki/ScaleMT) (to a lesser extent). Development takes place on [GitHub](https://github.com/goavki/apertium-html-tools); however, a read-only copy of the repository is kept in our [SVN repository (/trunk/apertium-tools/apertium-html-tools)](https://svn.code.sf.net/p/apertium/svn/trunk/apertium-tools/apertium-html-tools/).

More information along with instructions for localization is available on the [Apertium Wiki](http://wiki.apertium.org/wiki/Apertium-html-tools).

Prerequisites
----------------
* Python 3
* curl

Setup
-------
1. Copy `config.conf.example` to `config.conf` and edit it.
2. Then type `make`.

Running
----------
The files can be served by any server. You can use whatever you like,
including Apache or even just Python's HTTP server. For example, to
run on locally on `http://localhost:8080` you can do the following:

    python3 -m http.server 8080

For production usage, remember to enable gzip compression in your
server.
