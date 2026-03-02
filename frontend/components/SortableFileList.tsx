import React, { useState, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getPDFWorker } from '@/workers/pdf-worker-client';

// Global memory cache for thumbnails with automatic cleanup
const MAX_CACHE_SIZE = 40;
const thumbnailCache = new Map<string, string>();
const cacheKeys: string[] = []; // Track insertion order for LRU

function addToCache(key: string, url: string) {
    if (thumbnailCache.has(key)) return;

    if (cacheKeys.length >= MAX_CACHE_SIZE) {
        const oldestKey = cacheKeys.shift();
        if (oldestKey) {
            const oldUrl = thumbnailCache.get(oldestKey);
            if (oldUrl && oldUrl.startsWith('blob:')) {
                URL.revokeObjectURL(oldUrl);
            }
            thumbnailCache.delete(oldestKey);
        }
    }

    thumbnailCache.set(key, url);
    cacheKeys.push(key);
}

interface SortableFileListProps {
    files: File[];
    onReorder: (newFiles: File[]) => void;
    onRemove: (index: number) => void;
    onPreview: (file: File) => void;
}

export const SortableFileList = React.memo(function SortableFileList({ files, onReorder, onRemove, onPreview }: SortableFileListProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Stable IDs
    const items = files.map((f, i) => `${f.name}-${f.size}-${i}`);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (active.id !== over?.id) {
            const oldIndex = items.indexOf(active.id as string);
            const newIndex = items.indexOf(over?.id as string);
            onReorder(arrayMove(files, oldIndex, newIndex));
        }
    };

    const handleRemove = (index: number) => {
        const file = files[index];
        if (file) {
            const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
            if (thumbnailCache.has(cacheKey)) {
                const url = thumbnailCache.get(cacheKey);
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
                thumbnailCache.delete(cacheKey);
                const kIndex = cacheKeys.indexOf(cacheKey);
                if (kIndex > -1) cacheKeys.splice(kIndex, 1);
            }
        }
        onRemove(index);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items}
                strategy={rectSortingStrategy}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in fade-in duration-500">
                    {files.map((file, i) => (
                        <SortableItem
                            key={items[i]}
                            id={items[i]}
                            file={file}
                            index={i + 1} // Pass 1-based index
                            onRemove={() => handleRemove(i)}
                            onPreview={() => onPreview(file)}
                        />
                    ))}
                </div>
            </SortableContext>

            <DragOverlay adjustScale={true}>
                {activeId ? (
                    <ItemCard
                        file={files[items.indexOf(activeId)]}
                        index={items.indexOf(activeId) + 1} // Show index while dragging
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
});

// [PROTIP] Ensure index is passed down for dynamic numbering
const SortableItem = React.memo(function SortableItem(props: { id: string, file: File, index: number, onRemove: () => void, onPreview: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0 : 1, // Hide original when dragging (overlay takes over)
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none h-full">
            <ItemCard
                file={props.file}
                index={props.index}
                onRemove={props.onRemove}
                onPreview={props.onPreview}
            />
        </div>
    );
});

// Separated Card Component for reusability in DragOverlay
const ItemCard = React.memo(function ItemCard({ file, index, onRemove, onPreview, isOverlay }: { file: File, index?: number, onRemove?: () => void, onPreview?: () => void, isOverlay?: boolean }) {
    const [rotation, setRotation] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        let active = true;
        const controller = new AbortController();
        const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;

        const generateThumbnail = async () => {
            // Check cache first
            if (thumbnailCache.has(cacheKey)) {
                setPreviewUrl(thumbnailCache.get(cacheKey)!);
                return;
            }

            if (file.type.startsWith("image/")) {
                const url = URL.createObjectURL(file);
                if (active) {
                    setPreviewUrl(url);
                    addToCache(cacheKey, url);
                }
                return;
            }
            else if (file.type === "application/pdf") {
                setIsGenerating(true);
                try {
                    const pdfWorker = getPDFWorker();

                    const result = await pdfWorker.executeTask('pdf-to-image', {
                        file: file,
                        format: 'jpeg',
                        quality: 0.6,
                        scale: file.size > 100 * 1024 * 1024 ? 0.3 : 0.5,
                        maxPages: 1
                    }, [], undefined, undefined, undefined, controller.signal);

                    if (active && result.buffer) {
                        const blob = new Blob([result.buffer], { type: 'image/jpeg' });
                        const url = URL.createObjectURL(blob);
                        setPreviewUrl(url);
                        addToCache(cacheKey, url);
                    }
                } catch (e: any) {
                    if (e.message !== "Task cancelled") {
                        console.error("Thumbnail generation failed", e);
                    }
                } finally {
                    if (active) setIsGenerating(false);
                }
            }
        };

        generateThumbnail();

        return () => {
            active = false;
            controller.abort();
        };
    }, [file]);

    const handleRotate = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRotation(prev => prev + 90);
    };

    return (
        <div
            onClick={() => !isOverlay && onPreview?.()}
            className={`group relative aspect-[3/4] bg-white dark:bg-slate-900 border ${isOverlay ? 'border-primary shadow-2xl scale-105 cursor-grabbing' : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 cursor-grab'} rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-lg`}
        >

            {/* Index Badge */}
            {index !== undefined && (
                <div className="absolute top-2 left-2 z-20 w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black flex items-center justify-center shadow-md">
                    {index}
                </div>
            )}

            {/* Preview Layer */}
            <div className="absolute inset-0 p-3 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt=""
                        className="w-full h-full object-contain rounded-lg transition-transform duration-300 shadow-sm"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 group-hover:scale-110 transition-transform">
                        {isGenerating ? (
                            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        ) : (
                            // Fallback Icon
                            <div className="relative w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-700/50">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-primary/80">
                                    <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM12.75 1.5v3a2.25 2.25 0 01-2.25 2.25h-3" clipRule="evenodd" />
                                </svg>
                                <span className="absolute bottom-0.5 right-0.5 leading-none text-[5px] font-black uppercase text-primary/50 bg-white/50 dark:bg-black/20 px-1 py-0.5 rounded">
                                    {file.name.split('.').pop()?.slice(0, 4)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Hover Overlay Actions */}
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 ${isOverlay ? 'opacity-0' : 'group-hover:opacity-100'} transition-opacity duration-200 flex flex-col justify-between p-3`}>
                <div className="flex justify-end gap-2">
                    {/* Rotate Button (Restored) */}
                    <button
                        onClick={handleRotate}
                        className="p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-white hover:text-primary transition-colors shadow-sm"
                        title="Rotate Preview"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.183m0-4.991v4.99" />
                        </svg>
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove && onRemove();
                        }}
                        className="p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                        title="Remove"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>

                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl p-3 shadow-lg">
                    <p className="text-[11px] font-bold text-foreground truncate">{file.name}</p>
                    <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
            </div>
        </div>
    );
});
