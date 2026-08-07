import React, { memo } from 'react';

interface SideNavLinkProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  icon: React.ElementType;
  id?: string;
}

function SideNavLink({ label, active = false, onClick, icon: Icon, id }: SideNavLinkProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      title={label}
      className={`side-nav-link ${active ? 'side-nav-link--active' : ''}`}
    >
      <span className="side-nav-link-icon" aria-hidden="true">
        <Icon className="w-4 h-4" strokeWidth={2} />
      </span>
      <span className="side-nav-link-label">{label}</span>
    </button>
  );
}

export default memo(SideNavLink);
