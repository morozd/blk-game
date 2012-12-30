# Setting up a server

## Quickstart

### Requirements

* node.js 0.8.14+

### OS X / Linux

```
mkdir my-blk-server
cd my-blk-server/
npm install blk-server
cp node_modules/blk-server/run-server.sh .
# edit run-server.sh to change options
./run-server.sh
# have friends join ws://[your ip]:1338 (or whatever port you set)
```

### Windows

```
mkdir my-blk-server
cd my-blk-server
npm install blk-server
copy node_modules\blk-server\run-server.bat .
REM edit run-server.bat to change options
run-server.bat
# have friends join ws://[your ip]:1338 (or whatever port you set)
```

## Options

TODO

## Getting Listed

Want your server listed on the main page? This will get random public players
who will destroy your beautiful creations. But, it'll be fun! Maybe.

Request a key with this form: [BLK Server Listing Request](https://docs.google.com/forms/d/1BuQj-D0oHvZFBepmcSFn3X16-Eh6Eoy6I-uF8R6KcgI/viewform)

You'll get a mail (eventually) with two UUIDS: a server ID (public) and a
key (private). Open your run-server.sh and set SERVER_ID and SERVER_KEY to
these values. Launch your server and it should show in the index!
