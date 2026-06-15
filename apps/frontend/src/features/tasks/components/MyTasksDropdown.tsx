import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getMyActionTasks } from "../api/tasksApi";
import type { TaskItem } from "../types/task.types";

function getTaskAgeLabel(createdAt?: string | null) {
  if (!createdAt) return "New";

  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const hoursOld = Math.floor((now - createdTime) / (1000 * 60 * 60));

  if (hoursOld >= 48) return "Over 48h";
  if (hoursOld >= 24) return "Over 24h";
  if (hoursOld >= 1) return `${hoursOld}h ago`;

  return "New";
}

function MyTasksDropdown() {
  const taskRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskCount, setTaskCount] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadTasks() {
    try {
      setLoading(true);

      const response = await getMyActionTasks();

      setTasks(response.rows);
      setTaskCount(response.total_count);
    } catch {
      setTasks([]);
      setTaskCount(0);
    } finally {
      setLoading(false);
    }
  }

  function handleToggleTasks() {
    setIsOpen((current) => {
      const nextIsOpen = !current;

      if (nextIsOpen) {
        void loadTasks();
      }

      return nextIsOpen;
    });
  }

  useEffect(() => {
    loadTasks();

    const intervalId = window.setInterval(() => {
      loadTasks();
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (taskRef.current && !taskRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={taskRef} className="relative">
      <button
        type="button"
        onClick={handleToggleTasks}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-primary-blue shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-blue/20 hover:bg-blue-50 hover:shadow-md"
        aria-label="Open my tasks"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6 text-primary-blue"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>

        {taskCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-1 text-[11px] font-bold text-primary-blue shadow-sm">
            {taskCount > 99 ? "99+" : taskCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-50 w-80 rounded-3xl border border-gray-200 bg-white p-5 shadow-xl sm:w-96">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-primary-black">
              My Tasks
            </h3>
            <p className="mt-1 text-xs text-primary-gray">
              Actions waiting for you.
            </p>
          </div>

          {loading ? (
            <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-primary-gray">
              Loading tasks...
            </p>
          ) : tasks.length === 0 ? (
            <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-primary-gray">
              No tasks waiting for you right now.
            </p>
          ) : (
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(39,76,119,0.35)_transparent]">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  to={task.url}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-blue/20 hover:bg-blue-50/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary-black">
                        {task.reference}
                      </p>
                      <p className="mt-1 text-xs text-primary-gray">
                        {task.message}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-blue">
                      {getTaskAgeLabel(task.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyTasksDropdown;
