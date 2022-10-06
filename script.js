"use strict";
var assets_folder = undefined;

function sortTable(id, column_number, type) {
    var table, rows, switching, i, x, y, shouldSwitch, dir = 0;
    table = document.getElementById(id);
    switching = true;
    dir = "desc";
    let headers = table.getElementsByTagName("TR")[0].getElementsByTagName("th");

    sorted = false
    if (headers[column_number].getAttribute('data-sort-order') == "asc") {
        dir = "desc";
        sorted = true
    }
    if (headers[column_number].getAttribute('data-sort-order') == "desc") {
        dir = "asc";
        sorted = true
    }

    for (var j = 0; j < headers.length; j++) {
        headers[j].setAttribute('data-sort-order', "");
    }
    headers[column_number].setAttribute('data-sort-order', dir);

    rows = Array.from(table.getElementsByTagName("TR"));
    values = [null]
    for (i = 1; i < rows.length; i++) {
        x = rows[i].getElementsByTagName("TD")[column_number]
        switch (type) {
            case "string":
                values.push(x.innerHTML.toLowerCase())
                break
            case "id":
                values.push(x.firstChild.innerHTML.toLowerCase())
                break
            case "number":
                values.push(Number(x.innerHTML))
                break
        }
    }

    if (sorted) {
        rows = rows.reverse()
        rows.splice(0, 0, rows[rows.length - 1])
        rows.pop()
        switching = false
    } else {
        switching = true
    }

    while (switching) {
        switching = false;
        /* Loop through all table rows (except the
        first, which contains table headers): */
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            if (typeof values[i] == "string") {
                if (values[i].localeCompare(values[i + 1], undefined, { numeric: true, sensitivity: "base" }) == 1) {
                    shouldSwitch = true;
                    break;
                }
            } else if (values[i] < values[i + 1]) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            el = rows[i + 1]
            rows.splice(i + 1, 1)
            rows.splice(i, 0, el)
            el = values[i + 1]
            values.splice(i + 1, 1)
            values.splice(i, 0, el)
            //rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
    // Remove old rows and append all new rows
    while (table.lastChild) {
        table.removeChild(table.lastChild);
    }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < rows.length; ++i) {
        frag.appendChild(rows[i]);
    }
    table.appendChild(frag);
}

function Select(id) {
    window.location.href = assets_folder + "/contigs/" + id.replace(':', '-') + ".html";
}

var dragging = false;

function get(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}

var t;
function Setup() {
    if (assets_folder != undefined) {
        var back_button = document.getElementById("back-button");
        var ref = window.name.split('|').pop();
        if (back_button && ref) {
            back_button.href = ref;
            var id = ref.split('/').pop().split('.')[0].replace(/-/g, ':');
            back_button.innerText = id;
            if (id != assets_folder.replace(/-/g, ':')) back_button.style = "display: inline-block;"
        }

        window.name = window.name + "|" + window.location.href

        if (window.name.split('|').pop().split('/').pop().split('.')[0].replace(/-/g, ':') == assets_folder.replace(/-/g, ':')) window.name = window.location.href;
    }

    if (get('pos')) {
        var pos = parseInt(get('pos'));
        var text = document.getElementsByClassName('aside-seq')[0].innerText;
        document.getElementsByClassName('aside-seq')[0].innerHTML = text.substring(0, pos) + "<span class='highlight'>" + text.substring(pos, pos + 1) + "</span>" + text.substring(pos + 1);
    }

    var elements = document.getElementsByClassName("copy-data")
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener("click", CopyGraphData)
        var example = elements[i].getElementsByClassName("example")[0]
        if (example)
            example.innerHTML = GetGraphDataExample(elements[i]);
    }

    var elements = document.getElementsByClassName("user-help")
    for (var i = 0; i < elements.length; i++) {
        if (!elements[i].classList.contains("copy-data")) {
            elements[i].addEventListener("click", (event) => { event.stopPropagation() })
        }
        elements[i].addEventListener("focusin", openHelp)
        elements[i].addEventListener("focusout", closeHelp)
        elements[i].addEventListener("mouseenter", openHelp)
        elements[i].addEventListener("mouseleave", closeHelp)
    }

    // Highlight the correct nodes and table row on the homepage after clicking on the point graph
    var split = window.location.href.split('#')
    if (split.length == 2) {
        var parts = split[1].split('_');
        var target = parts[parts.length - 1];
        var elements = document.querySelectorAll("[id$=\"" + target + "\"]")
        for (var i = 0; i < elements.length; i++) {
            elements[i].classList.add("highlight");
        }
    }

    SpectrumSetUp()
}

