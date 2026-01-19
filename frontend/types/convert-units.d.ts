declare module 'convert-units' {
    export interface Measure {
        (value: number): any;
    }

    function convert(value: number): any;
    function convert(): any;

    export default convert;
    export const allMeasures: any;
    export type Measure = any;
}
