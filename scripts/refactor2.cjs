const fs = require('fs');
const path = require('path');

const updates = [
    {
        file: 'src/components/dashboard/TopRankedItems.tsx',
        replacements: [
            {
                from: /`linear-gradient\(135deg, \$\{item\.rank === 1 \? 'var\(--accent-yellow\)' : item\.rank === 2 \? 'var\(--bg-elevated\)' : 'var\(--accent-orange\)'\}, transparent\)`/g,
                to: "item.rank === 1 ? 'var(--accent-yellow)' : item.rank === 2 ? 'var(--bg-elevated)' : 'var(--accent-orange)'"
            },
            {
                from: /`radial-gradient\(circle, \$\{item\.rank === 1 \? 'var\(--accent-yellow\)' : item\.rank === 2 \? 'var\(--bg-elevated\)' : 'var\(--accent-orange\)'\}, transparent 70%\)`/g,
                to: "'transparent'"
            }
        ]
    },
    {
        file: 'src/components/ui/EmptyState.tsx',
        replacements: [
            {
                from: /`radial-gradient\(circle at 50% 50%, \$\{iconColor\}20, transparent 70%\)`/g,
                to: "'transparent'"
            },
            {
                from: /`linear-gradient\(135deg, \$\{iconColor\}, transparent\)`/g,
                to: "iconColor"
            }
        ]
    },
    {
        file: 'src/components/ranking/RankingList.tsx',
        replacements: [
            {
                from: /background: `radial-gradient\(circle at 50% 50%, \$\{\n\s*item\.rank === 1\n\s*\? 'var\(--accent-yellow\)'\n\s*: item\.rank === 2\n\s*\? 'var\(--bg-elevated\)'\n\s*: 'var\(--accent-orange\)'\n\s*\}30, transparent 70%\)`,/gm,
                to: "background: 'transparent',"
            }
        ]
    },
    {
        file: 'src/components/layout/CommandPalette.tsx',
        replacements: [
            {
                from: /'rgba\(6, 6, 10, 0\.8\)'/g,
                to: "'var(--bg-elevated)'"
            },
            {
                from: /'linear-gradient\(180deg, transparent 0%, var\(--bg-elevated\) 100%\)'/g,
                to: "'var(--bg-elevated)'"
            }
        ]
    },
    {
        file: 'src/components/layout/Sidebar.tsx',
        replacements: [
            {
                from: /'rgba\(6, 6, 10, 0\.85\)'/g,
                to: "'var(--bg-elevated)'"
            }
        ]
    },
    {
        file: 'src/components/search/RankBadge.tsx',
        replacements: [
            { from: /'rgba\(156,163,175,0\.12\)'/g, to: "'var(--bg-elevated)'" },
            { from: /'0 0 12px rgba\(156,163,175,0\.25\)'/g, to: "'var(--shadow-sm)'" },
            { from: /'rgba\(156,163,175,0\.15\)\)'/g, to: "'var(--border-default)'" },
            { from: /'rgba\(180,83,9,0\.12\)'/g, to: "'var(--accent-orange)'" },
            { from: /'0 0 12px rgba\(180,83,9,0\.2\)'/g, to: "'var(--shadow-sm)'" },
            { from: /'rgba\(180,83,9,0\.15\)\)'/g, to: "'var(--accent-orange)'" },
            { from: /`radial-gradient\(circle at 50% 50%, \$\{style\.color\}30, transparent 70%\)`/g, to: "'transparent'" }
        ]
    },
    {
        file: 'src/components/search/ResultCard.tsx',
        replacements: [
            { from: /`radial-gradient\(circle at 50% 50%, \$\{style\.shadow\}40, transparent 70%\)`/g, to: "'transparent'" }
        ]
    }
];

const basePath = __dirname;

for (const update of updates) {
    const filePath = path.join(basePath, update.file);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (const rep of update.replacements) {
        content = content.replace(rep.from, rep.to);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${update.file}`);
    } else {
        console.log(`No changes made to ${update.file} (maybe regex didn't match)`);
    }
}
