window.onload = function() {
	var fns = document.getElementsByClassName("footnotes")[0];
	fns.classList.add("sidenotes");
	document.querySelectorAll('.footnotes > ol > li').forEach(function(fn) {
		var bodytop = document.body.getBoundingClientRect().top;

		// get height of note reference
		var fnref = document.getElementById(fn.id.replace(/fn/, 'fnref'));
		var reftop = fnref.getBoundingClientRect().top - bodytop;

		// get height of last note
		var num = parseInt(fn.id.replace(/fn/, ''));
		var prev = document.getElementById("fn" + (num-2));
		var prevbot = (num < 3) ? 0 : prev.getBoundingClientRect().bottom - bodytop;

		// put even notes on left
		if (!(num % 2)) fn.classList.add("leftnote");

		// put note flush with reference, but don't overlap previous notes
		fn.style.top = (Math.max(prevbot, reftop)) + "px";

		fnref.onmouseover = function(e) { fn.style.background = "#FAFAFA"; };
		fnref.onmouseout  = function(e) { fn.style.background = "none";    };
	});
}
