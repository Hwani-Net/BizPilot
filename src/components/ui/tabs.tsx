import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{ value: string; onValueChange: (v: string) => void }>({ value: "", onValueChange: () => {} });

export function Tabs({ defaultValue, value, onValueChange, children, className }: any) {
  const [val, setVal] = React.useState(defaultValue || value);
  const handleValueChange = (v: string) => {
    setVal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: value !== undefined ? value : val, onValueChange: handleValueChange }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: any) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-[hsl(var(--bg-elevated))] p-1 text-[hsl(var(--text-muted))]", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }: any) {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected ? "bg-[hsl(var(--bg-card))] text-[hsl(var(--text))] shadow-sm" : "hover:bg-[hsl(var(--bg-card))/0.5] hover:text-[hsl(var(--text))]",
        className
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: any) {
  const { value: selectedValue } = React.useContext(TabsContext);
  if (selectedValue !== value) return null;
  return <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fade-in", className)}>{children}</div>;
}