function openHelp(event) {
    var content = event.target.children[1]
    content.classList.add("focus");
    var box = content.getBoundingClientRect()
    if (box.x < 0) {
        content.style.marginLeft = -box.x + "px";
    }
    if (box.right > window.innerWidth) {
        content.style.marginLeft = (window.innerWidth - box.right - 20) + "px";
    }
    if (box.bottom > window.innerHeight) {
        content.style.marginTop = (window.innerHeight - box.bottom) + "px";
    }
}

function closeHelp(event) {
    var content = event.target.children[1]
    content.classList.remove("focus")
}

function pauseEvent(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
}

function GoBack() {
    var history = window.name.split('|');
    history.pop(); //remove current
    var url = history.pop();
    window.name = history.join('|');
    window.location.href = url;
}

function AlignmentDetails(number) {
    AlignmentDetailsClear();
    document.getElementById("alignment-details-" + number).className += " active";
}

function AlignmentDetailsClear() {
    document.getElementById("index-menus").childNodes.forEach(a => a.className = "alignment-details");
}

// Copy the graph data for the clicked on graph
function CopyGraphData(event) {
    var t = event.target;
    if (event.target.classList.contains("mark"))
        t = event.target.parentElement.parentElement;
    if (event.target.classList.contains("copy-data"))
        t = event.target.parentElement;

    var elements = t.getElementsByClassName("graph-data");
    for (var i = 0; i < elements.length; i++) {
        elements[i].select();
        elements[i].setSelectionRange(0, 99999);
        navigator.clipboard.writeText(elements[i].value);
        return;
    }
}

/** Get the first four lines of the data to work as an example of how the data looks.
 * @param {Element} element the .copy-data element to get the example for
*/
function GetGraphDataExample(element) {
    var children = element.children;
    if (element.classList.contains("mark"))
        children = element.parentElement.parentElement.children;
    if (element.classList.contains("copy-data"))
        children = element.parentElement.children;

    var example = undefined;
    for (var i = 0; i < children.length; i++) {
        if (children[i].classList.contains("graph-data")) {
            example = children[i].value.split("\n").slice(0, 4);
            break;
        }
    }

    if (example == undefined) {
        return "No data found";
    } else {
        var output = "";
        for (var line in example) {
            output += example[line].substring(0, Math.min(30, example[line].length)).replace(/ /gi, "<span class='sp'> </span>").replace(/\t/gi, "<span class='tab'>\t</span>")
            if (example[line].length <= 30) {
                output += "<span class='nl'></span>\n";
            } else {
                output += "...\n";
            }
        }
        return output;
    }
}

/* Spectrum viewer code */
function SpectrumSetUp() {
    var elements = document.querySelectorAll(".spectrum .peptide span");
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener("mouseenter", e => { ToggleHighlight(e, false, true) });
        elements[i].addEventListener("mouseleave", e => { ToggleHighlight(e, false, false) });
        elements[i].addEventListener("mouseup", e => { ToggleHighlight(e, true) });
    }
    var elements = document.querySelectorAll(".spectrum .legend .ion");
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener("mouseenter", e => { ToggleHighlight(e, false, true) });
        elements[i].addEventListener("mouseleave", e => { ToggleHighlight(e, false, false) });
        elements[i].addEventListener("mouseup", e => { ToggleHighlight(e, true) });
    }
    var elements = document.querySelectorAll(".spectrum .legend input");
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener("change", SpectrumInputChange);
    }
    var elements = document.querySelectorAll(".spectrum .canvas");
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener("mousedown", spectrumDragStart)
        elements[i].addEventListener("mousemove", spectrumDrag)
        elements[i].addEventListener("mouseup", spectrumDragEnd)
        elements[i].addEventListener("mouseout", spectrumDragOut)

        var d = elements[i].dataset;
        d.minMz = 0;
        d.maxMz = d.initialMaxMz;
        d.maxIntensity = d.initialMaxIntensity;
    }
    var elements = document.querySelectorAll(".spectrum .zoom-out");
    for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener("mousedown", spectrumZoomOut)
    }
}

