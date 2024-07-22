async function fetchFonts() {
    try {
        const response = await fetch('fonts.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch fonts:', error);
        return {};
    }
}

function updateEditorStyle(fontFamily, variant) {
    const textEditor = document.getElementById('text-editor');
    textEditor.style.fontFamily = fontFamily;
    textEditor.style.fontWeight = variant.weight;
    textEditor.style.fontStyle = variant.italic ? 'italic' : 'normal';
}

async function init() {
    const fonts = await fetchFonts();
    const fontFamilySelect = document.getElementById('font-family');
    const fontVariantSelect = document.getElementById('font-variant');
    const italicToggle = document.getElementById('italic-toggle');
    const textEditor = document.getElementById('text-editor');
    const resetBtn = document.getElementById('reset-btn');
    const saveBtn = document.getElementById('save-btn');

    const savedFont = localStorage.getItem('font') || 'ABeeZee';
    const savedVariant = JSON.parse(localStorage.getItem('variant')) || { weight: 400, italic: false };
    const savedContent = localStorage.getItem('content') || '';

    fontFamilySelect.innerHTML = '';
    Object.keys(fonts).forEach(fontFamily => {
        const option = document.createElement('option');
        option.value = fontFamily;
        option.textContent = fontFamily;
        fontFamilySelect.appendChild(option);
    });

    fontFamilySelect.value = savedFont;
    textEditor.value = savedContent;

    if (Object.keys(fonts).length > 0) {
        loadVariants(savedFont, savedVariant);
    }

    fontFamilySelect.addEventListener('change', (e) => {
        loadVariants(e.target.value, { weight: 400, italic: false });
    });

    fontVariantSelect.addEventListener('change', () => {
        const selectedVariant = getSelectedVariant();
        updateEditorStyle(fontFamilySelect.value, selectedVariant);
    });

    italicToggle.addEventListener('change', () => {
        const selectedVariant = getSelectedVariant();
        selectedVariant.italic = italicToggle.checked;
        updateEditorStyle(fontFamilySelect.value, selectedVariant);
        saveSettings();
    });

    textEditor.addEventListener('input', saveSettings);

    resetBtn.addEventListener('click', resetSettings);
    saveBtn.addEventListener('click', saveToFile);

    function loadVariants(fontFamily, selectedVariant) {
        const font = fonts[fontFamily];
        if (font) {
            fontVariantSelect.innerHTML = '';
            Object.keys(font).forEach(variant => {
                const option = document.createElement('option');
                option.value = variant;
                option.textContent = variant.replace(/(\d+)(italic)?/, (match, p1, p2) => `${p1} ${p2 ? 'Italic' : 'Regular'}`);
                fontVariantSelect.appendChild(option);
            });

            const closestVariant = findClosestVariant(Object.keys(font), selectedVariant);
            fontVariantSelect.value = `${closestVariant.weight}${closestVariant.italic ? 'italic' : 'regular'}`;
            italicToggle.checked = closestVariant.italic;

            updateEditorStyle(fontFamily, closestVariant);
        }
    }

    function findClosestVariant(variants, target) {
        const weightVariants = variants.map(v => parseInt(v));
        const closestWeight = weightVariants.reduce((prev, curr) => Math.abs(curr - target.weight) < Math.abs(prev - target.weight) ? curr : prev, weightVariants[0]);
        return {
            weight: closestWeight,
            italic: target.italic
        };
    }

    function getSelectedVariant() {
        const selectedValue = fontVariantSelect.value;
        const match = selectedValue.match(/(\d+)(italic|regular)?/);
        return {
            weight: parseInt(match[1]),
            italic: match[2] === 'italic'
        };
    }

    function saveSettings() {
        localStorage.setItem('font', fontFamilySelect.value);
        localStorage.setItem('variant', JSON.stringify(getSelectedVariant()));
        localStorage.setItem('content', textEditor.value);
    }

    function resetSettings() {
        fontFamilySelect.value = 'ABeeZee';
        loadVariants('ABeeZee', { weight: 400, italic: false });
        textEditor.value = '';
        italicToggle.checked = false;
        saveSettings();
    }

    function saveToFile() {
        const blob = new Blob([textEditor.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'text-editor-content.txt';
        a.click();
        URL.revokeObjectURL(url);
    }
}

document.addEventListener('DOMContentLoaded', init);
