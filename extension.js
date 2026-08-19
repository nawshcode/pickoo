const tab = document.querySelectorAll(".tab");
const content = document.querySelectorAll(".content");
const area = document.getElementById("color-area");
const dot = document.getElementById("dot");
const hueBar = document.getElementById("hue");
const hexBox = document.getElementById("hexBox");
const savedGrid = document.getElementById("saved-colors");
const saveBtn = document.getElementById("saveBtn");
const saveBtn2 = document.getElementById("saveBtn2");

const copybtn1 = document.getElementById("copybtn1");
const copybtn2 = document.getElementById("copybtn2");

const pickBtn = document.getElementById("pickBtn");
const eyeCode = document.getElementById("eyeCode");

const deletebtn = document.getElementById("deletebtn")

tab.forEach(t => {
    t.onclick = () => {
        tab.forEach(x => x.classList.remove("active"));
        content.forEach(c => c.classList.remove("active"));
        t.classList.add("active");
        document.getElementById("tab" + t.dataset.tab).classList.add("active");
    }
})

let hue = 290;
let sat = 100; 
let light = 50;

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r, g, b;

    if (h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (h < 180) {
        [r, g, b] = [0, c, x];
    } else if (h < 240) {
        [r, g, b] = [0, x, c];
    } else if (h < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return "#" +
        r.toString(16).padStart(2, "0") +
        g.toString(16).padStart(2, "0") +
        b.toString(16).padStart(2, "0");
}


function updatehexBox() {
    const hex = hslToHex(hue, sat, light);
    hexBox.innerText = hex;

    hexBox.style.backgroundColor = `${hex}`;
    if (light < 50) {
        hexBox.style.color = "#fff";
    } else {
        hexBox.style.color = "#000";
    }
}

function found(hexval){
    return [...savedGrid.children].some(d => d.textContent == hexval);
}


async function getStoredColors(){
    const data = await chrome.storage.local.get("savedColors");
    return data.savedColors || [];
}

async function addColorToStorage(hexval){
    const colors = await getStoredColors();
    colors.push(hexval);
    await chrome.storage.local.set({ savedColors: colors });
}

async function clearStoredColors(){
    await chrome.storage.local.remove("savedColors");
}

async function removeColorFromStorage(hexval){
    const colors = await getStoredColors();
    const index = colors.indexOf(hexval);
    if (index !== -1) colors.splice(index, 1);
    await chrome.storage.local.set({ savedColors: colors });
}

async function loadSavedColors(){
    const colors = await getStoredColors();
    colors.forEach(hex => createCard(hex));
    deletebtn.style.display = colors.length > 0 ? "block" : "none";
    updateSavebtn(1);
    updateSavebtn(2);
}

area.onmousedown = e => {
    const r = area.getBoundingClientRect();
    function move(ev){
        let x = Math.max(0, Math.min(r.width, ev.clientX - r.left));
        let y = Math.max(0, Math.min(r.height, ev.clientY - r.top));
        dot.style.left= x + "px";
        dot.style.top= y + "px";
        sat = Math.round((x/r.width) *100);
        light = Math.round(100 - (y/r.height)*100);
        updatehexBox();
        updateSavebtn(1);

    }
    move(e);
    onmousemove = move;
    onmouseup = () => onmousemove = null;
    
}

hueBar.onmousedown = e => {
    const r2 = hueBar.getBoundingClientRect();
    function move(e){
        let x = Math.max(0, Math.min(r2.width, e.clientX - r2.left));
        hue = Math.round((x / r2.width) * 360);
        area.style.background = `
            linear-gradient(
                to top,
                #000,
                transparent
            ),
            linear-gradient(
                to right,
                #fff,
                hsl(${hue}, 100%, 50%)
            )
        `;
        updatehexBox();
        updateSavebtn(1);
    }    
    move(e);
    onmousemove = move;
    onmouseup = () => onmousemove = null;
}

function createCard(hexval){
    const d = document.createElement("div");
    d.className = "color-card";
    d.style.background = hexval;
    d.textContent = hexval;
    const light = getLightness(hexval);
    d.style.color = (light < 50) ? "#fff" : "#000";

    const copyIcon = document.createElement("i");
    copyIcon.className = "fa-regular fa-copy copy-icon";
    d.appendChild(copyIcon);
    copyIcon.onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(hexval);
    };

    const deleteIcon = document.createElement("i");
    deleteIcon.className = "fa-regular fa-trash-can delete-icon";
    d.appendChild(deleteIcon);
    deleteIcon.onclick = async (e) => {
        e.stopPropagation();
        d.remove();
        await removeColorFromStorage(hexval);
        updateSavebtn(1);
        updateSavebtn(2);
        deletebtn.style.display = savedGrid.children.length > 0 ? "block" : "none";
    };

    savedGrid.appendChild(d);
}

function updateSavebtn(number){
    if(number == 1){
        saveBtn.textContent = [...savedGrid.children].some(d =>
            d.textContent == hexBox.textContent.slice(0,7)
        ) ? "Saved" : "Save";
    } 
    if (number == 2){
        saveBtn2.textContent = [...savedGrid.children].some(d =>
            d.textContent == eyeCode.textContent.slice(0,7)
        ) ? "Saved" : "Save";
    }
}

function copyfrom(element){
    const hex = element.textContent.slice(0,7);
    navigator.clipboard.writeText(hex);
    element.textContent = `${hex} | Copied`;
}



saveBtn.onclick = async () => {
    const hex = hexBox.textContent.slice(0,7);
    if (found(hex)) return;
    createCard(hex);
    await addColorToStorage(hex);
    updateSavebtn(1);
    deletebtn.style.display = "block";
};


if(eyeCode.textContent == "No colour selected"){
    copybtn2.style.display = "none";
}

function getLightness(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    return ((max + min) / 2) * 100;
}


pickBtn.onclick = async() => {
    if(!window.EyeDropper){
        return alert("Not Supported");
    }
    const tool = new EyeDropper();
    const result = await tool.open();
    
    eyeCode.textContent = result.sRGBHex;
    eyeCode.style.backgroundColor = eyeCode.textContent;

    updateSavebtn(2);

    const light = getLightness(eyeCode.textContent.slice(0, 7)); 
    if (light < 50) {
        eyeCode.style.color = "#fff";
    } else {
        eyeCode.style.color = "#000";
    }

    if(eyeCode.textContent != "No colour selected"){
        saveBtn2.classList.remove("hidden");
        eyeCode.style.width = "90%";
        copybtn2.style.display="block";
    }
    saveBtn2.onclick = async () => {
        const hex = result.sRGBHex;
        if (found(hex)) return;
        createCard(hex);
        await addColorToStorage(hex);
        updateSavebtn(2);
        deletebtn.style.display = "block";
    };
}


copybtn1.onclick = () => copyfrom(hexBox);

copybtn2.onclick = () => copyfrom(eyeCode);

deletebtn.onclick = async () => {
    savedGrid.innerHTML = "";
    deletebtn.style.display = "none";
    updateSavebtn(1);
    updateSavebtn(2);
    await clearStoredColors();
}

deletebtn.style.display = "none";
loadSavedColors();