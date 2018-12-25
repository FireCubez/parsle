Req.module("parsle$parse-error", null, () => {
	return class ParseError extends Error {
		constructor(msg, line, col) {
			var str = "At line " + line + " col " + col + ": " + msg;
			super(str);
			this.line = line;
			this.col  = col;
		}
	}
})