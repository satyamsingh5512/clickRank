# ClickRank Frontend Bootstrap Commands (React + Vite + TS + Tailwind + shadcn/ui)

```bash
# 1) Create Vite + React + TypeScript project
npm create vite@latest clickrank-frontend -- --template react-ts
cd clickrank-frontend

# 2) Install base dependencies
npm install

# 3) Add Tailwind CSS (v4) and Vite plugin
npm install tailwindcss @tailwindcss/vite

# 4) Configure Vite plugin
# edit vite.config.ts and add: import tailwindcss from "@tailwindcss/vite"
# then add tailwindcss() in plugins

# 5) Import Tailwind in src/index.css
# add line: @import "tailwindcss";

# 6) Add shadcn/ui and initialize
npx shadcn@latest init

# 7) Add core UI blocks
npx shadcn@latest add button card badge input separator

# 8) Add charts + motion stack
npm install @tremor/react framer-motion
```

Notes:
- For dark mode, use class strategy in `components.json` and set `class="dark"` on `<html>` or root wrapper.
- If your org standardizes on pnpm or yarn, use equivalent commands.
