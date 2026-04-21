const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Remove glow/glass classes and variables
    content = content.replace(/shadow-\[0_0_16px_rgba\([^\]]+\)\]/g, 'shadow-none');
    
    // Replace gradient backgrounds with just the base color
    content = content.replace(/linear-gradient\([^,]+,\s*(rgba\([^)]+\)|var\([^)]+\)|#[0-9a-fA-F]+)[^)]*\)/g, '$1');
    content = content.replace(/radial-gradient\([^,]+,\s*(rgba\([^)]+\)|var\([^)]+\)|#[0-9a-fA-F]+)[^)]*\)/g, '$1');
    
    // 2. Remove shadows that use rgba
    content = content.replace(/boxShadow:\s*['`][^'`]*rgba\([^)]+\)[^'`]*['`]/g, "boxShadow: 'var(--shadow-sm)'");
    
    // text shadows
    content = content.replace(/textShadow:\s*'[^']+'/g, "textShadow: 'none'");

    // 3. Replace hardcoded dark-mode RGB/A values with semantic CSS variables
    const colorMap = {
        '99,\\s*102,\\s*241': 'var(--primary-subtle)', // Indigo
        '34,\\s*197,\\s*94': 'var(--accent-green)', // Green
        '239,\\s*68,\\s*68': 'var(--accent-red)', // Red
        '234,\\s*179,\\s*8': 'var(--accent-yellow)', // Yellow
        '249,\\s*115,\\s*22': 'var(--accent-orange)', // Orange
        '14,\\s*165,\\s*233': 'var(--accent-cyan)', // Sky
        '20,\\s*184,\\s*166': 'var(--accent-cyan)', // Teal
        '236,\\s*72,\\s*153': 'var(--accent-pink)', // Pink
        '139,\\s*92,\\s*246': 'var(--primary-subtle)', // Violet
        '148,\\s*163,\\s*184': 'var(--bg-elevated)', // Slate
        '245,\\s*158,\\s*11': 'var(--accent-yellow)', // Amber
        '255,\\s*255,\\s*255': 'var(--bg-elevated)', // White (often used as elevated bg)
        '0,\\s*0,\\s*0': 'var(--border-default)' // Black
    };

    for (const [rgb, variable] of Object.entries(colorMap)) {
        // regex to match rgba(R, G, B, A)
        const regex = new RegExp(`rgba\\(${rgb},\\s*[0-9.]+\\)`, 'g');
        content = content.replace(regex, variable);
    }

    // specific tailwind bg-[rgba(...)] to something flatter
    // since we can't be sure of the tailwind config, we replace bg-[rgba(..)] with a flat style or var
    content = content.replace(/bg-\[rgba\([^\]]+\)\]/g, 'bg-white');
    content = content.replace(/border-\[rgba\([^\]]+\)\]/g, 'border-black');

    // Remove empty textShadow if it was left like style={{ textShadow: 'none' }} where it's not needed, but it's valid syntax so it's fine.
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

walkDir(path.join(__dirname, 'src', 'components'), processFile);
