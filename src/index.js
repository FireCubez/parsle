Req.module("parsle", $$ =>
	$$.depend(
		"parsle$matcher",
		"a module that provides the `Matcher` class"
	) .depend("mirrorprop", "forwards property get/sets"),
	$$ => {

	const mirrorprop = $$.get("mirrorprop", {});
	const Matcher    = $$.get("parsle$matcher", {});

	class Parsle {
		constructor(fn) {
			var $ = new Matcher();
			mirrorprop(this, "input",  $, "input");
			mirrorprop(this, "pos",    $, "pos");
			mirrorprop(this, "error",  $, "error");
			mirrorprop(this, "result", $, "result");
			Object.defineProperty(this, "intern", {
				configurable: false,
				enumerable: false,
				value: {
					matcher: $,
					mf: fn
				}
			});
		}

		parse(str) {
			var $ = this.intern.matcher;
			this.input = str;
			this.pos = 0;
			this.intern.mf.call($, $);
			return this.result;
		}
	}

	return Parsle;

	}
)