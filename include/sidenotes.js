function placeSidenotes() {
	// Apply class to whole container
	var footnotes = document.getElementsByClassName("footnotes");
	for (let elem of footnotes){elem.classList.add("sidenotes")};

	var prevbot = 0
	var bodytop = document.body.getBoundingClientRect().top;
	document.querySelectorAll('.footnote-ref, figcaption, caption').forEach(function(elem) {

		is_caption = (elem.tagName == "FIGCAPTION") || (elem.tagName == "CAPTION")

		// We do it this way because we have to do figures and footnotes in the order
		// they appear in the text---if we just went through the footnotes list at the
		// end of the file, we wouldn't know the relative order of footnotes and captions.
		if (is_caption) {
			fnref = elem.parentNode // the <figure> or whatever containing the <figcaption>
			fn = elem // the <figcaption> itself
		} else {
			fnref = elem // the <a class="footnote-ref"> found in the text
			fn = document.getElementById(elem.id.replace(/ref/, '')); // the <li> with corresponding id
		}

		// get position of footnote reference
		var reftop = fnref.getBoundingClientRect().top - bodytop;

		// I don't know why this adjustment is necessary
		if (is_caption) {
			reftop += 14;
		}

		// put note flush with reference, but don't overlap previous notes
		fn.style.top = (Math.max(prevbot, reftop)) + "px";

		// so we can highlight notes when the mouse is over the note reference
		fnref.onmouseover = function(e) { fn.classList.add("hovered"); };
		fnref.onmouseout  = function(e) { fn.classList.remove("hovered"); };

		if (is_caption) {
			fn.classList.add("sidenote")
		}

		// store bottom of this note for positioning next note
		prevbot = fn.getBoundingClientRect().bottom - bodytop
	});
}

window.addEventListener("load", placeSidenotes);
window.addEventListener("resize", placeSidenotes);
