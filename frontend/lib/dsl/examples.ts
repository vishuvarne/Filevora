
import { ConversionPlan, StreamType } from './types';

export const EXAMPLE_PLAN_PDF_MERGE: ConversionPlan = {
    version: "0.1",
    limits: {
        maxMemoryBytes: 1024 * 1024 * 500, // 500MB
        maxExecutionTimeMs: 60000 // 1 min
    },
    inputs: [
        { id: "input_pdf_1", type: StreamType.PDF },
        { id: "input_pdf_2", type: StreamType.PDF }
    ],
    outputs: [
        { id: "output_merged", type: StreamType.PDF }
    ],
    steps: [
        {
            id: "op_1",
            opName: "pdf_merge",
            inputs: ["input_pdf_1", "input_pdf_2"],
            outputs: ["output_merged"],
            params: {}
        }
    ]
};

export const EXAMPLE_PLAN_IMAGE_RESIZE: ConversionPlan = {
    version: "0.1",
    limits: {
        maxMemoryBytes: 1024 * 1024 * 200,
        maxExecutionTimeMs: 30000
    },
    inputs: [
        { id: "source_img", type: StreamType.IMAGE }
    ],
    outputs: [
        { id: "resized_img", type: StreamType.IMAGE }
    ],
    steps: [
        {
            id: "op_1",
            opName: "image_resize",
            inputs: ["source_img"],
            outputs: ["resized_img"],
            params: {
                width: 800,
                height: 600,
                maintainAspectRatio: true
            }
        }
    ]
};
