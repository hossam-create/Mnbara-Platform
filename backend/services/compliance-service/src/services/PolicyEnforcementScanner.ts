
export interface ContentScanRequest {
    text: string;
    type: 'LISTING_TITLE' | 'LISTING_DESCRIPTION' | 'MESSAGE' | 'USER_BIO';
    userId: string;
}

export interface ScanResult {
    isClean: boolean;
    flags: string[]; // e.g., ["WEAPON_KEYWORD", "HATE_SPEECH"]
    action: 'ALLOW' | 'FLAG_FOR_REVIEW' | 'AUTO_BLOCK';
}

export class PolicyEnforcementScanner {
    
    // Simple prohibited patterns (Regex)
    private prohibitedPatterns = [
        { pattern: /weapon|gun|rifle|explosive/i, category: 'WEAPONS_POLICY' },
        { pattern: /drug|narcotic|weed|cannabis/i, category: 'DRUGS_POLICY' },
        { pattern: /hate|kill|murder/i, category: 'VIOLENCE_POLICY' },
        { pattern: /fake|replica|counterfeit/i, category: 'COUNTERFEIT_POLICY' }
    ];

    public scanContent(request: ContentScanRequest): ScanResult {
        const flags: string[] = [];
        let action: ScanResult['action'] = 'ALLOW';

        for (const rule of this.prohibitedPatterns) {
            if (rule.pattern.test(request.text)) {
                flags.push(rule.category);
            }
        }

        if (flags.length > 0) {
            // Determine severity
            if (flags.includes('WEAPONS_POLICY') || flags.includes('DRUGS_POLICY')) {
                action = 'AUTO_BLOCK';
            } else {
                action = 'FLAG_FOR_REVIEW';
            }
        }

        return {
            isClean: flags.length === 0,
            flags,
            action
        };
    }
}
