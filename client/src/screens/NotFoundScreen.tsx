import React from "react";
import { Link } from "@tanstack/react-router";

const NotFoundScreen: React.FC = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Main Error Display */}
        <div className="relative mb-12 text-center">
          {/* Large 404 with military styling */}
          <div className="relative inline-block">
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-primary/10 blur-xl" />
            <h1 className="relative font-display text-[120px] font-bold leading-none tracking-tight text-primary sm:text-[180px]">
              404
            </h1>
          </div>
          
          {/* Divider line */}
          <div className="mx-auto my-6 h-0.5 w-24 bg-gradient-to-r from-transparent via-primary to-transparent" />
          
          {/* Error message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-text dark:text-text-dark">
              הנתיב לא נמצא
            </h2>
            <p className="text-base text-text-muted dark:text-text-dark-muted">
              הדף שחיפשת אינו קיים במערכת
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-12 text-center">
          <p className="text-lg font-medium italic text-text dark:text-text-dark">
            בוא נחזור ביחד למקום האחרון שאתה זוכר...
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="rounded-2xl border border-border bg-surface-1/50 p-6 shadow-hud backdrop-blur-sm dark:border-border-dark dark:bg-surface-1-dark/50">
          <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-text-muted dark:text-text-dark-muted">
            דפים זמינים
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              to="/alerts"
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-1 p-4 transition-all hover:border-primary hover:bg-surface-2 dark:border-border-dark dark:bg-surface-1-dark dark:hover:bg-surface-2-dark"
            >
              <svg
                className="h-6 w-6 text-primary transition-transform group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="text-xs font-semibold text-text dark:text-text-dark">
                עמוד הבית
              </span>
            </Link>

            <Link
              to="/alerts"
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-1 p-4 transition-all hover:border-danger hover:bg-surface-2 dark:border-border-dark dark:bg-surface-1-dark dark:hover:bg-surface-2-dark"
            >
              <svg
                className="h-6 w-6 text-danger transition-transform group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="text-xs font-semibold text-text dark:text-text-dark">
                התראות
              </span>
            </Link>

            <Link
              to="/responses"
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-1 p-4 transition-all hover:border-success hover:bg-surface-2 dark:border-border-dark dark:bg-surface-1-dark dark:hover:bg-surface-2-dark"
            >
              <svg
                className="h-6 w-6 text-success transition-transform group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-xs font-semibold text-text dark:text-text-dark">
                תגובות
              </span>
            </Link>

            <Link
              to="/profile"
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface-1 p-4 transition-all hover:border-secondary hover:bg-surface-2 dark:border-border-dark dark:bg-surface-1-dark dark:hover:bg-surface-2-dark"
            >
              <svg
                className="h-6 w-6 text-secondary transition-transform group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-xs font-semibold text-text dark:text-text-dark">
                פרופיל
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundScreen;
