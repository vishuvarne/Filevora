/**
 * PPTX Geometry Engine
 * Resolves adjust values (avLst), guides (gdLst), and paths (pathLst) to absolute canvas coordinates.
 */

export interface GeometryGuide {
    name: string;
    fmla: string;
}

export interface AdjustValue {
    name: string;
    val: number; // Raw value (usually EMU or 100000th of shape dim)
}

export interface PathPoint {
    x: string | number;
    y: string | number;
}

export interface PathCommandStub {
    type: 'M' | 'L' | 'C' | 'Q' | 'Z';
    pt?: PathPoint[];
}

export class PptGeometryEngine {
    private guides: Map<string, number> = new Map();
    private w: number = 0;
    private h: number = 0;

    /**
     * Evaluate a geometry definition against shape dimensions.
     */
    evaluate(
        avLst: AdjustValue[],
        gdLst: GeometryGuide[],
        w: number,
        h: number
    ): Map<string, number> {
        this.w = w;
        this.h = h;
        this.guides.clear();

        // 1. Initialize Built-in vars
        // w, h are accessed directly via logic or guides?
        // In PPTX, w, h, l, t, r, b are implicit.
        this.guides.set('w', w);
        this.guides.set('h', h);
        this.guides.set('l', 0);
        this.guides.set('t', 0);
        this.guides.set('r', w);
        this.guides.set('b', h);

        // Also 3cd4, 3cd8 (fractions of circle) often used?
        this.guides.set('3cd4', 16200000); // 3/4 circle (degrees in 60000ths?)
        this.guides.set('cd2', 10800000);
        this.guides.set('cd4', 5400000);

        // 2. Load Adjust Values (overrides)
        for (const av of avLst) {
            this.guides.set(av.name, av.val);
        }

        // 3. Evaluate Guides in order
        for (const gd of gdLst) {
            const val = this.evaluateFormula(gd.fmla);
            this.guides.set(gd.name, val);
        }

        return this.guides;
    }

    /**
     * Evaluates a single formula string.
     * Format: "op arg1 arg2 [arg3]"
     */
    public evaluateFormula(fmla: string): number {
        const parts = fmla.split(/\s+/);
        const op = parts[0];
        const args = parts.slice(1).map(a => this.resolveArg(a));

        switch (op) {
            case '*/': // (x * y) / z
                return (args[0] * args[1]) / args[2];
            case '+-': // (x + y) - z
                return (args[0] + args[1]) - args[2];
            case '+/': // (x + y) / z
                return (args[0] + args[1]) / args[2];
            case '?:': // if x > 0 then y else z
                return args[0] > 0 ? args[1] : args[2];
            case 'abs':
                return Math.abs(args[0]);
            case 'at2': // arctan(y/x) (returns angle)
                return Math.atan2(args[1], args[0]);
            case 'cat2': // cos(arctan(y/x)) * z = x/sqrt(x^2+y^2) * z
                // Cosine of ArcTan2
                {
                    const x = args[0], y = args[1], z = args[2];
                    const cos = x / Math.sqrt(x * x + y * y) || 0; // Avoid div/0
                    return cos * z;
                }
            case 'cos': // x * cos(y) (y is angle/60000 degrees?)
                // PPTX angles are usually 60000 = 1 degree.
                // But trig functions often take 60000 units.
                // Formula: arg0 * cos(arg1).
                {
                    // Convert 60000 units to radians
                    // 60000 = 1 degree?
                    // Verify spec. 'fd' usually 60000 units.
                    const rad = (args[1] / 60000) * (Math.PI / 180);
                    return args[0] * Math.cos(rad);
                }
            case 'max':
                return Math.max(args[0], args[1]);
            case 'min':
                return Math.min(args[0], args[1]);
            case 'mod':
                return Math.sqrt(args[0] * args[0] + args[1] * args[1] + args[2] * args[2]); // vector modulus
            case 'pin': // pin x between y and z? "pin x y z" -> if x<y return y, if x>z return z
                {
                    const val = args[0], min = args[1], max = args[2];
                    if (val < min) return min;
                    if (val > max) return max;
                    return val;
                }
            case 'sat2': // sin(arctan(y/x)) * z
                {
                    const x = args[0], y = args[1], z = args[2];
                    const sin = y / Math.sqrt(x * x + y * y) || 0;
                    return sin * z;
                }
            case 'sin': // x * sin(y)
                {
                    const rad = (args[1] / 60000) * (Math.PI / 180);
                    return args[0] * Math.sin(rad);
                }
            case 'sqrt':
                return Math.sqrt(args[0]);
            case 'tan': // x * tan(y)
                {
                    const rad = (args[1] / 60000) * (Math.PI / 180);
                    return args[0] * Math.tan(rad);
                }
            case 'val':
                return args[0];
            default:
                return 0; // Unknown op
        }
    }

    private resolveArg(arg: string): number {
        // Is number?
        if (!isNaN(Number(arg))) return Number(arg);
        // Is variable?
        return this.guides.get(arg) || 0;
    }
}
