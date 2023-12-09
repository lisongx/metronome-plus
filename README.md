# Metronome Play (name TBD)

## Setup

We use [rhizome](https://github.com/sebpiq/rhizome) for serve the web page and syncing the osc messages.

To install it you need to have node, be aware the latest one doesn't work with this yet.
I'm using `nvm` with version `8` it seems to work

So to have the right node

```
 nvm install 8
 nvm use 8
```


Install `rhizome`

```
npm install -g rhizome-server
```


## Start

Start the web server by

```
rhizome config.js
```


And the webpage with sliders will be serve at `http://localhost:8000/`


Then open the `controls/index.scd` file with SuperCollier, now you can play

(the code should be pretty self explanatory)



## TODOs

* have a more simple/elegant DSL for controlling the movement instead of the OSCDef in our SC file
* possibly the code you are typing are also displaying in the tablet or somewhere for audience to see
