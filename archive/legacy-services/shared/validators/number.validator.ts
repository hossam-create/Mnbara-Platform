/**
 * Utility functions for safe number parsing with validation
 */

export class NumberValidator {
    /**
     * Safely parse integer with validation
     * @param value - Value to parse
     * @param defaultValue - Default value if parsing fails
     * @param min - Minimum allowed value
     * @param max - Maximum allowed value
     * @returns Parsed integer or default value
     */
    static parseInt(
        value: any,
        defaultValue?: number,
        min?: number,
        max?: number
    ): number {
        if (value === null || value === undefined || value === '') {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error('Value is required');
        }

        const parsed = parseInt(String(value), 10);

        if (isNaN(parsed)) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error(`Invalid integer value: ${value}`);
        }

        if (min !== undefined && parsed < min) {
            throw new Error(`Value must be at least ${min}`);
        }

        if (max !== undefined && parsed > max) {
            throw new Error(`Value must be at most ${max}`);
        }

        return parsed;
    }

    /**
     * Safely parse float with validation
     * @param value - Value to parse
     * @param defaultValue - Default value if parsing fails
     * @param min - Minimum allowed value
     * @param max - Maximum allowed value
     * @returns Parsed float or default value
     */
    static parseFloat(
        value: any,
        defaultValue?: number,
        min?: number,
        max?: number
    ): number {
        if (value === null || value === undefined || value === '') {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error('Value is required');
        }

        const parsed = parseFloat(String(value));

        if (isNaN(parsed)) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            throw new Error(`Invalid number value: ${value}`);
        }

        if (min !== undefined && parsed < min) {
            throw new Error(`Value must be at least ${min}`);
        }

        if (max !== undefined && parsed > max) {
            throw new Error(`Value must be at most ${max}`);
        }

        return parsed;
    }

    /**
     * Validate that a value is a positive integer
     */
    static isPositiveInteger(value: any): boolean {
        const parsed = this.parseInt(value);
        return parsed > 0 && Number.isInteger(parsed);
    }

    /**
     * Validate that a value is a non-negative number
     */
    static isNonNegative(value: any): boolean {
        const parsed = this.parseFloat(value);
        return parsed >= 0;
    }
}

/**
 * Express middleware for validating numeric query/params
 */
export const validateNumericParams = (paramNames: string[], options?: {
    min?: number;
    max?: number;
    required?: boolean;
}) => {
    return (req: any, res: any, next: any) => {
        try {
            for (const paramName of paramNames) {
                const value = req.params[paramName] || req.query[paramName];
                
                if (!value && options?.required) {
                    return res.status(400).json({
                        success: false,
                        message: `${paramName} is required`
                    });
                }

                if (value) {
                    // Validate the number
                    NumberValidator.parseFloat(value, undefined, options?.min, options?.max);
                }
            }
            next();
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Invalid numeric parameter'
            });
        }
    };
};
