import React, { createContext, useContext, useState, useCallback } from 'react';

interface DraggedCard {
    nodePos: number;
    nodeContent: any;
    sourceColumnTitle: string;
}

interface KanbanDragContextType {
    draggedCard: DraggedCard | null;
    setDraggedCard: (card: DraggedCard | null) => void;
    isDragging: boolean;
}

const KanbanDragContext = createContext<KanbanDragContextType>({
    draggedCard: null,
    setDraggedCard: () => { },
    isDragging: false,
});

export const useKanbanDrag = () => useContext(KanbanDragContext);

export const KanbanDragProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [draggedCard, setDraggedCard] = useState<DraggedCard | null>(null);

    return (
        <KanbanDragContext.Provider
            value={{
                draggedCard,
                setDraggedCard,
                isDragging: draggedCard !== null,
            }}
        >
            {children}
        </KanbanDragContext.Provider>
    );
};
