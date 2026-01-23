import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableFileListProps {
    files: File[];
    onReorder: (newFiles: File[]) => void;
    onRemove: (index: number) => void;
    onPreview: (file: File) => void;
}

export function SortableFileList({ files, onReorder, onRemove, onPreview }: SortableFileListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 200ms delay for mobile (prevents conflict with scroll)
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // We need stable IDs for DnD. File name + size is a decent proxy for now.
    // Ideally we'd wrap files in objects with UUIDs, but to avoid refactoring the whole app state:
    const items = files.map((f, i) => `${f.name}-${f.size}-${i}`);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = items.indexOf(active.id as string);
            const newIndex = items.indexOf(over?.id as string);
            onReorder(arrayMove(files, oldIndex, newIndex));
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-1">
                    {files.map((file, i) => (
                        <SortableItem
                            key={items[i]}
                            id={items[i]}
                            file={file}
                            onRemove={() => onRemove(i)}
                            onPreview={() => onPreview(file)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableItem(props: { id: string, file: File, onRemove: () => void, onPreview: () => void }) {
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
        opacity: isDragging ? 0.8 : 1,
    };

    const f = props.file;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`text-sm text-foreground flex items-center gap-3 p-2 bg-white dark:bg-slate-800/80 border ${isDragging ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-transparent hover:border-border'} shadow-sm rounded-lg group transition-all relative overflow-hidden`}
        >
            {/* Drag Handle */}
            <div {...listeners} className="cursor-grab text-muted-foreground/30 hover:text-foreground touch-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 sm:w-5 sm:h-5">
                    <path fillRule="evenodd" d="M10 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM10 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM11.5 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
                </svg>
            </div>

            <div className="w-10 h-10 min-w-[40px] rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 overflow-hidden relative">
                {f.type.startsWith("image/") ? (
                    <img
                        src={URL.createObjectURL(f)}
                        alt=""
                        className="w-full h-full object-cover"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                )}
            </div>

            <div className="min-w-0 flex-1 cursor-default">
                <p className="truncate font-bold text-foreground text-xs sm:text-xs">{f.name}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {(f.size / 1024).toFixed(0)} KB <span className="mx-1 opacity-30">|</span> <span className="opacity-70">{(f.name.split('.').pop()?.toUpperCase() || f.type.split('/')[1]?.toUpperCase() || 'FILE').slice(0, 8)}</span>
                </p>
            </div>

            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={props.onPreview}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                    title="Preview"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                </button>
                <button
                    onClick={props.onRemove}
                    className="p-2 sm:p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all touch-manipulation"
                    title="Remove"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