var highlight;
function ToggleHighlight(event, permanent, start = null) {
    // TODO remaining problem: a peak that should still be highlighted based on an existing permanent highlight can be removed by another highlight rule. 
    // Likely this can only be solved by amassing all rules in a list and evaluating them each time. 
    var t = event.target; // <span> with the sequence
    if (permanent) t.classList.toggle("permanent");
    if (highlight == t && permanent) return;
    if (t.classList.contains("permanent") && !permanent) return;

    highlight = t;
    var container = t.parentElement.parentElement;
    function toggle(element) {
        if (start == true) element.classList.add("highlight");
        else if (start == null) element.classList.toggle("highlight");
        else element.classList.remove("highlight");
    }
    container.querySelectorAll(".canvas").forEach(canvas => {
        if (t.classList.contains("ion")) {
            var cl = t.classList[1];
            var elements = canvas.querySelectorAll("." + cl);
            for (let i = 0; i < elements.length; i++) {
                toggle(elements[i]);
            }
        } else {
            var peaks = canvas.children;
            for (let i = 0; i < peaks.length; i++) {
                if (peaks[i].dataset.pos == t.dataset.pos) {
                    toggle(peaks[i]);
                }
            }
        }
    })

    if (container.classList.contains("wrapper")) container = container.parentElement;
    if (start || container.querySelector(".permanent") != null) {
        container.querySelectorAll(".canvas").forEach(canvas => {
            canvas.classList.add("highlight");
        })
    } else {
        container.querySelectorAll(".canvas").forEach(canvas => {
            canvas.classList.remove("highlight");
        })
    }
}

/** Toggle features on or off in the spectrum (eg background peaks, peak labels) 
 * @param {Event} event 
*/
function SpectrumInputChange(event) {
    if (event.target.type == "checkbox") { // Background
        event.target.parentElement.parentElement.querySelectorAll(".canvas-wrapper").forEach(wrapper => {
            var canvas = wrapper.querySelector(".canvas");
            if (event.target.checked) { // Will be adding all background peaks
                wrapper.classList.add(event.target.className);
                if (canvas.dataset.maxIntensity == canvas.dataset.initialMaxIntensityAssigned) {
                    canvas.dataset.maxIntensity = canvas.dataset.initialMaxIntensity;
                    canvas.style.setProperty("--max-intensity", canvas.dataset.maxIntensity);
                    UpdateSpectrumAxes(canvas)
                }
            } else { // Will be removing all background peaks
                wrapper.classList.remove(event.target.className);
                if (canvas.dataset.maxIntensity == canvas.dataset.initialMaxIntensity) {
                    canvas.dataset.maxIntensity = canvas.dataset.initialMaxIntensityAssigned;
                    canvas.style.setProperty("--max-intensity", canvas.dataset.maxIntensity);
                    UpdateSpectrumAxes(canvas)
                }
            }
        });
    } else if (event.target.type == "range") { // Peak labels
        var ele = document.getElementById(event.target.id + "_value");
        ele.value = event.target.value;
        event.target.parentElement.parentElement.parentElement.querySelectorAll(".canvas").forEach(canvas => SpectrumUpdateLabels(Number(event.target.value), canvas))
    } else if (event.target.type == "number") { // Peak labels
        var ele = document.getElementById(event.target.id.substring(0, event.target.id.length - 6));
        ele.value = event.target.value;
        event.target.parentElement.parentElement.parentElement.querySelectorAll(".canvas").forEach(canvas => SpectrumUpdateLabels(Number(event.target.value), canvas))
    }
}

/** Update the spectrum to only show the label for peaks within the given percentage group 
 * @param {Number} value the percentage to include (0-100) 
 * @param {Element} canvas the canvas to work on
*/
function SpectrumUpdateLabels(value, canvas) {
    var style = window.getComputedStyle(canvas);
    var max = Number(style.getPropertyValue("--max-intensity"));

    var peaks = canvas.children;
    for (let i = 0; i < peaks.length; i++) {
        var v = Number(window.getComputedStyle(peaks[i]).getPropertyValue("--intensity"));
        if (v > max * (100 - value) / 100) {
            peaks[i].classList.add("label");
        } else {
            peaks[i].classList.remove("label");
        }
    }
}

var startPoint;
var selection;
var linked_selection;
function spectrumDragStart(event) {
    if (event.target.classList.contains("canvas")) {
        event.target.classList.add("dragging")
        startPoint = event.offsetX;
        selection = event.target.querySelector(".selection");
        selection.hidden = false;
        var wrapper = event.target.parentElement.parentElement;
        if (wrapper.classList.contains("first")) {
            linked_selection = wrapper.parentElement.querySelector(".selection.second")
        } else if (wrapper.classList.contains("second")) {
            linked_selection = wrapper.parentElement.querySelector(".selection.first")
        }
        if (linked_selection != undefined) linked_selection.hidden = false;
        updateSelections(startPoint, event.offsetY, 0);
    }
}

function updateSelections(offsetX, offsetY, width) {
    if (selection != undefined) updateSelection(selection, offsetX, offsetY, width);
    if (linked_selection != undefined) updateSelection(linked_selection, offsetX, offsetY, width);
}

