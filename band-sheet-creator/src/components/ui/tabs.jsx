import * as React from "react";

const TabsContext = React.createContext(null);

function Tabs({ defaultValue, className, children }) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs component");
  }
  return context;
}

function TabsList({ className, children }) {
  return (
    <div className={`inline-flex items-center justify-center rounded-md bg-muted p-1 ${className}`}>
      {children}
    </div>
  );
}

function TabsTrigger({ value, className, children }) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      className={`px-3 py-1.5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50
        ${isActive 
          ? "bg-background text-foreground shadow-sm" 
          : "text-muted-foreground hover:text-foreground"
        } ${className}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className, children }) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
