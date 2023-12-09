s.meter

(
SynthDef(\sine, {|freq=6000, amp=0.1, pan = 0, attack = 5, gate = 1, release=10|
	var lagFreq = freq.lag(5);
	var sig = SinOsc.ar(lagFreq);
	var env = EnvGen.kr(
		Env([0, 1, 0], [attack, release], releaseNode: 1),
		doneAction: 2,
		gate: gate,
	);
	sig = Pan2.ar(sig, pan);
	sig = sig*env*amp.lag(2.5);
	Out.ar(0, sig);
}).add;

~pmove = {
  arg start, end, steps;
  var interval = (end - start) / steps;
  var nums = Array.fill(steps, {arg i; start + (i * interval)});
  var seq = nums ++ [nums.last + interval] ++ nums.reverse;
  Pseq(seq, inf);
};


~rhizome = NetAddr.new("localhost", 9000);
~rhizome.sendMsg("/sys/subscribe", 9002, "/");
~numOsc = 24;
~freqLowBound = 6000;
~freqHighBound= 6400;
~ampLow = 0;
~ampHigh = 0.1;
~updateInterval = 0.05;

~mapFreq = {
	|index, val|
	if(index.mod(2) === 0,
		{val.linexp(0.0, 1.0, 110, 220) },
		{val.linexp(0.0, 1.0, 6000, 6400 )}
	);
};

~mapAmp = {
	|index, val|
	if(index.mod(2) === 0,
		{val.linlin(0.0, 1.0, 0, 0.2) },
		{val.linlin(0.0, 1.0, 0, 0.1 )}
	);
};
)



(
~osc = Array.fill(~numOsc, { arg i;
	Synth(\sine, [
		\freq, ~mapFreq.value(i, 0),
		\amp, ~mapAmp.value(i, 0),
		\attack, rrand(1, 5),
		\pan, (i/~numOsc) * 2 - 1,
	]);
});
)


(
thisProcess.openUDPPort(9002);

OSCdef(\ampUpdate, {|msg, time, addr, recvPort|
	var index = msg[1].asInteger;
	var synth = ~osc[index];
	var val = ~mapAmp.value(index, msg[2].asFloat);
	("Setting synth:" ++ index ++ " amp to: " ++ val).postln;
	synth.set(\amp, val);
}, '/set_amp');


OSCdef(\freqUpdate, {|msg, time, addr, recvPort|
	var index = msg[1].asInteger;
	var synth = ~osc[index];
	var val = msg[2].asFloat;

	var freqVal = ~mapFreq.value(index, val);
	("Setting synth:" ++ index ++ " freq to: " ++ freqVal).postln;
	synth.set(\freq, freqVal);
}, '/set_freq');
)


(
// Reset!
~rhizome.sendMsg("/scrool_x", 0);
~rhizome.sendMsg("/scrool_y", 0);
~rhizome.sendMsg("/zoom", 1);
Tdef(\animateX).stop;
Tdef(\animateY).stop;
Tdef(\animateXY).stop;
Tdef(\zoomAnimation).stop;
~numOsc.do { |i|

	// ~rhizome.sendMsg("/set_amp", i, 0);
	// ~rhizome.sendMsg("/set_freq", i, 0);
    ~rhizome.sendMsg("/zoom_item", i, 1);
    ~rhizome.sendMsg("/rotate", i, 0);
    ~rhizome.sendMsg("/spin", i);
};
)




(
~rhizome.sendMsg("/scrool_x", 0);
~rhizome.sendMsg("/scrool_y", 0.4);.
)

Tdef(\zoomAnimation).stop
(
Tdef(\zoomAnimation, {
	// var p = ~pmove.value(1, 3, 100);
	// var p = Pseq([0.5, 6], inf).asStream;
	var p = Pbrown(0.3, 3, 0.02, inf);
  var pStream = p.asStream;
  inf.do{
    var nextVal = pStream.value;
	~rhizome.sendMsg("/zoom", nextVal);
	0.01.wait;
  };
}).play;
)


(
// ScroolX
Tdef(\animateX, {
	var p = ~pmove.value(0, 1, 100);
	// var p = Pbrown(0.2, 0.8, 0.05);
  var pStream = p.asStream;
  inf.do{
    var nextVal = pStream.value;
	~rhizome.sendMsg("/scrool_x", nextVal);
	0.2.wait;
  };
}).play;
)

(
// ScroolX
Tdef(\animateY, {
  var p = ~pmove.value(0, 1, 200);
	// var p = Pbrown(0.4, 0.7, 0.02);
  var pStream = p.asStream;
  inf.do{
    var nextVal = pStream.value;
	~rhizome.sendMsg("/scrool_y", nextVal);
	0.3.wait;
  };
}).play;
)

~rhizome.sendMsg("/spin", 6, 5);
~rhizome.sendMsg("/zoom_item",3, 1.5);

(
// Spin
Tdef(\spinAll, {
  ~numOsc.do { |i|
	if(1.coin, {
	   ~rhizome.sendMsg("/spin", i, rrand(50, 100));
	}, {
	   ~rhizome.sendMsg("/spin", i);
	});
  };
}).play;
)


(
// Zoom
Tdef(\zoomItem, {
  ~numOsc.do { |i|
	if(0.coin, {
	   ~rhizome.sendMsg("/zoom_item", i, rrand(1.5, 2));
	}, {
	   ~rhizome.sendMsg("/zoom_item", i, 1);
	});
  };
}).play;
)




	~rhizome.sendMsg("/set_amp", 0, rrand(0, 1.0));
	~rhizome.sendMsg("/set_freq", 0, rrand(0, 1.0));


(
// ~mapFreq = {
// 	|index, val|
// 	if(index.mod(2) === 0,
// 		{val.linexp(0.0, 1.0, 110, 220) },
// 		{val.linexp(0.0, 1.0, 6000, 6400 )}
// 	);
// };
//
// ~mapAmp = {
// 	|index, val|
// 	if(index.mod(2) === 0,
// 		{val.linlin(0.0, 1.0, 0, 0.2) },
// 		{val.linlin(0.0, 1.0, 0, 0.1 )}
// 	);
// };

(~numOsc).do{|i|
	~rhizome.sendMsg("/set_amp", i, rrand(0, 0));
	~rhizome.sendMsg("/set_freq", i, rrand(0, 0));
}

)





~rhizome.sendMsg("/set_amp", 0, rrand(0.5, 1.0));
~rhizome.sendMsg("/set_freq", 0, rrand(0, 1.0));


(
// ScroolY
Tdef(\animateXY, {
  var stepsX = 25;
  var numsX = Array.fill(stepsX, {arg i; i/stepsX});
  var seqX = numsX ++ [1] ++ numsX.reverse;
  var patternX = Pseq(seqX, inf);
  var streamX = patternX.asStream;

  var stepsY = 15;
  var numsY = Array.fill(stepsY, {arg i; i/stepsY});
  var seqY = numsY ++ [1] ++ numsY.reverse;
  var patternY = Pseq(seqY, inf);
  var streamY = patternY.asStream;

  inf.do{
	~rhizome.sendMsg("/scrool_xy", streamX.value, streamY.value);
	~updateInterval.wait;
  };
}).play;
)
