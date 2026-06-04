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

    // Remove glow and glass effects
    content = content.replace(/shadow-\[0_0_16px_rgba\([^\]]+\)\]/g, 'shadow-sm');
    content = content.replace(/glow: 'shadow-\[0_0_16px_rgba\([^\]]+\)\]'/g, "glow: 'shadow-sm'");
    
    // Replace gradients with flat colors
    content = content.replace(/linear-gradient\([^,]+,\s*(rgba\([^)]+\)|var\([^)]+\)|#[0-9a-fA-F]+)[^)]*\)/g, '$1');
    content = content.replace(/radial-gradient\([^,]+,\s*(rgba\([^)]+\)|var\([^)]+\)|#[0-9a-fA-F]+)[^)]*\)/g, '$1');

    // Remove textShadow
    content = content.replace(/textShadow:\s*'[^']+'/g, "");
    
    // Box shadows
    content = content.replace(/boxShadow:\s*'[^']*rgba\([^)]+\)[^']*'/g, "boxShadow: 'var(--shadow-sm)'");
    content = content.replace(/boxShadow:\s*`[^`]*rgba\([^)]+\)[^`]*`/g, "boxShadow: 'var(--shadow-sm)'");
    content = content.replace(/boxShadow: 'var\(--shadow-[^']+'[^\n]*,/g, "boxShadow: 'var(--shadow-sm)',");

    // Colors to vars
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
        '255,\\s*255,\\s*255': 'var(--bg-elevated)'
    };

    for (const [rgb, variable] of Object.entries(colorMap)) {
        // rgba(...) -> variable
        const regex = new RegExp(`rgba\\(${rgb},[^)]+\\)`, 'g');
        content = content.replace(regex, variable);
    }

    // specific cleanup for borders that might look like border: '1px solid var(--accent-green)'
    content = content.replace(/border:\s*'1px solid var\(--([^']+)\)'/g, "border: '2px solid var(--$1)'");
    content = content.replace(/border:\s*`1px solid \$\{([^}]+)\}`/g, "border: `2px solid ${$1}`");

    // Fix some strings like bg-[var(--primary-subtle)] which might be invalid tailwind unless configured, 
    // but let's assume it's valid if using arbitary values or we can leave them as is.
    content = content.replace(/bg-\[rgba\([^\]]+\)\]/g, 'bg-white border-2 border-black');
    content = content.replace(/border-\[rgba\([^\]]+\)\]/g, 'border-black');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

walkDir(path.join(__dirname, 'src', 'components'), processFile);
