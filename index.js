
let manifest = null;
let isEncodeMode = true;

function toggleMode() {
    isEncodeMode = !isEncodeMode;
    const toggleText = document.querySelector('.toggle-text');
    const encodeSection = document.getElementById('encode-section');
    const decodeSection = document.getElementById('decode-section');
    const title = document.querySelector('.title h1');

    if (isEncodeMode) {
        toggleText.textContent = 'Encode Mode';
        encodeSection.style.display = 'flex';
        decodeSection.style.display = 'none';
        title.textContent = 'Lua Base64 Encoder';
    } else {
        toggleText.textContent = 'Decode Mode';
        encodeSection.style.display = 'none';
        decodeSection.style.display = 'flex';
        title.textContent = 'Lua Base64 Decoder';
    }
}

async function loadManifest() {
    try {
        const res = await fetch('index.json');
        return await res.json();
    } catch (error) {
        console.error("Error loading manifest:", error);
        return { defs: [], units: [] };
    }
}


async function initializePage() {
    manifest = await loadManifest();

    const defsDropdown = document.getElementById('defs-dropdown');
    const unitsDropdown = document.getElementById('units-dropdown');

    defsDropdown.innerHTML = '<option value="custom" selected>--Custom Tweaks--</option>';
    unitsDropdown.innerHTML = '<option value="custom" selected>--Custom Tweaks--</option>';

    manifest.defs.forEach(url => {
        const fileName = extractFileName(url);
        defsDropdown.innerHTML += `<option value="${url}">${fileName}</option>`;
    });

    manifest.units.forEach(url => {
        const fileName = extractFileName(url);
        unitsDropdown.innerHTML += `<option value="${url}">${fileName}</option>`;
    });

    defsDropdown.addEventListener('change', () => {
        if (defsDropdown.value === 'custom') {
            showCustomInput('defs');
        } else {
            loadTweakDef(defsDropdown.value);
        }
    });

    unitsDropdown.addEventListener('change', () => {
        if (unitsDropdown.value === 'custom') {
            showCustomInput('units');
        } else {
            loadTweakUnit(unitsDropdown.value);
        }
    });
}

function extractFileName(url) {
    if (!url.startsWith('http')) {
        return url;
    }

    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
}

function showCustomInput(type) {
    const boxId = `${type}-custom`;
    const title = type === 'defs' ? 'Custom Tweakdef' : 'Custom Tweakunit';

    document.getElementById(`${type}-box`).innerHTML = `
                <div class="tweak-box">
                    <div class="tweak-title">${title}</div>
                    <label class="small-label" for="${boxId}-input">Enter your code:</label>
                    <textarea id="${boxId}-input" class="code-editor" placeholder="Paste your Lua code here"></textarea>
                    <br>
                    <button onclick="compressAndShow${type === 'defs' ? 'Def' : 'Unit'}('${boxId}')">Minify & Convert</button>
                <div class="output-group">
                    <label class="small-label" for="${boxId}-compressed">Minified Output:</label>
                    <textarea id="${boxId}-compressed"></textarea>
                    <button onclick="copyToClipboard('${boxId}-compressed')" class="copy-btn">Copy</button>
                    <button onclick="convertCompressedToBase64('${boxId}-compressed', '${boxId}-base64')" class="convert-btn">Convert to Base64</button>
                </div>
                    <div class="output-group">
                        <label class="small-label" for="${boxId}-base64">Base64 Output:</label>
                        <textarea id="${boxId}-base64"></textarea>
                        <button onclick="copyToClipboard('${boxId}-base64')" class="copy-btn">Copy</button>
                    </div>
                </div>
            `;
}

function convertCompressedToBase64(compressedId, base64Id) {
    const compressed = document.getElementById(compressedId).value;
    const base64 = btoa(unescape(encodeURIComponent(compressed))).replace(/=+$/, '');
    document.getElementById(base64Id).value = base64;
}

function decodeBase64() {
    const base64Input = document.getElementById('decode-input').value;
    try {
        let paddedBase64 = base64Input;
        while (paddedBase64.length % 4 !== 0) {
            paddedBase64 += '=';
        }

        const decoded = decodeURIComponent(escape(atob(paddedBase64)));
        document.getElementById('decode-output').value = decoded;
        document.getElementById('beautified-output').value = '';
    } catch (error) {
        document.getElementById('decode-output').value = `Error decoding Base64: ${error.message}`;
    }
}

