"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import BoardColumn from "@/components/board/BoardColumn";
import { TaskCardActions, TaskCardContent } from "@/components/board/TaskCard";
import { Status, statusOrder, Task } from "@/lib/types";

interface BoardProps extends TaskCardActions {
  tasks: Task[];
  onSetStatus: (task: Task, status: Status) => Promise<void>;
}

/**
 * Three-column kanban: To Do / In Progress / Done. Dragging a card to another
 * column sets that status via the same call the list view's status control uses.
 */
export default function Board({ tasks, onSetStatus, ...actions }: BoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // A small drag threshold lets clicks on the buttons through.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const byStatus = useMemo(() => {
    const groups: Record<Status, Task[]> = {
      [Status.Todo]: [],
      [Status.InProgress]: [],
      [Status.Done]: [],
    };
    for (const task of tasks) groups[task.status].push(task);
    return groups;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    const targetStatus = Number(over.id) as Status;
    if (task.status !== targetStatus) {
      void onSetStatus(task, targetStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statusOrder.map((status) => (
          <BoardColumn key={status} status={status} tasks={byStatus[status]} {...actions} />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-72 max-w-[90vw] cursor-grabbing">
            <TaskCardContent task={activeTask} {...actions} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
