"use client";

import { useState, useEffect } from "react";
import { createSession, listSessions } from "@/lib/session";
import { SessionSummary } from "@/lib/session";
import { calculateAgo } from "./utils";

type SessionView = SessionSummary & { ago: string };

export default function CreateSessionTest() {
  const [sessions, setSessions] = useState<SessionView[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // initialize with sessions from the server using listSessions()
  useEffect(() => {
    listSessions()
      .then((sessionSummaries) => {
        setSessions(
          sessionSummaries
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((session) => ({
              ...session,
              ago: calculateAgo(session.createdAt),
            })),
        );
      })
      .catch((error) => {
        console.error("Error fetching sessions:", error);
        alert("Failed to fetch sessions. Please try again.");
      });
  }, []);

  const createSessionHandle = () => {
    setIsLoading(true);
    const createdAt: number = Date.now();

    createSession("bogdan_polak", "Bogdan Polak", createdAt, 60)
      .then((sessionId) => {
        const existingSessions = [...sessions.map((s) => ({ ...s, ago: calculateAgo(s.createdAt) }))];
        const newSession: SessionView = {
          sessionId,
          hostId: "bogdan_polak",
          createdAt,
          ago: calculateAgo(createdAt),
        };
        setSessions(
          [...existingSessions, newSession].sort((a, b) => b.createdAt - a.createdAt),
        );
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error creating session:", error);
        alert("Failed to create session. Please try again.");
        setIsLoading(false);
      });
  };

  return (
    <div>
      <button
        className="w-50 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={createSessionHandle}
        disabled={isLoading}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <span className="w-4 h-4"></span>
        )}
        {isLoading ? "Creating ..." : "Create Session"}
      </button>
      <table className="mt-4 w-full border-collapse text-left">
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2 pr-4 text-sm font-semibold">
              Session ID
            </th>
            <th scope="col" className="py-2 pr-4 text-sm font-semibold">
              Host
            </th>
            <th scope="col" className="py-2 text-sm font-semibold">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.sessionId} className="border-b last:border-b-0">
              <td className="py-2 pr-4 text-sm">{session.sessionId}</td>
              <td className="py-2 pr-4 text-sm">{session.hostId}</td>
              <td className="py-2 text-sm">
                {calculateAgo(session.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
        {sessions.length === 0 && (
          <tfoot>
            <tr>
              <td className="py-3 text-sm text-gray-500" colSpan={3}>
                No sessions
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