function updateSelection(select, offsetX, offsetY, width) {
    select.style.setProperty("left", offsetX + "px")
    select.style.setProperty("width", width + "px")
    select.style.setProperty("height", select.parentElement.getBoundingClientRect().height - offsetY + "px")

    if (select.classList.contains("first")) {
        select.style.setProperty("top", offsetY + "px")
    } else {
        select.style.setProperty("bottom", offsetY + "px")
    }
}

function spectrumDrag(event) {
    if (startPoint != undefined) {
        var offsetY = event.offsetY;
        if (selection.classList.contains("second")) offsetY = event.target.getBoundingClientRect().height - offsetY;
        updateSelections(Math.min(event.offsetX, startPoint), offsetY, Math.abs(event.offsetX - startPoint))
    }
}

function spectrumDragOut(event) {
    if (selection != undefined) selection.hidden = true;
    if (linked_selection != undefined) linked_selection.hidden = true;
    selection = undefined
    linked_selection = undefined
    startPoint = undefined

    document.querySelectorAll(".canvas.dragging").forEach(e => e.classList.remove("dragging"));
}

function spectrumDragEnd(event) {
    var canvas = event.target;
    if (canvas.classList.contains("canvas") && startPoint != undefined) {
        var d = canvas.dataset;
        var box = canvas.getBoundingClientRect();
        var width = box.width;
        var height = box.height;
        var min = Math.min(startPoint, event.offsetX) / width;
        var max = Math.max(startPoint, event.offsetX) / width;
        var minMz = Number(d.minMz);
        var maxMz = Number(d.maxMz);
        var maxIntensity = Number(d.maxIntensity);
        var min = min * Math.max(1, maxMz - minMz) + minMz;
        var max = max * Math.max(1, maxMz - minMz) + minMz;
        var offsetY = event.offsetY;
        if (selection.classList.contains("second")) offsetY = height - offsetY;
        var maxI = (1 - Math.max(0, offsetY / height));

        Zoom(canvas, min, max, maxI);
        if (linked_selection != undefined) Zoom(linked_selection.parentElement, min, max, maxI);
        spectrumDragOut(event)
    }
}

function Zoom(canvas, min, max, maxI) {
    canvas.classList.add("zoomed");
    canvas.dataset.minMz = min;
    canvas.dataset.maxMz = max;
    canvas.dataset.maxIntensity = maxI * canvas.dataset.maxIntensity;
    canvas.style.setProperty("--min-mz", min);
    canvas.style.setProperty("--max-mz", max);
    canvas.style.setProperty("--max-intensity", canvas.dataset.maxIntensity);

    UpdateSpectrumAxes(canvas)
}

function spectrumZoomOut(event) {
    event.target.parentElement.parentElement.parentElement.parentElement.querySelectorAll(".canvas").forEach(canvas => {
        var d = canvas.dataset;
        d.minMz = 0;
        d.maxMz = d.initialMaxMz;
        d.maxIntensity = d.initialMaxIntensity;
        canvas.style.setProperty("--min-mz", 0);
        canvas.style.setProperty("--max-mz", d.initialMaxMz);
        canvas.style.setProperty("--max-intensity", d.initialMaxIntensity);
        canvas.classList.remove("zoomed");

        UpdateSpectrumAxes(canvas)
    });
}

// Give the canvas element
function UpdateSpectrumAxes(canvas) {
    // Update x-axis
    var axis = canvas.parentElement.getElementsByClassName("x-axis")[0];
    var ticks = axis.children;
    var min = Number(canvas.dataset.minMz);
    var max = Number(canvas.dataset.maxMz);
    var factor = max - min < 5 ? 100 : max - min < 50 ? 10 : 1;
    for (let i = 0; i < ticks.length; i++) {
        ticks[i].innerText = Math.round((min + i / 4 * (max - min)) * factor) / factor;
    }

    // Update y-axis
    var axis = canvas.parentElement.getElementsByClassName("y-axis")[0];
    var ticks = axis.children;
    var max = Number(canvas.dataset.maxIntensity);
    for (let i = 0; i < ticks.length; i++) {
        if (i == 0)
            ticks[i].innerText = "0";
        else
            ticks[i].innerText = Math.round(i / 4 * (max)).toExponential(2);
    }

    var peaks = canvas.children;
    for (let i = 0; i < peaks.length; i++) {
        var v = Number(window.getComputedStyle(peaks[i]).getPropertyValue("--intensity"));
        if (v > max) {
            peaks[i].classList.add("cut");
        } else {
            peaks[i].classList.remove("cut");
        }
    }
}