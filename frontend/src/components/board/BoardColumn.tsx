"use client";

import { useDroppable } from "@dnd-kit/core";
import TaskCard, { TaskCardActions } from "@/components/board/TaskCard";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BoardColumnProps extends TaskCardActions {
  id: "todo" | "done";
  title: string;
  tasks: Task[];
}

export default function BoardColumn({ id, title, tasks, ...actions }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-32 flex-1 flex-col gap-2 rounded-xl border border-dashed p-2 transition-colors",
          isOver ? "border-ring bg-muted/60" : "border-border bg-muted/20",
        )}
      >
        {tasks.length === 0 ? (
          <p className="m-auto py-8 text-center text-xs text-muted-foreground">
            {id === "todo" ? "Nothing to do 🎉" : "Drop a task here to complete it"}
          </p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} {...actions} />)
        )}
      </div>
    </div>
  );
}
