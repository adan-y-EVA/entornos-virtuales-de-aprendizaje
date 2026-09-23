import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgClass: string;
  iconTextClass: string;
}

export function StatCard({ title, value, icon, iconBgClass, iconTextClass }: StatCardProps) {
  return (
    <div className="bg-card-bg border border-card-border p-5 rounded-xl">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-text-muted font-secondary text-sm">{title}</p>
          <h3 className="text-2xl font-primary font-bold text-primary mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${iconBgClass} ${iconTextClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}