import React from 'react';

// Define component props with TypeScript interface
interface ComponentTemplateProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Component Template
 * 
 * Use this template when creating new components to ensure consistency.
 * 
 * @param props - Component props
 * @returns React component
 */
export function ComponentTemplate({
  title,
  description,
  children,
}: ComponentTemplateProps): React.ReactElement {
  // Component state
  const [isOpen, setIsOpen] = React.useState(false);

  // Event handlers
  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  // Render component
  return (
    <div className="p-4 border rounded-md">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        <button 
          onClick={handleToggle}
          className="px-3 py-1 bg-primary text-white rounded-md"
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
      
      {isOpen && (
        <div className="mt-4 border-t pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Default export
export default ComponentTemplate;
