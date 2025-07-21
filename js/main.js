        let rawOptionsData = [];
        let formOptionsConfig = [];
        let customOptions = [];
        let gameConfigs = { maps: [], modes: [], base: [], scavengers: [] };
        const CUSTOM_TWEAKS_KEY = 'nuttyb-custom-tweaks';
        const mainTweaksPrefixes = [ '!bset tweakdefs ', '!bset tweakunits ' ];
        const evolvingCommandersPrefixes = [ '!bset tweakunits1 ', '!bset tweakunits2 ', '!bset tweakunits3 ' ];
        const extraRaptorsPrefixes = [ '!bset tweakdefs4 ', '!bset tweakunits5 ' ];
        const hiddenLabels = [ 'Slow raptors/scavs' ];
        const defaultSelectedLabels = [ 'Cross Faction T2', 'T3 Eco', 'T3 Builders', 'Unit Launchers', 'LRPC Rebalance v2', 'Legion NuttyB Evolving Commander', 'Armada NuttyB Evolving Commander', 'Cortex NuttyB Evolving Commander' ];
        const rightColumnOrder = [ 'Cross Faction T2', 'T3 Eco', 'T3 Builders', 'Unit Launchers', 'LRPC Rebalance v2' ];
        
        const optionsFormColumns = document.getElementById('options-form-columns');
        const leftColumn = document.getElementById('left-column');
        const rightColumn = document.getElementById('right-column');
        const customSettingsContainer = document.getElementById('custom-settings-container');
        const customLeftColumn = document.getElementById('custom-left-column');
        const customRightColumn = document.getElementById('custom-right-column');
        const slotWarningContainer = document.getElementById('slot-warning-messages');
        const lobbyNameDisplay = document.getElementById('lobby-name-display');
        const copyButtons = document.querySelectorAll('.copy-button');
        const dataTableBody = document.querySelector('#data-table tbody');
        const customTweakForm = document.getElementById('custom-tweak-form');
        const customTweaksTableBody = document.querySelector('#custom-tweaks-table tbody');
        const mapsModesTableBody = document.querySelector('#maps-modes-table tbody');
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        const resetNoneBtn = document.getElementById('reset-none-btn');
        const resetDefaultBtn = document.getElementById('reset-default-btn');
        const MAX_SECTION_LENGTH = 50000;

        // --- Lua Templates and Generator Logic ---
        const luaQhpTemplate = `--NuttyB v1.52 __MULTIPLIER_TEXT__X QHP
-- docs.google.com/spreadsheets/d/1QSVsuAAMhBrhiZdTihVfSCwPzbbZWDLCtXWP23CU0ko
for b, c in pairs(UnitDefs) do
	if b:match('^raptor_queen_.*') then
		c.repairable = false
		c.canbehealed = false
		c.buildtime = 9999999
		c.autoheal = 2
		c.canSelfRepair = false
		c.health = c.health * __HEALTH_MULTIPLIER__
	end
end`;

        const luaHpTemplate = `--NuttyB v1.52 __MULTIPLIER_TEXT__X HP
-- docs.google.com/spreadsheets/d/1QSVsuAAMhBrhiZdTihVfSCwPzbbZWDLCtXWP23CU0ko
for f, g in pairs(UnitDefs) do
	if string.sub(f, 1, 24) == 'raptor_land_swarmer_heal' then
		g.reclaimspeed = 100
		g.stealth = 0
		g.builder = false
		__WORKERTIME_LINE__
		g.canassist = 0
		g.maxthisunit = 0
	end
	if
		g.customparams and g.customparams.subfolder and g.customparams.subfolder == 'other/raptors' and g.health and
			not f:match('^raptor_queen_.*')
	 then
		g.health = __HEALTH_MULTIPLIER__ * g.health
	end
end

local h = UnitDef_Post
function UnitDef_Post(j, k)
	h(j, k)
	if k.customparams and k.customparams.subfolder and k.customparams.subfolder == 'other/raptors' then
		if k then
			__METAL_COST_LINE__
			k.nochasecategory = "OBJECT"
		end
	end
end`;
        
        const luaBossHpTemplate = `--Scav Boss HP __MULTIPLIER_TEXT__X
local originalUnitDef_Post = UnitDef_Post

function UnitDef_Post(unitName, unitDef)
	originalUnitDef_Post(unitName, unitDef)
	if unitDef.health and unitName:match("^scavengerbossv4") then
		unitDef.health = math.floor(unitDef.health * __HEALTH_MULTIPLIER__)
	end
end`;

        const luaScavHpTemplate = `--Scavengers HP __MULTIPLIER_TEXT__X
local originalUnitDef_Post = UnitDef_Post

function UnitDef_Post(unitName, unitDef)
	originalUnitDef_Post(unitName, unitDef)
	if unitDef.health and unitName:match("_scav$") and not unitName:match("^scavengerbossv4") then
		unitDef.health = math.floor(unitDef.health * __HEALTH_MULTIPLIER__)
	end 
	if unitName:match("_scav$") then
		if unitDef.metalcost and type(unitDef.metalcost) == "number" then
 			unitDef.metalcost = math.floor(unitDef.metalcost * __HEALTH_MULTIPLIER__)
    		end
		unitDef.nochasecategory = "OBJECT"
	end
end`;

        function generateLuaTweak(type, multiplierValue) {
            let originalCode;
            
            if (typeof luamin === 'undefined') {
                console.error("luamin library not loaded yet!");
                return "Error: Lib not loaded";
            }

            if (type === 'qhp') { // Raptor Queen HP
                originalCode = luaQhpTemplate
                    .replace(/__MULTIPLIER_TEXT__/g, multiplierValue)
                    .replace(/__HEALTH_MULTIPLIER__/g, multiplierValue);
            } else if (type === 'hp') { // Raptor HP
                const multiplierNum = parseFloat(multiplierValue);
                let metalCostLine, workerTimeLine;
                switch (multiplierNum) {
                    case 2: metalCostLine = 'k.metalcost = math.floor(k.health * .35)'; workerTimeLine = 'g.workertime = g.workertime * 0.65'; break;
                    case 2.5: metalCostLine = 'k.metalcost = math.floor(k.health * .34)'; workerTimeLine = 'g.workertime = g.workertime * 0.6'; break;
                    case 3: metalCostLine = 'k.metalcost = math.floor(k.health * .33)'; workerTimeLine = 'g.workertime = g.workertime * 0.55'; break;
                    case 4: metalCostLine = 'k.metalcost = math.floor(k.health * .25)'; workerTimeLine = 'g.workertime = g.workertime * 0.45'; break;
                    case 5: metalCostLine = 'k.metalcost = math.floor(k.health * .15)'; workerTimeLine = 'g.workertime = g.workertime * 0.25'; break;
                    default: metalCostLine = 'k.metalcost = math.floor(k.metalcost)'; workerTimeLine = 'g.workertime = g.workertime * 0.5'; break;
                }
                originalCode = luaHpTemplate
                    .replace(/__MULTIPLIER_TEXT__/g, multiplierValue)
                    .replace(/__HEALTH_MULTIPLIER__/g, multiplierValue)
                    .replace('__METAL_COST_LINE__', metalCostLine)
                    .replace('__WORKERTIME_LINE__', workerTimeLine);
            } else if (type === 'boss') { // Boss HP
                 originalCode = luaBossHpTemplate
                    .replace(/__MULTIPLIER_TEXT__/g, multiplierValue)
                    .replace(/__HEALTH_MULTIPLIER__/g, multiplierValue);
            } else if (type === 'scav') { // Scavenger HP
                originalCode = luaScavHpTemplate
                    .replace(/__MULTIPLIER_TEXT__/g, multiplierValue)
                    .replace(/__HEALTH_MULTIPLIER__/g, multiplierValue);
            }

            try {
                const firstLineComment = originalCode.split('\n')[0];
                const minifiedCode = luamin.minify(originalCode);
                const finalCodeToEncode = firstLineComment + '\n' + minifiedCode;
                const utf8SafeString = unescape(encodeURIComponent(finalCodeToEncode));
                const base64String = btoa(utf8SafeString);
                return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            } catch (e) {
                console.error(`Lua Minify Error: ${e.message}`);
                return `Error: ${e.message}`;
            }
        }

        function populateStartSelector() {
            const startSelect = document.getElementById('modes-select');
            if (!startSelect) return;

            const originalValue = startSelect.value;
            startSelect.innerHTML = ''; 

            if (gameConfigs && gameConfigs.modes) {
                gameConfigs.modes.forEach((mode, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = mode.name;
                    startSelect.appendChild(option);
                });
                
                if (Array.from(startSelect.options).some(opt => opt.value === originalValue)) {
                    startSelect.value = originalValue;
                } else if (startSelect.options.length > 0) {
                    startSelect.selectedIndex = 0;
                }
            }
            
            updateOutput();
        }
        
        async function loadConfigData() {
            const response = await fetch(`tweakdata.txt?t=${Date.now()}`);
            if (!response.ok) throw new Error(`Could not load tweakdata.txt: ${response.statusText}`);
            const text = await response.text();
            parseConfigData(text);
        }
        
        async function loadLinksContent() {
            const linksContentEl = document.getElementById('links-tab');
            try {
                const response = await fetch(`links.md?t=${Date.now()}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const markdownText = await response.text();
                linksContentEl.innerHTML = marked.parse(markdownText);
            } catch (error) {
                console.error("Could not load links content:", error);
                linksContentEl.innerHTML = '<p style="color: red;">Failed to load content.</p>';
            }
        }

        async function parseModesFile(filePath) {
            try {
                const response = await fetch(`${filePath}?t=${Date.now()}`);
                if (!response.ok) {
                    throw new Error(`Could not load ${filePath}: ${response.statusText}`);
                }
                const text = await response.text();
                
                const configs = { maps: [], modes: [], base: [], scavengers: [] };
                
                const categoryBlocks = text.split('## CATEGORY:').slice(1);

                for (const block of categoryBlocks) {
                    const lines = block.trim().split(/\r?\n/);
                    const categoryName = lines.shift().trim();
                    const content = lines.join('\n').trim();

                    if (categoryName === 'base') {
                        configs.base = content.split(/\r?\n/).filter(line => line.trim() !== '');
                    } else if (categoryName === 'scavengers') {
                        configs.scavengers = content.split(/\r?\n/).filter(line => line.trim() !== '');
                    } else {
                        const items = content.split('---').filter(item => item.trim() !== '');
                        for (const item of items) {
                            const itemLines = item.trim().split(/\r?\n/).filter(line => line.trim() !== '');
                            if (itemLines.length === 0) continue;

                            const name = itemLines.shift().trim();
                            const commands = itemLines;
                            
                            if (categoryName === 'maps' && configs.maps) {
                                configs.maps.push({ name, commands });
                            } else if (categoryName === 'modes' && configs.modes) {
                                configs.modes.push({ name, commands });
                            }
                        }
                    }
                }
                return configs;
            } catch (error) {
                console.error("Failed to parse game configs:", error);
                return { maps: [], modes: [], base: [], scavengers: [] }; 
            }
        }

        function loadCustomOptions() {
            const savedTweaks = localStorage.getItem(CUSTOM_TWEAKS_KEY);
            customOptions = savedTweaks ? JSON.parse(savedTweaks) : [];
        }

        function saveCustomOptions() {
            localStorage.setItem(CUSTOM_TWEAKS_KEY, JSON.stringify(customOptions));
        }

        function addCustomTweak(event) {
            event.preventDefault();
            const desc = document.getElementById('custom-option-desc').value.trim();
            const type = document.getElementById('custom-option-type').value;
            const tweak = document.getElementById('custom-tweak-code').value.trim();
            if (!desc || !tweak) return;
            customOptions.push({ id: Date.now(), desc, type, tweak });
            saveCustomOptions();
            renderAllCustomComponents();
            updateOutput();
            customTweakForm.reset();
        }

        function deleteCustomTweak(id) {
            customOptions = customOptions.filter(tweak => tweak.id !== id);
            saveCustomOptions();
            renderAllCustomComponents();
            updateOutput();
        }

        function renderAllCustomComponents() {
            renderCustomTweaksTable();
            renderCustomTweaksAsCheckboxes();
        }

        function renderCustomTweaksTable() {
            customTweaksTableBody.innerHTML = '';
            if (customOptions.length === 0) {
                customTweaksTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No custom tweaks saved</td></tr>';
                return;
            }
            customOptions.forEach(tweak => {
                const row = customTweaksTableBody.insertRow();
                row.innerHTML = `<td title="${tweak.desc}">${tweak.desc}</td><td title="${tweak.type}">${tweak.type}</td><td><div class="command-cell-wrapper"><span class="command-text" title="${tweak.tweak}">${tweak.tweak}</span><button class="copy-row-button" data-tweak-code="${tweak.tweak}">Copy</button></div></td><td><button class="delete-tweak-btn" data-id="${tweak.id}">Delete</button></td>`;
            });
        }

        function renderCustomTweaksAsCheckboxes() {
            customLeftColumn.innerHTML = '';
            customRightColumn.innerHTML = '';
            if (customOptions.length > 0) {
                customSettingsContainer.style.display = 'block';
                customOptions.forEach((tweak, index) => {
                    const label = document.createElement('label');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.dataset.isCustom = 'true';
                    checkbox.dataset.customData = JSON.stringify({ type: tweak.type, tweak: tweak.tweak });
                    checkbox.addEventListener('change', updateOutput);
                    
                    const textSpan = document.createElement('span');
                    textSpan.className = 'custom-option-label-text';
                    textSpan.textContent = ` ${tweak.desc}`;
                    
                    const typeSpan = document.createElement('span');
                    typeSpan.className = 'custom-option-type-display';
                    typeSpan.textContent = `(${tweak.type})`;
                    
                    label.appendChild(checkbox);
                    label.appendChild(textSpan);
                    label.appendChild(typeSpan);
                    
                    if (index % 2 === 0) customLeftColumn.appendChild(label);
                    else customRightColumn.appendChild(label);
                });
            } else {
                customSettingsContainer.style.display = 'none';
            }
        }

        function updateCustomOptionUI() {
            const usedTweakDefs = new Set();
            const usedTweakUnits = new Set();
            const slotRegex = /!bset\s+(tweakdefs|tweakunits)(\d*)/;
            const allFormElements = document.querySelectorAll('#options-form-columns input[type="checkbox"], #options-form-columns select, #custom-options-form-columns input[type="checkbox"]');
            
            allFormElements.forEach(el => {
                if(el.dataset.isCustom) return;

                if (el.dataset.isHpGenerator || el.dataset.isScavHpGenerator) {
                    return;
                }

                let commands = [];
                if (el.tagName === 'SELECT') { if (el.value) commands.push(el.value); } 
                else if (el.type === 'checkbox' && el.checked) { commands = JSON.parse(el.dataset.commandBlocks); }
                
                commands.forEach(cmd => {
                    if (!cmd) return;
                    const match = cmd.match(slotRegex);
                    if (match) {
                        const slotNum = parseInt(match[2] || 0, 10);
                        if (slotNum > 0) {
                            if (match[1] === 'tweakdefs') usedTweakDefs.add(slotNum);
                            else if (match[1] === 'tweakunits') usedTweakUnits.add(slotNum);
                        }
                    }
                });
            });
            
            document.querySelectorAll('select[data-slot]').forEach(select => {
                if (select.value) {
                    const slot = parseInt(select.dataset.slot, 10);
                    if (select.dataset.slotType === 'tweakdefs') usedTweakDefs.add(slot);
                    else if (select.dataset.slotType === 'tweakunits') usedTweakUnits.add(slot);
                }
            });


            const customCheckboxes = document.querySelectorAll('input[data-is-custom="true"]');
            customCheckboxes.forEach(checkbox => {
                const typeSpan = checkbox.nextElementSibling.nextElementSibling;
                const textSpan = checkbox.nextElementSibling;
                textSpan.classList.remove('disabled');

                if (checkbox.checked) {
                    const tweakData = JSON.parse(checkbox.dataset.customData);
                    const targetSet = (tweakData.type === 'tweakdefs') ? usedTweakDefs : usedTweakUnits;
                    let assignedSlot = null;
                    for (let i = 1; i <= 9; i++) {
                        if (!targetSet.has(i)) {
                            assignedSlot = i;
                            break;
                        }
                    }
                    if (assignedSlot !== null) {
                        typeSpan.textContent = `(${tweakData.type}${assignedSlot})`;
                        targetSet.add(assignedSlot);
                    } else {
                        typeSpan.textContent = `(${tweakData.type} - No Slot!)`;
                    }
                } else {
                     const tweakData = JSON.parse(checkbox.dataset.customData);
                     typeSpan.textContent = `(${tweakData.type})`;
                }
            });

            let defsAvailable = 9 - usedTweakDefs.size;
            let unitsAvailable = 9 - usedTweakUnits.size;
            
            customCheckboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    const tweakData = JSON.parse(checkbox.dataset.customData);
                    let shouldBeDisabled = false;
                    if ((tweakData.type === 'tweakdefs' && defsAvailable <= 0) || (tweakData.type === 'tweakunits' && unitsAvailable <= 0)) {
                        shouldBeDisabled = true;
                    }
                    checkbox.disabled = shouldBeDisabled;
                    checkbox.nextElementSibling.classList.toggle('disabled', shouldBeDisabled);
                }
            });

            slotWarningContainer.innerHTML = '';
            const defsSlotWord = defsAvailable === 1 ? 'slot' : 'slots';
            const unitsSlotWord = unitsAvailable === 1 ? 'slot' : 'slots';
            const message = document.createElement('p');
            message.textContent = `${defsAvailable} available tweakdefs ${defsSlotWord} and ${unitsAvailable} available tweakunits ${unitsSlotWord}`;
            slotWarningContainer.appendChild(message);
        }

        function decodeBase64Url(base64Url) {
            if (!base64Url) return '';
            try {
                let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const padding = base64.length % 4;
                if (padding) base64 += '===='.slice(padding);
                const decodedData = atob(base64);
                return new TextDecoder('utf-8').decode(Uint8Array.from(decodedData, c => c.charCodeAt(0)));
            } catch (e) { console.error(`Base64URL decoding failed for: ${base64Url}`, e); return 'Error decoding data'; }
        }

        function parseConfigData(text) {
            const lines = text.trim().split('\n');
            const groupedOptions = { 
                mainTweaks: { label: "NuttyB Main Tweaks", type: "checkbox", commandBlocks: [], default: true, disabled: false, column: 'left' },
                evolvingCommanders: { label: "NuttyB Evolving Commanders", type: "checkbox", commandBlocks: [], default: true, disabled: false, column: 'left' },
                extraRaptors: { label: "Extras", type: "select", choices: [{ label: "None", value: "", shortLabel: "" }], column: 'left' },
                otherCheckboxes: { type: "checkboxes", options: [], column: 'right' }
            };
            rawOptionsData = [];

            const dynamicHPGroup = {
                label: "Raptor Health", type: "select", isHpGenerator: true, hpType: 'hp', column: 'left', slot: 2, slotType: 'tweakdefs',
                defaultValue: "1.3",
                choices: [
                    { label: "Default", value: "", shortLabel: "" }, { label: "1x HP", value: "1", shortLabel: "1x HP" },
                    { label: "1.3x HP", value: "1.3", shortLabel: "1_3x HP" }, { label: "1.5x HP", value: "1.5", shortLabel: "1_5x HP" },
                    { label: "1.7x HP", value: "1.7", shortLabel: "1_7x HP" }, { label: "2x HP", value: "2", shortLabel: "2x HP" },
                    { label: "2.5x HP", value: "2.5", shortLabel: "2_5x HP" }, { label: "3x HP", value: "3", shortLabel: "3x HP" },
                    { label: "4x HP", value: "4", shortLabel: "4x HP" }, { label: "5x HP", value: "5", shortLabel: "5x HP" },
                ]
            };
            const dynamicQHPGroup = {
                label: "Queen Health", type: "select", isHpGenerator: true, hpType: 'qhp', column: 'left', slot: 1, slotType: 'tweakdefs',
                defaultValue: "1.3",
                choices: [
                     { label: "Default", value: "", shortLabel: "" }, { label: "1x QHP", value: "1", shortLabel: "1x QHP" },
                     { label: "1.3x QHP", value: "1.3", shortLabel: "1_3x QHP" }, { label: "1.5x QHP", value: "1.5", shortLabel: "1_5x QHP" },
                     { label: "1.7x QHP", value: "1.7", shortLabel: "1_7x QHP" }, { label: "2x QHP", value: "2", shortLabel: "2x QHP" },
                     { label: "2.5x QHP", value: "2.5", shortLabel: "2_5x QHP" }, { label: "3x QHP", value: "3", shortLabel: "3x QHP" },
                     { label: "4x QHP", value: "4", shortLabel: "4x QHP" }, { label: "5x QHP", value: "5", shortLabel: "5x QHP" },
                ]
            };

            lines.forEach(line => {
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    const label = parts[0].trim(), commandBlock = parts[1].trim();
                    let summary = '', status = "Optional", addedToFormGroup = false;

                    // --- Ignore these tweaks if in the file ---
                    if (commandBlock.startsWith('!bset tweakdefs1') || commandBlock.startsWith('!bset tweakdefs2')) {
                        return; 
                    }
                    if (commandBlock.startsWith('!bset tweakdefs') || commandBlock.startsWith('!bset tweakunits')) {
                        const commandParts = commandBlock.split(' ');
                        if (commandParts.length >= 3) summary = decodeBase64Url(commandParts[2]).split('\n')[0].trim();
                    }
                    if (extraRaptorsPrefixes.some(p => commandBlock.startsWith(p))) {
                        status = "Optional/Grouped";
                        let shortLabel = (label === "Mini Bosses") ? "[Mini Bosses]" : (label === "Experimental Wave Challenge") ? "[Expo Waves]" : "";
                        groupedOptions.extraRaptors.choices.push({ label, value: commandBlock, shortLabel });
                        if (commandBlock.startsWith('!bset tweakdefs4')) groupedOptions.extraRaptors.defaultValue = commandBlock;
                        addedToFormGroup = true;
                    }
                    if (mainTweaksPrefixes.some(p => commandBlock.startsWith(p))) { status = "Optional"; groupedOptions.mainTweaks.commandBlocks.push(commandBlock); addedToFormGroup = true; }
                    if (evolvingCommandersPrefixes.some(p => commandBlock.startsWith(p))) { status = "Optional"; groupedOptions.evolvingCommanders.commandBlocks.push(commandBlock); if (defaultSelectedLabels.includes(label)) groupedOptions.evolvingCommanders.default = true; addedToFormGroup = true; }
                    if (hiddenLabels.includes(label)) status = "Hidden";
                    rawOptionsData.push({ label, commandBlock, status, summary });
                    if (!addedToFormGroup && !hiddenLabels.includes(label)) { groupedOptions.otherCheckboxes.options.push({ label, type: "checkbox", commandBlocks: [commandBlock], default: defaultSelectedLabels.includes(label), column: 'right' }); }
                }
            });
            groupedOptions.otherCheckboxes.options.sort((a,b) => { const ia=rightColumnOrder.indexOf(a.label),ib=rightColumnOrder.indexOf(b.label); return ((ia===-1)?Infinity:ia)-((ib===-1)?Infinity:ib); });
            
            formOptionsConfig = [];
            if (groupedOptions.mainTweaks.commandBlocks.length > 0) formOptionsConfig.push(groupedOptions.mainTweaks);
            if (groupedOptions.evolvingCommanders.commandBlocks.length > 0) formOptionsConfig.push(groupedOptions.evolvingCommanders);
            
            formOptionsConfig.push(dynamicHPGroup, dynamicQHPGroup);

            if (groupedOptions.extraRaptors.choices.length > 1) formOptionsConfig.push(groupedOptions.extraRaptors);
            formOptionsConfig = formOptionsConfig.concat(groupedOptions.otherCheckboxes.options);
        }

        function generateCommands() {
            const presetCommands = [];
            const mapsSelect = document.getElementById('maps-select');
            const modesSelect = document.getElementById('modes-select');

            if (mapsSelect && mapsSelect.value !== "") {
                const selectedMap = gameConfigs.maps[mapsSelect.value];
                if (selectedMap && selectedMap.commands) presetCommands.push(...selectedMap.commands);
            }
            if (modesSelect && modesSelect.value !== "") {
                const selectedMode = gameConfigs.modes[modesSelect.value];
                if (selectedMode && selectedMode.commands) presetCommands.push(...selectedMode.commands);
            }

            const standardCommands = [];
            const customTweaksToProcess = [];
            const formElements = document.querySelectorAll('#options-form-columns input[type="checkbox"], #options-form-columns select, #custom-options-form-columns input[type="checkbox"]');
            
            formElements.forEach(el => {
                if (el.dataset.isCustom) {
                    if (el.checked) customTweaksToProcess.push(JSON.parse(el.dataset.customData));
                } 
                else if (el.dataset.isHpGenerator || el.dataset.isScavHpGenerator) {
                    const multiplier = el.value;
                    if (multiplier) {
                        const type = el.dataset.hpType;
                        const slot = el.dataset.slot;
                        const slotType = el.dataset.slotType;
                        const commandSlot = `${slotType}${slot}`;
                        const base64string = generateLuaTweak(type, multiplier);
                        if (!base64string.startsWith("Error")) {
                            standardCommands.push(`!bset ${commandSlot} ${base64string}`);
                        }
                    }
                }
                else {
                    let commands = [];
                    if (el.tagName === 'SELECT' && !el.id.includes('maps-select') && !el.id.includes('modes-select') && !el.id.includes('primary-mode-select')) {
                        if (el.value) commands.push(el.value);
                    } 
                    else if (el.type === 'checkbox' && el.checked) { 
                        commands = JSON.parse(el.dataset.commandBlocks);
                    }
                    commands.forEach(cmd => { if (cmd) standardCommands.push(cmd.trim()); });
                }
            });

            const usedTweakDefs = new Set();
            const usedTweakUnits = new Set();
            const slotRegex = /!bset\s+(tweakdefs|tweakunits)(\d*)/;

            [...standardCommands].forEach(cmd => {
                const match = cmd.match(slotRegex);
                if (match) {
                    const slotNum = parseInt(match[2] || 0, 10);
                    if (slotNum > 0) {
                      if (match[1] === 'tweakdefs') usedTweakDefs.add(slotNum);
                      else if (match[1] === 'tweakunits') usedTweakUnits.add(slotNum);
                    }
                }
            });

            const customCommands = [];
            customTweaksToProcess.forEach(tweak => {
                const targetSet = (tweak.type === 'tweakdefs') ? usedTweakDefs : usedTweakUnits;
                let availableSlot = null;
                for (let i = 1; i <= 9; i++) { if (!targetSet.has(i)) { availableSlot = i; break; } }
                if (availableSlot !== null) {
                    customCommands.push(`!bset ${tweak.type}${availableSlot} ${tweak.tweak}`);
                    targetSet.add(availableSlot);
                } else { console.warn(`All slots for '${tweak.type}' are full. Could not add custom tweak.`); }
            });

            const anyOptionSelected = presetCommands.length > 0 || standardCommands.length > 0 || customCommands.length > 0;
            const finalCommands = [];
            
            // --- UPDATED LOGIC HERE ---
            // Only add base/scavenger commands if a standard game mode option was chosen.
            // A custom tweak alone should not trigger this.
            const isGameModeTriggered = presetCommands.length > 0 || standardCommands.length > 0;

            if(isGameModeTriggered) {
                const primaryModeSelect = document.getElementById('primary-mode-select');
                if (gameConfigs.base.length > 0) {
                    finalCommands.push(...gameConfigs.base);
                }
                if (primaryModeSelect && primaryModeSelect.value === 'Scavengers' && gameConfigs.scavengers.length > 0) {
                    finalCommands.push(...gameConfigs.scavengers);
                }
            }
            // --------------------------
            
            finalCommands.push(...presetCommands, ...standardCommands, ...customCommands);

            const primaryModeSelect = document.getElementById('primary-mode-select');
            const isScavengers = primaryModeSelect && primaryModeSelect.value === 'Scavengers';

            let renameCommand = isScavengers ? `$rename [Mod] NuttyB Scavengers ` : `$rename [Mod] NuttyB Raptors `;
            const renameParts = [];

            if (isScavengers) {
                const scavHpSelect = document.getElementById('scav-hp-select');
                const bossHpSelect = document.getElementById('boss-hp-select');
                const scavHpText = scavHpSelect && scavHpSelect.value ? scavHpSelect.options[scavHpSelect.selectedIndex].text : '';
                const bossHpText = bossHpSelect && bossHpSelect.value ? bossHpSelect.options[bossHpSelect.selectedIndex].text : '';

                const combinedScavHp = [scavHpText, bossHpText].filter(Boolean).join(' ');
                if (combinedScavHp) {
                    const formattedHpPart = combinedScavHp.replace(/\./g, '_');
                    renameParts.push(`[${formattedHpPart}]`);
                }

            } else { 
                let extraRaptorsPart = "", raptorHealthPart = "", queenHealthPart = "";
                document.querySelectorAll('#raptor-only-options select').forEach(el => {
                    const o = el.options[el.selectedIndex];
                    if (o.value) {
                        const g = formOptionsConfig.find(gr => gr.label === el.dataset.optionType);
                        if (g) {
                            const c = g.choices.find(ch => ch.value === o.value);
                            if (c && c.shortLabel !== undefined) {
                                if (g.label === "Extras") extraRaptorsPart = c.shortLabel;
                                else if (g.label === "Raptor Health") raptorHealthPart = c.shortLabel;
                                else if (g.label === "Queen Health") queenHealthPart = c.shortLabel;
                            }
                        }
                    }
                });
                
                if (extraRaptorsPart) renameParts.push(extraRaptorsPart);
                
                const combinedRaptorHp = [queenHealthPart, raptorHealthPart].filter(Boolean).join(' ');
                if (combinedRaptorHp) renameParts.push(`[${combinedRaptorHp}]`);
            }
            
            const noMexCommand = '!unit_restrictions_noextractors 1';
            const allowMexCommand = '!unit_restrictions_noextractors 0';
            const lastNoMexIndex = finalCommands.lastIndexOf(noMexCommand);
            const lastAllowMexIndex = finalCommands.lastIndexOf(allowMexCommand);
            const noMexEnabled = lastNoMexIndex > -1 && lastNoMexIndex > lastAllowMexIndex;
            
            if (renameParts.length > 0) {
                renameCommand += renameParts.join('');
            }
            if (noMexEnabled) {
                renameCommand += `[No Mex]`;
            }
            
            const sectionsData = [];
            const allCommandsToSection = finalCommands; 

            for (const cmd of allCommandsToSection) {
                if (!cmd) continue;
                let placed = false;
                for (const section of sectionsData) {
                    const neededLength = section.length === 0 ? cmd.length : cmd.length + 1;
                    if (section.length + neededLength <= MAX_SECTION_LENGTH) {
                        section.commands.push(cmd);
                        section.length += neededLength;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    sectionsData.push({ commands: [cmd], length: cmd.length });
                }
            }

            if (anyOptionSelected) {
                if (sectionsData.length === 0) {
                    sectionsData.push({ commands: [renameCommand], length: renameCommand.length });
                } else {
                    const lastSection = sectionsData[sectionsData.length - 1];
                    const neededLength = lastSection.length === 0 ? renameCommand.length : renameCommand.length + 1;
                    
                    if (lastSection.length + neededLength <= MAX_SECTION_LENGTH) {
                        lastSection.commands.push(renameCommand);
                        lastSection.length += neededLength;
                    } else {
                        sectionsData.push({ commands: [renameCommand], length: renameCommand.length });
                    }
                }
            }
            
            const finalSections = sectionsData.map(section => section.commands.join('\n'));
            
            return { lobbyName: (anyOptionSelected ? renameCommand : 'No Options Selected'), sections: finalSections };
        }

        function renderOptions() {
            leftColumn.innerHTML = ''; 
            rightColumn.innerHTML = '';

            const specialLeftOptions = ['NuttyB Main Tweaks', 'NuttyB Evolving Commanders'];

            specialLeftOptions.forEach(optLabel => {
                const optionGroup = formOptionsConfig.find(og => og.label === optLabel);
                if (optionGroup) {
                    const label = document.createElement('label');
                    const inputElement = document.createElement('input'); 
                    inputElement.type = 'checkbox';
                    inputElement.dataset.commandBlocks = JSON.stringify(optionGroup.commandBlocks);
                    inputElement.checked = optionGroup.default; 
                    inputElement.disabled = optionGroup.disabled || false;
                    label.appendChild(inputElement); 
                    label.appendChild(document.createTextNode(' ' + optionGroup.label));
                    if (!inputElement.disabled) inputElement.addEventListener('change', updateOutput);
                    leftColumn.appendChild(label);
                }
            });

            const primaryModeLabel = document.createElement('label');
            primaryModeLabel.textContent = 'Mode: ';
            const primaryModeSelect = document.createElement('select');
            primaryModeSelect.id = 'primary-mode-select';
            primaryModeSelect.innerHTML = `<option value="Raptors">Raptors</option><option value="Scavengers">Scavengers</option>`;
            primaryModeSelect.addEventListener('change', (e) => updateOutput(e));
            primaryModeLabel.appendChild(primaryModeSelect);
            leftColumn.appendChild(primaryModeLabel);

            const scavOnlyContainer = document.createElement('div');
            scavOnlyContainer.id = 'scav-only-options';
            
            const scavHpLabel = document.createElement('label');
            scavHpLabel.textContent = 'Scavengers HP: ';
            const scavHpSelect = document.createElement('select');
            scavHpSelect.id = 'scav-hp-select';
            scavHpSelect.dataset.isScavHpGenerator = true;
            scavHpSelect.dataset.hpType = 'scav';
            scavHpSelect.dataset.slot = '2';
            scavHpSelect.dataset.slotType = 'tweakdefs';
            const scavHpOptions = [
                {v: "", t: "Default"}, {v: "1", t: "1x HP"}, {v: "1.3", t: "1.3x HP"}, {v: "1.5", t: "1.5x HP"}, {v: "1.7", t: "1.7x HP"},
                {v: "2", t: "2x HP"}, {v: "2.5", t: "2.5x HP"}, {v: "3", t: "3x HP"}, {v: "4", t: "4x HP"}, {v: "5", t: "5x HP"}
            ];
            scavHpOptions.forEach(opt => scavHpSelect.add(new Option(opt.t, opt.v)));
            scavHpSelect.value = ""; 
            scavHpSelect.addEventListener('change', updateOutput);
            scavHpLabel.appendChild(scavHpSelect);
            scavOnlyContainer.appendChild(scavHpLabel);

            const bossHpLabel = document.createElement('label');
            bossHpLabel.textContent = 'Scav Boss HP: ';
            const bossHpSelect = document.createElement('select');
            bossHpSelect.id = 'boss-hp-select';
            bossHpSelect.dataset.isScavHpGenerator = true;
            bossHpSelect.dataset.hpType = 'boss';
            bossHpSelect.dataset.slot = '1';
            bossHpSelect.dataset.slotType = 'tweakdefs';
            const bossHpOptions = [
                {v: "", t: "Default"}, {v: "1", t: "1x BHP"}, {v: "1.3", t: "1.3x BHP"}, {v: "1.5", t: "1.5x BHP"}, {v: "1.7", t: "1.7x BHP"},
                {v: "2", t: "2x BHP"}, {v: "2.5", t: "2.5x BHP"}, {v: "3", t: "3x BHP"}, {v: "4", t: "4x BHP"}, {v: "5", t: "5x BHP"},
            ];
            bossHpOptions.forEach(opt => bossHpSelect.add(new Option(opt.t, opt.v)));
            bossHpSelect.value = ""; 
            bossHpSelect.addEventListener('change', updateOutput);
            bossHpLabel.appendChild(bossHpSelect);
            scavOnlyContainer.appendChild(bossHpLabel);

            leftColumn.appendChild(scavOnlyContainer);

            const raptorOnlyContainer = document.createElement('div');
            raptorOnlyContainer.id = 'raptor-only-options';
            leftColumn.appendChild(raptorOnlyContainer);
            
            formOptionsConfig.forEach(optionGroup => {
                if (specialLeftOptions.includes(optionGroup.label)) return;

                const label = document.createElement('label');
                let inputElement;
                if (optionGroup.type === 'checkbox') {
                    inputElement = document.createElement('input'); inputElement.type = 'checkbox';
                    inputElement.dataset.commandBlocks = JSON.stringify(optionGroup.commandBlocks);
                    inputElement.checked = optionGroup.default; inputElement.disabled = optionGroup.disabled || false;
                    label.appendChild(inputElement); label.appendChild(document.createTextNode(' ' + optionGroup.label));
                    if (!inputElement.disabled) inputElement.addEventListener('change', updateOutput);
                } else if (optionGroup.type === 'select') {
                    inputElement = document.createElement('select'); 
                    inputElement.dataset.optionType = optionGroup.label;

                    if (optionGroup.isHpGenerator) {
                        inputElement.dataset.isHpGenerator = true;
                        inputElement.dataset.hpType = optionGroup.hpType;
                        inputElement.dataset.slot = optionGroup.slot;
                        inputElement.dataset.slotType = optionGroup.slotType;
                        inputElement.disabled = true;
                    }

                    optionGroup.choices.forEach(choice => {
                        const optionElement = document.createElement('option');
                        optionElement.value = choice.value; 
                        optionElement.textContent = choice.label;
                        if (optionGroup.defaultValue && choice.value === optionGroup.defaultValue) {
                            optionElement.selected = true;
                        }
                        optionElement.dataset.shortLabel = choice.shortLabel || "";
                        inputElement.appendChild(optionElement);
                    });
                    label.textContent = optionGroup.label + ': '; label.appendChild(inputElement);
                    inputElement.addEventListener('change', updateOutput);
                }

                if (optionGroup.column === 'right') {
                    rightColumn.appendChild(label);
                } else if (optionGroup.label === 'Raptor Health' || optionGroup.label === 'Queen Health' || optionGroup.label === 'Extras') {
                    raptorOnlyContainer.appendChild(label);
                } else {
                    leftColumn.appendChild(label);
                }
            });

            if (gameConfigs && (gameConfigs.maps.length > 0 || gameConfigs.modes.length > 0)) {
                let mapsLabel, modesLabel;

                if (gameConfigs.maps.length > 0) {
                    mapsLabel = document.createElement('label');
                    mapsLabel.textContent = 'Map: ';
                    const mapsSelect = document.createElement('select');
                    mapsSelect.id = 'maps-select';
                    gameConfigs.maps.forEach((map, index) => {
                        mapsSelect.add(new Option(map.name, index));
                    });
                    mapsSelect.selectedIndex = 0;
                    mapsSelect.addEventListener('change', updateOutput);
                    mapsLabel.appendChild(mapsSelect);
                }
                if (gameConfigs.modes.length > 0) {
                    modesLabel = document.createElement('label');
                    modesLabel.textContent = 'Start: ';
                    const modesSelect = document.createElement('select');
                    modesSelect.id = 'modes-select';
                    modesSelect.addEventListener('change', updateOutput);
                    modesLabel.appendChild(modesSelect);
                }

                const container = document.getElementById('raptor-only-options');
                if (container) {
                    if (modesLabel) container.after(modesLabel);
                    if (mapsLabel) container.after(mapsLabel);
                } else {
                    if (mapsLabel) leftColumn.appendChild(mapsLabel);
                    if (modesLabel) leftColumn.appendChild(modesLabel);
                }
            }

            renderAllCustomComponents();
            populateStartSelector();
        }
        
        function updateOutput(event) {
            const primaryModeSelect = document.getElementById('primary-mode-select');
            const raptorOnlyContainer = document.getElementById('raptor-only-options');
            const scavOnlyContainer = document.getElementById('scav-only-options');
            const scavHpSelect = document.getElementById('scav-hp-select');
            const bossHpSelect = document.getElementById('boss-hp-select');

            if (primaryModeSelect && raptorOnlyContainer && scavOnlyContainer) {
                const newMode = primaryModeSelect.value;
                const modeChanged = event && event.target === primaryModeSelect;

                if (modeChanged) {
                    if (newMode === 'Scavengers') {
                        scavHpSelect.value = "1.3";
                        bossHpSelect.value = "1.3";
                        raptorOnlyContainer.querySelectorAll('select').forEach(sel => sel.value = "");
                    } else { // Switching back to Raptors
                        scavHpSelect.value = "";
                        bossHpSelect.value = "";
                        raptorOnlyContainer.querySelectorAll('select[data-option-type]').forEach(sel => {
                            const optionGroup = formOptionsConfig.find(og => og.label === sel.dataset.optionType);
                            if (optionGroup) {
                                sel.value = optionGroup.defaultValue || "";
                            }
                        });
                    }
                }
                
                const isScavengers = newMode === 'Scavengers';
                raptorOnlyContainer.style.display = isScavengers ? 'none' : 'block';
                scavOnlyContainer.style.display = isScavengers ? 'block' : 'none';
            }
            
            updateCustomOptionUI();
            const generatedData = generateCommands();
            lobbyNameDisplay.textContent = generatedData.lobbyName;
            
            for (let i = 1; i <= 7; i++) {
                const sectionDiv = document.getElementById(`part-${i}-section`);
                const textArea = document.getElementById(`command-output-${i}`);
                if (generatedData.sections[i-1]) {
                    textArea.value = generatedData.sections[i-1];
                    sectionDiv.style.display = 'grid';
                } else {
                    textArea.value = '';
                    sectionDiv.style.display = 'none';
                }
            }
        }

        function populateDataTable() {
            dataTableBody.innerHTML = ''; 
            
            rawOptionsData.filter(item => item.status !== 'Hidden').forEach(item => {
                const row = dataTableBody.insertRow();
                row.insertCell().textContent = item.label; 
                row.insertCell().textContent = item.status; 
                row.insertCell().textContent = item.summary;
                const commandsCell = row.insertCell(); 
                const wrapper = document.createElement('div'); wrapper.className = 'command-cell-wrapper';
                const textSpan = document.createElement('span'); textSpan.className = 'command-text'; 
                textSpan.textContent = item.commandBlock; textSpan.title = item.commandBlock;
                const copyBtn = document.createElement('button'); copyBtn.textContent = 'Copy'; 
                copyBtn.className = 'copy-row-button'; copyBtn.dataset.command = item.commandBlock;
                wrapper.appendChild(textSpan); wrapper.appendChild(copyBtn); commandsCell.appendChild(wrapper);
            });

            document.querySelectorAll('select[data-slot]').forEach(selector => {
                const selectedValue = selector.value;
                if (!selectedValue) return;

                const selectedOptionText = selector.options[selector.selectedIndex].text;
                const type = selector.dataset.hpType;
                const slot = selector.dataset.slot;
                const slotType = selector.dataset.slotType;
                const commandSlot = `${slotType}${slot}`;
                const base64tweak = generateLuaTweak(type, selectedValue);

                if (base64tweak.startsWith("Error")) return;

                const fullCommand = `!bset ${commandSlot} ${base64tweak}`;
                const summary = decodeBase64Url(base64tweak).split('\n')[0].trim();

                const row = dataTableBody.insertRow();
                row.insertCell().textContent = selectedOptionText;
                row.insertCell().textContent = 'Optional/Generated';
                row.insertCell().textContent = summary;
                
                const commandsCell = row.insertCell();
                const wrapper = document.createElement('div'); wrapper.className = 'command-cell-wrapper';
                const textSpan = document.createElement('span'); textSpan.className = 'command-text';
                textSpan.textContent = fullCommand; textSpan.title = fullCommand;
                const copyBtn = document.createElement('button'); copyBtn.textContent = 'Copy';
                copyBtn.className = 'copy-row-button'; copyBtn.dataset.command = fullCommand;
                wrapper.appendChild(textSpan); wrapper.appendChild(copyBtn); commandsCell.appendChild(wrapper);
            });
        }

        function populateMapsModesTable() {
            const tableBody = document.querySelector('#maps-modes-table tbody');
            tableBody.innerHTML = ''; 

            if (gameConfigs.maps.length === 0 && gameConfigs.modes.length === 0 && gameConfigs.scavengers.length === 0 && gameConfigs.base.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No maps or modes found.</td></tr>';
                return;
            }
            
            const createCommandCellWithSingleCopy = (cell, commands) => {
                if (!commands || commands.length === 0) {
                    cell.textContent = 'N/A';
                    return;
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'command-cell-wrapper';

                const textSpan = document.createElement('span');
                textSpan.style.whiteSpace = 'normal';
                textSpan.innerHTML = commands.join('<br>');

                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copy All';
                copyBtn.className = 'copy-row-button';
                copyBtn.dataset.command = commands.join('\n');

                wrapper.appendChild(textSpan);
                wrapper.appendChild(copyBtn);
                cell.appendChild(wrapper);
            };

            const populateCategory = (category, categoryName) => {
                category.forEach(item => {
                    const row = tableBody.insertRow();
                    row.insertCell().textContent = categoryName;
                    row.insertCell().textContent = item.name;
                    createCommandCellWithSingleCopy(row.insertCell(), item.commands);
                });
            };

            const populateSimpleCategory = (commands, categoryName, name) => {
                 if(commands.length > 0) {
                    const row = tableBody.insertRow();
                    row.insertCell().textContent = categoryName;
                    row.insertCell().textContent = name;
                    createCommandCellWithSingleCopy(row.insertCell(), commands);
                }
            };
            
            populateSimpleCategory(gameConfigs.base, 'base', 'Raptors (Default)');
            populateSimpleCategory(gameConfigs.scavengers, 'scavengers', 'Default');
            populateCategory(gameConfigs.maps, 'maps');
            populateCategory(gameConfigs.modes, 'modes');
        }

        function switchTab(event) {
            const targetTabId = event.target.dataset.tab + '-tab';
            tabButtons.forEach(button => button.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            event.target.classList.add('active');
            document.getElementById(targetTabId).classList.add('active');
            
            if (event.target.dataset.tab === 'data') {
                populateDataTable();
                populateMapsModesTable();
            }
            if (event.target.dataset.tab === 'custom') {
                renderCustomTweaksTable();
            }
        }

        copyButtons.forEach(button => button.addEventListener('click', event => {
            const targetTextArea = document.getElementById(event.target.dataset.target);
            const originalText = event.target.textContent;
            navigator.clipboard.writeText(targetTextArea.value)
                .then(() => {
                    event.target.textContent = 'Copied!';
                    setTimeout(() => { event.target.textContent = originalText; }, 2000);
                }).catch(err => { console.error('Failed to copy: ', err); });
        }));

        [dataTableBody, customTweaksTableBody, mapsModesTableBody].forEach(tbody => {
            if (!tbody) return;
            tbody.addEventListener('click', event => {
                const button = event.target;
                if (button.matches('.copy-row-button')) {
                    const textToCopy = button.dataset.command || button.dataset.tweakCode;
                    if (!textToCopy) return;
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        const originalText = button.textContent;
                        button.textContent = 'Copied!';
                        setTimeout(() => { button.textContent = originalText; }, 2000);
                    }).catch(err => { console.error('Failed to copy command: ', err); });
                } else if (button.matches('.delete-tweak-btn')) {
                     deleteCustomTweak(parseInt(button.dataset.id, 10));
                }
            });
        });

        resetNoneBtn.addEventListener('click', () => {
            const formElements = document.querySelectorAll('#options-form-columns input[type="checkbox"], #options-form-columns select');
            formElements.forEach(el => {
                if (el.type === 'checkbox') {
                    el.checked = false;
                } else if (el.tagName === 'SELECT') {
                    if (el.id === 'maps-select' || el.id === 'modes-select') {
                        el.selectedIndex = -1; 
                    } else if (el.id !== 'primary-mode-select') {
                        el.value = ""; 
                    }
                }
            });
            updateOutput();
        });

        resetDefaultBtn.addEventListener('click', () => {
            const primaryModeSelect = document.getElementById('primary-mode-select');
            if (primaryModeSelect) primaryModeSelect.value = 'Raptors';
            
            formOptionsConfig.forEach(optionGroup => {
                if (optionGroup.type === 'checkbox') {
                    const allLabels = document.querySelectorAll('#options-form-columns label');
                    const label = Array.from(allLabels).find(l => l.textContent.trim().includes(optionGroup.label));
                    if (label) {
                        const checkbox = label.querySelector('input[type="checkbox"]');
                        if (checkbox) checkbox.checked = optionGroup.default;
                    }
                } else if (optionGroup.type === 'select') {
                    const select = optionsFormColumns.querySelector(`select[data-option-type="${optionGroup.label}"]`);
                    if (select) select.value = optionGroup.defaultValue || "";
                }
            });
            
            const bossHpSelect = document.getElementById('boss-hp-select');
            const scavHpSelect = document.getElementById('scav-hp-select');
            if (bossHpSelect) bossHpSelect.value = "";
            if (scavHpSelect) scavHpSelect.value = "";

            const mapsSelect = document.getElementById('maps-select');
            if (mapsSelect && mapsSelect.options.length > 0) mapsSelect.selectedIndex = 0;

            const modesSelect = document.getElementById('modes-select');
            if(modesSelect && modesSelect.options.length > 0) {
                modesSelect.selectedIndex = 0;
            }
            
            updateOutput();
        });
        
        customTweakForm.addEventListener('submit', addCustomTweak);
        tabButtons.forEach(button => button.addEventListener('click', switchTab));

        async function initializeApp() {
            try {
                loadCustomOptions();
                
                const [parsedConfigs] = await Promise.all([
                    parseModesFile('modes.txt'),
                    loadConfigData(), 
                    loadLinksContent()
                ]);

                gameConfigs = parsedConfigs;
                console.log("Modes file loaded and parsed:", gameConfigs);

                renderOptions();

                const libraryCheckInterval = setInterval(() => {
                    if (typeof luamin !== 'undefined') {
                        clearInterval(libraryCheckInterval);
                        console.log("Lua libraries loaded.");
                        document.querySelectorAll('select[data-is-hp-generator="true"], select[data-is-scav-hp-generator="true"]').forEach(select => {
                           select.disabled = false;
                        });
                        updateOutput();
                    }
                }, 100);

            } catch (error) {
                console.error("Failed to initialize the configurator:", error);
                document.querySelector('.container').innerHTML = '<h1>Initialization Error</h1><p style="color: red;">Could not load essential configuration files (e.g., modes.txt or tweakdata.txt). Please check that the files exist and refresh the page.</p>';
            }
        }

        document.addEventListener('DOMContentLoaded', initializeApp);
