# Legacy Frontend Features Review
## mnbara-web-legacy Analysis

### Technology Stack
- **Framework**: Next.js 16.0.3 (App Router)
- **React**: v19.2.0
- **Styling**: Tailwind CSS v4
- **Icons**: lucide-react v0.554.0
- **Utilities**: clsx, tailwind-merge

### File Structure
```
mnbara-web-legacy/
├── app/
│   ├── layout.tsx  # Root layout
│   └── page.tsx    # Home page
├── lib/
│   └── utils.ts    # Utility functions (cn helper)
└── package.json
```

### Components Found
- None - only basic page structure

### Utilities Found
- `cn()` - className merge utility using clsx + tailwind-merge

### Features to Preserve
1. **Tailwind CSS setup** - Already in main web/ folder
2. **cn() utility** - Standard pattern, already in web/src/lib/utils.ts
3. **Arabic Marketplace UI Components** ⭐ (VALUABLE!)
   - Live Auctions grid with countdown timers
   - Hot Deals section with discount badges
   - Featured Products showcase
   - Arabic navigation and footer structure
   - Product card layouts with ratings

### UI Patterns Worth Saving
- Grid-based product displays (4-column layout)
- Auction countdown implementation
- Discount badge styling
- Arabic-first navigation structure
- Footer with comprehensive links

### Conclusion
**Has valuable features!** The legacy folder contains:
- Complete Arabic marketplace homepage design
- Reusable UI components for e-commerce
- Proven layout patterns for auctions/deals

**Recommendation**: 
- Extract component patterns to docs/ui-patterns/
- Archive entire folder to `archive/mnbara-web-legacy/` for reference
- Implement similar components in main React app when building marketplace UI

### Decision
⚠️ **Archive with documentation** - components are valuable for future UI development
