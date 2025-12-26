import React from 'react';

interface FooterLink {
  label: string;
  path: string;
  icon?: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
  onLinkClick?: (linkName: string, section: string) => void;
}

const FooterColumn: React.FC<FooterColumnProps> = ({ title, links, onLinkClick }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        {title}
      </h3>
      
      <ul className="space-y-2">
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.path}
              className="text-base text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              onClick={(e) => {
                if (onLinkClick) {
                  e.preventDefault();
                  onLinkClick(link.label, title);
                  // Navigate after tracking
                  setTimeout(() => {
                    window.location.href = link.path;
                  }, 100);
                }
              }}
            >
              {link.icon && <span className="text-sm">{link.icon}</span>}
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterColumn;