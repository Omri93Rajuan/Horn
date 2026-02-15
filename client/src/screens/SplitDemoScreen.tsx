import React from "react";
import CommandCenter from "./CommandCenter";
import SoldierDashboard from "./SoldierDashboard";

const SplitDemoScreen: React.FC = () => {
  return (
    <section className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold text-text dark:text-text-dark">Demo Split View</h2>
        <p className="mt-1 text-sm text-text-muted dark:text-text-dark-muted">
          Top: Commander view. Bottom: Soldier view.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border dark:border-border-dark">
        <div className="border-b border-border bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-text-muted dark:border-border-dark dark:bg-surface-2-dark dark:text-text-dark-muted">
          Commander
        </div>
        <div className="max-h-[48vh] overflow-auto">
          <CommandCenter />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border dark:border-border-dark">
        <div className="border-b border-border bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-text-muted dark:border-border-dark dark:bg-surface-2-dark dark:text-text-dark-muted">
          Soldier
        </div>
        <div className="max-h-[48vh] overflow-auto">
          <SoldierDashboard />
        </div>
      </div>
    </section>
  );
};

export default SplitDemoScreen;
