//main.js
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";

hljs.registerLanguage("javascript", javascript);
const notepadWindow = document.querySelector("#notepad-window");
const darkModeButton = document.querySelector("#dark-mode-button");
const writeupButton  = document.querySelector("#writeup-button");
const writeupContent = document.querySelector("#writeup-content");
const writeupList = document.querySelector("#writeup-list");
const notepadTitle = document.querySelector("#notepad-title");
const notepadClose = document.querySelector("#notepad-close");
const payloadWindow = document.querySelector("#payload-window");
const payloadCode = document.querySelector("#payload-code");
const payloadTitle = document.querySelector("#payload-title");
const payloadClose = document.querySelector("#payload-close");
const payloadDragbar = document.querySelector("#payload-dragbar");

const aboutButton = document.querySelector("#about-button");
const toolsButton = document.querySelector("#tools-button");

const aboutContent = document.querySelector("#about-content");
const toolsContent = document.querySelector("#tools-content");



//X button for notepad
notepadClose?.addEventListener("click", () => {
    notepadWindow?.classList.remove("open");
});
//open list of writeups button
writeupButton?.addEventListener("click", () => {
    writeupList?.classList.toggle("open");
});
//button for closing the xploit window
payloadClose?.addEventListener("click", () => {
    payloadWindow?.classList.remove("open");
});
aboutButton?.addEventListener("click", () => {
    openNotepadPage("about.txt", aboutContent);
});

toolsButton?.addEventListener("click", () => {
    openNotepadPage("tools.txt", toolsContent);
});

function openNotepadPage(title, content) {
    if (!notepadWindow || !writeupContent || !content) return;

    writeupContent.innerHTML = content.innerHTML;

    if (notepadTitle) {
        notepadTitle.textContent = ` - ${title}`;
    }

    notepadWindow.classList.add("open");

    centerWindow(notepadWindow);

    writeupList?.classList.remove("open");
    writeupContent.scrollTop = 0;
}

const writeupEntries = document.querySelectorAll(".writeup-entry");

writeupEntries.forEach((button) => {
    button.addEventListener("click", () => {
        const id = button.dataset.writeupId;

        if (!id) return;

        const sources = document.querySelectorAll("[data-writeup-source]");
        const source = Array.from(sources).find(
            (element) => element.dataset.writeupSource === id
        );

        if(!source || !writeupContent) return;

        writeupContent.innerHTML = source.innerHTML;
        writeupContent.scrollTop = 0;

        if (notepadTitle) {
            const filename = id.split("/").pop() ?? id;
            const [, ...nameParts] = filename.split("_");

            const displayName =
                nameParts.length > 0
                    ? nameParts.join("_")
                    : filename;

            notepadTitle.textContent = ` - ${displayName}.md`;
        }

        notepadWindow?.classList.add("open");
        centerWindow(notepadWindow);
        writeupList?.classList.remove("open");
    });
});

//darkmode function
darkModeButton?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    writeupContent?.classList.toggle("writeup-content-dark");
});


// moving of the windows
function makeDraggable(windowElement, dragbar) {
    if (!windowElement || !dragbar) return;

    let dragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startWindowX = 0;
    let startWindowY = 0;

    dragbar.addEventListener("pointerdown", (event) => {
        dragging = true;

        startMouseX = event.clientX;
        startMouseY = event.clientY;

        startWindowX = windowElement.offsetLeft;
        startWindowY = windowElement.offsetTop;

        dragbar.setPointerCapture(event.pointerId);
    });

    dragbar.addEventListener("pointermove", (event) => {
        if (!dragging) return;

        const deltaX = event.clientX - startMouseX;
        const deltaY = event.clientY - startMouseY;

        const newX = startWindowX + deltaX;
        const newY = startWindowY + deltaY;

        windowElement.style.left = `${newX}px`;
        windowElement.style.top = `${Math.max(0, newY)}px`;
    });

    dragbar.addEventListener("pointerup", (event) => {
        dragging = false;

        if (dragbar.hasPointerCapture(event.pointerId)) {
            dragbar.releasePointerCapture(event.pointerId);
        }
    });

    dragbar.addEventListener("pointercancel", () => {
        dragging = false;
    });
}

// center the notepad widnow
function centerWindow(windowElement) {
    if (!windowElement) return;

    const desktop = document.querySelector(".desktop");

    if (!desktop) return;

    const x =
        (desktop.clientWidth - windowElement.offsetWidth) / 2;

    const y =
        (desktop.clientHeight - windowElement.offsetHeight) / 2;

    windowElement.style.left = `${Math.max(0, x)}px`;
    windowElement.style.top = `${Math.max(0, y)}px`;
}

const notepadDragbar = document.querySelector("#notepad-dragbar");

makeDraggable(notepadWindow, notepadDragbar);
makeDraggable(payloadWindow, payloadDragbar);

//source code for payloads
writeupContent?.addEventListener("click", async (event) => {
    const link = event.target.closest(".payload-link");

    if (!link) return;

    event.preventDefault();

    const path = link.dataset.payload;

    if (!path) return;

    const response = await fetch(path);

    if (!response.ok) {
        console.error("Could not load payload:", path);
        return;
    }

    const source = await response.text();
    
    if (payloadCode) {
        payloadCode.innerHTML = hljs.highlight(source, {
            language: "javascript"
        }).value;
    }

    if (payloadTitle) {
        const filename = path.split("/").pop();
        payloadTitle.textContent = filename;
    }

    payloadWindow?.classList.add("open");
});

const categoryButtons = document.querySelectorAll(".category-button");

categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const category = button.closest(".writeup-category");

        category?.classList.toggle("open");
    });
});