async function loadTweakDef(url) {
    if (!url || url === 'custom') {
        document.getElementById('defs-box').innerHTML = '';
        return;
    }

    const text = await fetch(url).then(r => r.text());
    const fileName = extractFileName(url);
    const boxId = `defs-${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    document.getElementById('defs-box').innerHTML = `
        <div class="tweak-box">
            <div class="tweak-title">${fileName}</div>
            <label class="small-label" for="${boxId}-input">Raw Content:</label>
            <textarea id="${boxId}-input" class="code-editor">${text}</textarea>
            <br>
            <button onclick="compressAndShowDef('${boxId}')">Minify & Convert</button>
            <div class="output-group">
                <label class="small-label" for="${boxId}-compressed">Minified Output:</label>
                <textarea id="${boxId}-compressed"></textarea>
                <button onclick="copyToClipboard('${boxId}-compressed')" class="copy-btn">Copy</button>
                <button onclick="convertCompressedToBase64('${boxId}-compressed', '${boxId}-base64')" class="convert-btn">Convert to Base64</button>
            </div>
            <div class="output-group">
                <label class="small-label" for="${boxId}-base64">Base64 Output:</label>
                <textarea id="${boxId}-base64"></textarea>
                <button onclick="copyToClipboard('${boxId}-base64')" class="copy-btn">Copy</button>
            </div>
        </div>
    `;
}

async function loadTweakUnit(url) {
    if (!url || url === 'custom') {
        document.getElementById('units-box').innerHTML = '';
        return;
    }

    const text = await fetch(url).then(r => r.text());
    const fileName = extractFileName(url);
    const boxId = `units-${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;

    document.getElementById('units-box').innerHTML = `
        <div class="tweak-box">
            <div class="tweak-title">${fileName}</div>
            <label class="small-label" for="${boxId}-input">Raw Content:</label>
            <textarea id="${boxId}-input">${text}</textarea>
            <br>
            <button onclick="compressAndShowUnit('${boxId}')">Minify & Convert</button>
            <div class="output-group">
                <label class="small-label" for="${boxId}-compressed">Minified Output:</label>
                <textarea id="${boxId}-compressed"></textarea>
                <button onclick="copyToClipboard('${boxId}-compressed')" class="copy-btn">Copy</button>
                <button onclick="convertCompressedToBase64('${boxId}-compressed', '${boxId}-base64')" class="convert-btn">Convert to Base64</button>
            </div>
            <div class="output-group">
                <label class="small-label" for="${boxId}-base64">Base64 Output:</label>
                <textarea id="${boxId}-base64"></textarea>
                <button onclick="copyToClipboard('${boxId}-base64')" class="copy-btn">Copy</button>
            </div>
        </div>
    `;
}

function compressAndShowDef(boxId) {
    const input = document.getElementById(`${boxId}-input`).value;
    const lines = input.split('\n');
    let comments = [];
    let codeLines = [];
    for (let line of lines) {
        if (line.trim().startsWith('--')) {
            comments.push(line);
        } else if (line.trim() !== '') {
            codeLines.push(line);
        }
    }
    let code = codeLines.join(' ')
        .replace(/\s*([,={}()])\s*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
    let compressed = comments.join('\n') + '\n' + code;
    document.getElementById(`${boxId}-compressed`).value = compressed;

    let base64 = btoa(unescape(encodeURIComponent(compressed))).replace(/=+$/, '');
    document.getElementById(`${boxId}-base64`).value = base64;
}

function compressAndShowUnit(boxId) {
    const input = document.getElementById(`${boxId}-input`).value;
    let lines = input.split('\n');
    let out = [];
    let inReturn = false;
    let buffer = '';
    for (let line of lines) {
        if (line.trim().startsWith('--')) {
            out.push(line);
        } else if (line.includes('return')) {
            inReturn = true;
            buffer += line.replace(/return\s*/, '');
        } else if (inReturn) {
            buffer += line;
        }
    }
    buffer = buffer.trim();
    if (buffer.startsWith('{')) buffer = buffer.slice(1);
    if (buffer.endsWith('}')) buffer = buffer.slice(0, -1);

    let compressed = '';
    let inQuote = false;
    for (let i = 0; i < buffer.length; i++) {
        let c = buffer[i];
        if (c === "'") {
            inQuote = !inQuote;
            compressed += c;
        } else if (inQuote) {
            compressed += c;
        } else if (c === ' ' || c === '\n' || c === '\t') {
        } else {
            compressed += c;
        }
    }
    let final = out.join('\n') + '\n{' + compressed + '}';
    document.getElementById(`${boxId}-compressed`).value = final;

    let base64 = btoa(unescape(encodeURIComponent(final))).replace(/=+$/, '');
    document.getElementById(`${boxId}-base64`).value = base64;
}

function copyToClipboard(id) {
    const textarea = document.getElementById(id);
    textarea.select();
    document.execCommand('copy');

    const btn = textarea.nextElementSibling;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 1500);
}

function beautifyLua(sourceId, targetId) {
    const code = document.getElementById(sourceId).value;
    const beautifyType = document.getElementById('beautify-type').value;
    let beautified = '';

    if (beautifyType === 'tweakunit') {
        beautified = beautifyTweakunit(code);
    } else {
        beautified = beautifyTweakdef(code);
    }

    document.getElementById(targetId).value = beautified;
}

function beautifyTweakdef(code) {
    const lines = code.split('\n');
    const comments = [];
    let codeStart = 0;
    while (codeStart < lines.length && lines[codeStart].trim().startsWith('--')) {
        comments.push(lines[codeStart]);
        codeStart++;
    }
    const codePart = lines.slice(codeStart).join('\n').trim();

    let beautifiedCode = '';
    let indentLevel = 0;
    let inQuote = false;
    let quoteChar = '';
    let escapeNext = false;

    for (let i = 0; i < codePart.length; i++) {
        const char = codePart[i];

        if (escapeNext) {
            beautifiedCode += char;
            escapeNext = false;
            continue;
        }

        if (inQuote) {
            beautifiedCode += char;
            if (char === '\\') {
                escapeNext = true;
            } else if (char === quoteChar) {
                inQuote = false;
            }
            continue;
        }

        if (char === '"' || char === "'") {
            inQuote = true;
            quoteChar = char;
            beautifiedCode += char;
            continue;
        }

        if (char === '{' || char === '(') {
            beautifiedCode += char + '\n' + '  '.repeat(++indentLevel);
        } else if (char === '}' || char === ')') {
            beautifiedCode = beautifiedCode.trimEnd();
            beautifiedCode += '\n' + '  '.repeat(--indentLevel) + char;
        } else if (char === ',') {
            beautifiedCode += char + '\n' + '  '.repeat(indentLevel);
        } else if (char === ';') {
            beautifiedCode += char + '\n' + '  '.repeat(indentLevel);
        } else {
            beautifiedCode += char;
        }
    }

    beautifiedCode = beautifiedCode
        .replace(/\n\s*\n/g, '\n')
        .replace(/\{\s*\n\s*\}/g, '{}')
        .replace(/\(\s*\n\s*\)/g, '()');

    return comments.join('\n') + (comments.length ? '\n' : '') + beautifiedCode;
}

function beautifyTweakunit(code) {
    const lines = code.split('\n');
    const comments = [];
    let codeStart = 0;
    while (codeStart < lines.length && lines[codeStart].trim().startsWith('--')) {
        comments.push(lines[codeStart]);
        codeStart++;
    }
    const codePart = lines.slice(codeStart).join('\n').trim();

    let beautifiedCode = '';
    let indentLevel = 0;
    let inQuote = false;
    let quoteChar = '';
    let escapeNext = false;
    let hasReturn = false;

    for (let i = 0; i < codePart.length; i++) {
        const char = codePart[i];

        if (escapeNext) {
            beautifiedCode += char;
            escapeNext = false;
            continue;
        }

        if (inQuote) {
            beautifiedCode += char;
            if (char === '\\') {
                escapeNext = true;
            } else if (char === quoteChar) {
                inQuote = false;
            }
            continue;
        }

        if (char === '"' || char === "'") {
            inQuote = true;
            quoteChar = char;
            beautifiedCode += char;
            continue;
        }

        if (char === '{' && !hasReturn) {
            beautifiedCode += 'return {\n' + '  '.repeat(++indentLevel);
            hasReturn = true;
            continue;
        }

        if (char === '{') {
            beautifiedCode += char + '\n' + '  '.repeat(++indentLevel);
        } else if (char === '}') {
            beautifiedCode = beautifiedCode.trimEnd();
            beautifiedCode += '\n' + '  '.repeat(--indentLevel) + char;
        } else if (char === ',') {
            beautifiedCode += char + '\n' + '  '.repeat(indentLevel);
        } else if (char === ';') {
            beautifiedCode += char + '\n' + '  '.repeat(indentLevel);
        } else {
            beautifiedCode += char;
        }
    }

    beautifiedCode = beautifiedCode
        .replace(/\n\s*\n/g, '\n')
        .replace(/\{\s*\n\s*\}/g, '{}')
        .replace(/return\s+\{/, 'return {');

    return comments.join('\n') + (comments.length ? '\n' : '') + beautifiedCode;
}

initializePage();
