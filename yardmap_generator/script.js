let COLS = 24;
let ROWS = 24;
const POOL = ['s', 'o', 'b', 'c'];

function getMirrorPositions(row, col) {
    const centerR = (ROWS - 1) / 2;
    const centerC = (COLS - 1) / 2;

    const r0 = row, c0 = col;

    const r90 = col;
    const c90 = ROWS - 1 - row;

    const r180 = ROWS - 1 - row;
    const c180 = COLS - 1 - col;

    const r270 = COLS - 1 - col;
    const c270 = row;

    return [
        { row: r0, col: c0, idx: r0 * COLS + c0 },
        { row: r90, col: c90, idx: r90 * COLS + c90 },
        { row: r180, col: c180, idx: r180 * COLS + c180 },
        { row: r270, col: c270, idx: r270 * COLS + c270 }
    ];
}

function verifySymmetry(grid) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const positions = getMirrorPositions(r, c);
            const char = grid[positions[0].idx];

            for (let i = 1; i < positions.length; i++) {
                if (grid[positions[i].idx] !== char) {
                    return false;
                }
            }
        }
    }
    return true;
}

function generateSymmetricYardmap() {
    const grid = new Array(ROWS * COLS);
    let attempts = 0;
    const maxAttempts = 50;

    const restrictedPool = POOL.filter(ch => ch !== 's');

    while (attempts < maxAttempts) {
        attempts++;

        const processed = new Set();

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const idx = r * COLS + c;
                if (processed.has(idx)) continue;

                const positions = getMirrorPositions(r, c);

                const char = randChoice(restrictedPool);

                for (const pos of positions) {
                    grid[pos.idx] = char;
                    processed.add(pos.idx);
                }
            }
        }

        if (verifySymmetry(grid)) {
            grid.isSymmetric = true;
            return grid;
        }
    }

    grid.isSymmetric = true;
    return grid;
}

function generateSymmetricYardmapWithOverlap(prevGrid) {
    const grid = new Array(ROWS * COLS);
    let bestGrid = null;
    let minChanges = Infinity;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
        attempts++;

        const processed = new Set();
        let currentChanges = 0;

        let generationFailed = false;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const idx = r * COLS + c;
                if (processed.has(idx)) continue;

                const positions = getMirrorPositions(r, c);

                let allowedChars = [...POOL];
                for (const pos of positions) {
                    const allowedAtPos = allowedNewChars(prevGrid[pos.idx]);
                    allowedChars = allowedChars.filter(ch => allowedAtPos.includes(ch));
                }

                if (allowedChars.length > 0) {
                    const prevChar = prevGrid[positions[0].idx];
                    let char;

                    if (allowedChars.includes(prevChar)) {
                        const charCounts = {};
                        for (const ch of prevGrid) {
                            charCounts[ch] = (charCounts[ch] || 0) + 1;
                        }
                        const prevCharRatio = charCounts[prevChar] / prevGrid.length;

                        let keepProbability = 0.7;
                        if (prevCharRatio > 0.4) {
                            keepProbability = 0.3;
                        } else if (prevCharRatio > 0.3) {
                            keepProbability = 0.5;
                        }

                        char = (Math.random() < keepProbability) ? prevChar : randChoice(allowedChars);
                    } else {
                        char = randChoice(allowedChars);
                    }

                    if (char !== prevChar) {
                        currentChanges += positions.length;
                    }

                    for (const pos of positions) {
                        grid[pos.idx] = char;
                        processed.add(pos.idx);
                    }
                } else {
                    generationFailed = true;
                    break;
                }
            }
            if (generationFailed) break;
        }

        if (generationFailed) continue;

        let allOverlapValid = true;
        for (let idx = 0; idx < ROWS * COLS; idx++) {
            if (!canOverlap(grid[idx], prevGrid[idx])) {
                allOverlapValid = false;
                break;
            }
        }

        if (allOverlapValid && verifySymmetry(grid)) {
            if (!hasMinimumDiversity(grid)) {
                continue;
            }

            if (currentChanges < minChanges) {
                minChanges = currentChanges;
                bestGrid = [...grid];
                bestGrid.isSymmetric = true;
                bestGrid.changeCount = currentChanges;
            }

            if (currentChanges < (ROWS * COLS) * 0.15) {
                bestGrid.isSymmetric = true;
                return bestGrid;
            }
        }
    }

    if (bestGrid) {
        return bestGrid;
    }

    grid.isSymmetric = true;
    return grid;
}

function canOverlap(newChar, prevChar) {
    if (newChar === 's') return true;
    if (newChar === 'o') return (prevChar === 'b' || prevChar === 'c');
    if (newChar === 'b') return (prevChar === 'b' || prevChar === 'c');
    if (newChar === 'c') return (prevChar === 'c');
    return false;
}

function allowedNewChars(prevChar) {
    const allowed = POOL.filter(ch => canOverlap(ch, prevChar));
    return allowed.length ? allowed : [prevChar];
}

function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function gridToString(grid) {
    return grid.join('');
}

function gridsAreIdentical(grid1, grid2) {
    if (grid1.length !== grid2.length) return false;
    for (let i = 0; i < grid1.length; i++) {
        if (grid1[i] !== grid2[i]) return false;
    }
    return true;
}

function hasMinimumDiversity(grid) {
    const counts = {};
    const totalCells = grid.length;

    for (const ch of grid) {
        counts[ch] = (counts[ch] || 0) + 1;
    }

    const maxAllowedCount = totalCells * 0.6;
    for (const count of Object.values(counts)) {
        if (count > maxAllowedCount) {
            return false;
        }
    }

    return Object.keys(counts).length >= 2;
}

function generateYardmap() {
    const grid = [];

    for (let c = 0; c < COLS; c++) {
        grid[c] = randChoice(POOL);
    }

    const middleRow = [];
    for (let c = 0; c < COLS; c++) {
        middleRow.push(randChoice(POOL));
    }

    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS; c++) {
            grid[r * COLS + c] = middleRow[c];
        }
    }

    const lastRowStart = (ROWS - 1) * COLS;
    for (let c = 0; c < COLS; c++) {
        grid[lastRowStart + c] = randChoice(POOL);
    }

    grid.isSymmetric = false;
    return grid;
}

function generateVersions(n, symmetryEnabled = false) {
    const versions = [];
    let prevGrid = null;
    const maxRetriesPerVersion = 50;

    for (let v = 0; v < n; v++) {
        let grid = null;
        let isUnique = false;
        let retries = 0;

        while (!isUnique && retries < maxRetriesPerVersion) {
            retries++;

            if (prevGrid === null) {
                if (symmetryEnabled) {
                    grid = generateSymmetricYardmap();
                } else {
                    grid = generateYardmap();
                }
            } else {
                if (symmetryEnabled) {
                    grid = generateSymmetricYardmapWithOverlap(prevGrid);
                } else {
                    grid = generateYardmapWithOverlap(prevGrid);
                }
            }

            isUnique = true;
            for (const existingGrid of versions) {
                if (gridsAreIdentical(grid, existingGrid)) {
                    isUnique = false;
                    break;
                }
            }
        }

        if (!isUnique) {
            console.log(`Could not generate unique version ${v + 1} after ${maxRetriesPerVersion} attempts. Stopping at ${versions.length} unique versions.`);
            break;
        }

        versions.push(grid);
        prevGrid = grid;
    }

    return versions;
}

function generateYardmapWithOverlap(prevGrid) {
    const grid = [];

    for (let c = 0; c < COLS; c++) {
        const prevChar = prevGrid[c];
        const allowedChars = allowedNewChars(prevChar);
        grid[c] = randChoice(allowedChars);
    }

    const middleRow = [];
    for (let c = 0; c < COLS; c++) {
        const prevChar = prevGrid[1 * COLS + c];
        const allowedChars = allowedNewChars(prevChar);
        middleRow.push(randChoice(allowedChars));
    }

    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS; c++) {
            grid[r * COLS + c] = middleRow[c];
        }
    }

    const lastRowStart = (ROWS - 1) * COLS;
    const prevLastRowStart = (ROWS - 1) * COLS;
    for (let c = 0; c < COLS; c++) {
        const prevChar = prevGrid[prevLastRowStart + c];
        const allowedChars = allowedNewChars(prevChar);
        grid[lastRowStart + c] = randChoice(allowedChars);
    }

    grid.isSymmetric = false;
    return grid;
}

function gridToString(grid) {
    return grid.join('');
}

function compressYardmap(grid) {
    if (grid.isSymmetric) {
        const halfRows = Math.ceil(ROWS / 2);
        const halfCols = Math.ceil(COLS / 2);

        let quadrant = '';
        for (let r = 0; r < halfRows; r++) {
            for (let c = 0; c < halfCols; c++) {
                const idx = r * COLS + c;
                quadrant += grid[idx];
            }
        }

        return `r4("${quadrant}", ${halfRows}, ${halfCols})`;
    }

    const fullStr = gridToString(grid);

    const rows = [];
    for (let r = 0; r < ROWS; r++) {
        rows.push(fullStr.substring(r * COLS, (r + 1) * COLS));
    }

    const firstRow = rows[0];
    const lastRow = rows[ROWS - 1];
    const middleRow = rows[1];

    let repeatCount = 0;
    for (let r = 1; r < ROWS - 1; r++) {
        if (rows[r] === middleRow) {
            repeatCount++;
        } else {
            break;
        }
    }

    if (repeatCount > 1) {
        return `"h ${firstRow}"\n\t.. s("${middleRow}", ${repeatCount})\n\t.. "${lastRow}"`;
    }

    return `"h ${fullStr}"`;
}

function renderOverlay(versions) {
    const container = document.createElement('div');
    container.className = 'overlay-container';

    const title = document.createElement('div');
    title.className = 'overlay-title';
    title.textContent = 'Version Overlays';
    container.appendChild(title);

    for (let i = 0; i < versions.length - 1; i++) {
        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'overlay';

        const overlayLabel = document.createElement('div');
        overlayLabel.className = 'overlay-label';
        overlayLabel.textContent = `Version ${i + 1} (bottom) overlaid with Version ${i + 2} (top)`;
        overlayDiv.appendChild(overlayLabel);

        const grid = document.createElement('div');
        grid.className = 'overlay-grid';

        const currVersion = versions[i];
        const nextVersion = versions[i + 1];

        for (let idx = 0; idx < COLS * ROWS; idx++) {
            const cell = document.createElement('div');
            cell.className = 'overlay-cell';

            const currChar = currVersion[idx];
            const nextChar = nextVersion[idx];

            const currSpan = document.createElement('span');
            currSpan.className = `overlay-char char-${currChar}`;
            currSpan.textContent = currChar;
            currSpan.style.opacity = '0.4';

            const nextSpan = document.createElement('span');
            nextSpan.className = `overlay-char char-${nextChar}`;
            nextSpan.textContent = nextChar;
            nextSpan.style.opacity = '1';

            cell.appendChild(currSpan);
            cell.appendChild(nextSpan);

            grid.appendChild(cell);
        }

        overlayDiv.appendChild(grid);
        container.appendChild(overlayDiv);
    }

    return container;
}
function renderYardmap(grid, versionNum) {
    const container = document.createElement('div');
    container.className = 'yardmap-container';

    const versionLabel = document.createElement('div');
    versionLabel.className = 'version-label';
    let labelText = `Version ${versionNum}`;
    if (grid.isSymmetric) {
        labelText += ' ✓ Symmetric';
        versionLabel.classList.add('symmetric-indicator');
    }
    if (grid.changeCount !== undefined) {
        const totalCells = ROWS * COLS;
        const changePercent = ((grid.changeCount / totalCells) * 100).toFixed(1);
        labelText += ` | ${grid.changeCount} changes (${changePercent}%)`;
    }
    versionLabel.textContent = labelText;
    container.appendChild(versionLabel);

    const gridEl = document.createElement('div');
    gridEl.className = 'yardmap-grid';
    gridEl.style.gridTemplateColumns = `repeat(${COLS}, 20px)`;
    let selectedCells = new Set();

    grid.forEach((ch, idx) => {
        const cell = document.createElement('div');
        cell.className = `yardmap-cell ch-${ch}`;
        cell.textContent = ch;
        cell.dataset.idx = idx;
        cell.dataset.row = Math.floor(idx / COLS);
        cell.dataset.col = idx % COLS;

        cell.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (selectedCells.has(idx)) {
                    selectedCells.delete(idx);
                    cell.classList.remove('selected');
                } else {
                    selectedCells.add(idx);
                    cell.classList.add('selected');
                }
                updateOutput();
            }
        });

        gridEl.appendChild(cell);
    });

    container.appendChild(gridEl);

    const outputDiv = document.createElement('div');
    outputDiv.className = 'yardmap-output';
    const outputLabel = document.createElement('div');
    outputLabel.className = 'yardmap-output-label';
    outputLabel.textContent = 'Yardmap String (compressed format):';
    outputDiv.appendChild(outputLabel);

    const outputText = document.createElement('div');
    outputText.className = 'yardmap-output-text';
    outputText.textContent = compressYardmap(grid);
    outputDiv.appendChild(outputText);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy String';
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(outputText.textContent);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy String'; }, 1500);
    });
    outputDiv.appendChild(copyBtn);

    container.appendChild(outputDiv);

    function updateOutput() {
        if (selectedCells.size === 0) {
            outputText.textContent = compressYardmap(grid);
        } else {
            const selectedStr = Array.from(selectedCells).sort((a, b) => a - b).map(i => grid[i]).join('');
            outputText.textContent = selectedStr;
        }
    }

    return container;
}



document.getElementById('genBtn').addEventListener('click', () => {
    const footprintRows = parseInt(document.getElementById('rowsInput').value, 10);
    const footprintCols = parseInt(document.getElementById('colsInput').value, 10);

    if (footprintRows < 2 || footprintRows > 24 || footprintCols < 2 || footprintCols > 24) {
        alert('Please enter valid footprint dimensions (2-24 for both rows and columns)');
        return;
    }

    ROWS = footprintRows * 2;
    COLS = footprintCols * 2;

    const n = parseInt(document.getElementById('numVersions').value, 10);
    const symmetryEnabled = document.getElementById('symmetryToggle').checked;
    const versions = generateVersions(n, symmetryEnabled);
    const out = document.getElementById('output');
    out.innerHTML = '';

    if (versions.length < n) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'version-warning';
        warningDiv.style.cssText = 'background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 20px; color: #92400e; font-weight: bold;';
        warningDiv.textContent = `⚠️ Only ${versions.length} unique version${versions.length !== 1 ? 's' : ''} generated (requested ${n}). The ${ROWS / 2}×${COLS / 2} footprint has reached its maximum unique version capacity with current overlap constraints.`;
        out.appendChild(warningDiv);
    }

    versions.forEach((grid, idx) => {
        out.appendChild(renderYardmap(grid, idx + 1));
    });

    const copyAllSection = document.getElementById('copyAllSection');
    const combinedText = document.getElementById('combinedOutput');
    const copyAllBtn = document.getElementById('copyAllBtn');

    const allYardmaps = versions.map((grid, idx) => {
        const compressed = compressYardmap(grid);
        return `[${idx + 1}] = ${compressed},`;
    }).join('\n');

    combinedText.textContent = allYardmaps;
    copyAllSection.style.display = 'block';

    copyAllBtn.textContent = 'Copy All Yardmaps';

    const newCopyAllBtn = copyAllBtn.cloneNode(true);
    copyAllBtn.parentNode.replaceChild(newCopyAllBtn, copyAllBtn);

    newCopyAllBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(allYardmaps).then(() => {
            newCopyAllBtn.textContent = 'Copied!';
            setTimeout(() => {
                newCopyAllBtn.textContent = 'Copy All Yardmaps';
            }, 2000);
        });
    });
}
);