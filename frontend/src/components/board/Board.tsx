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
import { Task } from "@/lib/types";

interface BoardProps extends TaskCardActions {
  tasks: Task[];
}

/**
 * Two-column kanban: "To Do" and "Completed". Dragging a card to the other
 * column flips its completion via the same toggle used elsewhere.
 */
export default function Board({ tasks, ...actions }: BoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // A small drag threshold lets clicks on the checkbox / buttons through.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const { todo, done } = useMemo(
    () => ({
      todo: tasks.filter((t) => !t.isCompleted),
      done: tasks.filter((t) => t.isCompleted),
    }),
    [tasks],
  );

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

    const targetCompleted = over.id === "done";
    if (task.isCompleted !== targetCompleted) {
      // Same toggle the checkbox uses — errors are surfaced there via toast.
      void actions.onToggle(task);
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BoardColumn id="todo" title="To Do" tasks={todo} {...actions} />
        <BoardColumn id="done" title="Completed" tasks={done} {...actions} />
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-80 max-w-[90vw] cursor-grabbing">
            <TaskCardContent task={activeTask} {...actions} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
