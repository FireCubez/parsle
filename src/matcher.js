Req.module("parsle$matcher", $$ =>
	$$.depend(
		"parsle$parse-error",
		"an Error subclass that gives useful parse info"
	) .depend(
		"line-column",
		"gets line and column information from index"
	),
	$$ => {

	const ParseError = $$.get("parsle$parse-error", {});
	const lineColumn = $$.get("line-column", {});
	const cat = x  => x;
	const yes = () => true;

	function Matcher() {
		this.result = []; this.line = 1; this.col = 1;
		this.error = null; this.states = [];
		Object.defineProperty(this, "lc", {
			configurable: false,
			enumerable: false,
			writable: true
		})
		Object.defineProperty(this, "input", {
			configurable: false,
			enumerable: true,
			get: () => this.originalInput,
			set(v) {
				this.originalInput = v;
				this.string = v;
				this.lc = lineColumn(v);
			}
		})
		Object.defineProperty(this, "pos", {
			configurable: false,
			enumerable: true,
			get: () => this._pos,
			set(v) {
				this._pos = v;
				var o     = this.lc.fromIndex(v);
				if(o !== null) {
					this.line = o.line;
					this.col  = o.col;
				} else {
					this.line = "EOF";
					this.col  = "EOF";
				}
			}
		})
		this.input = "";
		this.pos = 0;
	}

	Matcher.prototype.defaultTransform = Matcher.defaultTransform = info => info.match;
	Matcher.prototype.IGNORED = Matcher.IGNORED = Symbol("parsle$Matcher.IGNORED");

	Matcher.prototype.MATCH = function(regex, transform, gate) {
		// TODO: Find a way to not repeat ourselves
		if(regex.global) {
			throw new Error("Cannot use `g` flag in regex " + regex.toString());
		}
		/* eslint-disable no-param-reassign */
		gate      = gate      || yes;
		transform = transform || Matcher.defaultTransform;
		var res   = this.string.match(regex);
		/* eslint-enable no-param-reassign */
		var info  = {
			line: this.line,
			col: this.col,
			pos: this.pos,
			match: res
		}
		if(!res || res.index > 0) {
			throw new ParseError(
				"Expected matching " + regex.toString() +
				' but got "' + this.string.slice(0, 5) + '..."',
				this.line, this.col)
		} else {
			info.length = res[0].length
			if(!gate(info)) {
				throw new ParseError(
					"Gate " + (gate.name && gate.name !== "anonymous" ? "`" + gate.name + "` " : "") +
					'did not match for "' + this.string.slice(0, 5) + '..."',
					this.line, this.col)
			} else {
				if(transform !== Matcher.IGNORED) {
					let transformed = transform(info);
					if(transformed !== Matcher.IGNORED) {
						this.result.push(transformed);
					}
				}
				this.pos += res[0].length;
				this.string = this.string.slice(res[0].length);
			}
		}
	}

	Matcher.prototype.MATCH_AHEAD = function(regex, transform, gate) {
		if(regex.global) {
			throw new Error("Cannot use `g` flag in regex " + regex.toString());
		}
		/* eslint-disable no-param-reassign */
		gate      = gate      || yes;
		transform = transform || Matcher.defaultTransform;
		/* eslint-enable no-param-reassign */
		var res   = this.string.match(regex);
		var info  = {
			line: this.line,
			col: this.col,
			pos: this.pos,
			match: res
		}
		if(!res) {
			throw new ParseError(
				"Expected matching " + regex.toString() +
				' but got "' + this.string.slice(0, 5) + '..."',
				this.line, this.col)
		} else {
			info.length = res[0].length
			if(!gate(info)) {
				throw new ParseError(
					"Gate " + (gate.name && gate.name !== "anonymous" ? "`" + gate.name + "` " : "") +
					'did not match for "' + this.string.substr(res.index, 5) + '..."',
					this.line, this.col)
			} else {
				if(transform !== Matcher.IGNORED) {
					let transformed = transform(info);
					if(transformed !== Matcher.IGNORED) {
						this.result.push(transformed);
					}
				}
				this.pos += res[0].length;
				this.string = this.string.slice(res[0].length + res.index);
			}
		}
	}

	Matcher.prototype.PUSHSTATE = function() {
		this.states.push({
			result: Object.assign([], this.result),
			pos: this.pos,
			string: this.string
		});
	}
	Matcher.prototype.POPSTATE = function() {
		var s       = this.states.pop();
		this.result = s.result,
		this.pos    = s.pos,
		this.string = s.string
	}

	Matcher.prototype.OPTIONAL = function(fn) {
		this.PUSHSTATE();
		try {
			fn();
		} catch(e) {
			this.POPSTATE();
			if(e instanceof ParseError) {
				this.error = e;
				this.result.push(null);
				return false;
			} else {
				throw e;
			}
		}
		this.states.pop();
		return true;
	}
	Matcher.prototype.TRY = function(fn) {
		this.PUSHSTATE();
		var r = this.OPTIONAL(fn);
		this.POPSTATE();
		return r;
	}

	Matcher.prototype.GROUP = function(fn, transform) {
		transform = transform || cat; // eslint-disable-line no-param-reassign
		var old = this.result;
		this.result = [];
		fn();
		var r = this.result;
		this.result = old;
		this.result.push(transform(r));
	}

	Matcher.prototype.OR = function(fnArray) {
		for(let i = 0; i < fnArray.length; i++) {
			if(this.OPTIONAL(fnArray[i])) {
				return;
			}
			this.result.pop(); // Remove extra `null` value
		}
		throw new ParseError(
			'No alternatives can match "' + this.string.slice(0, 5) + '..."',
			this.line, this.col);
	}
	
	return Matcher;

})