import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  CreditCard, 
  Monitor, 
  UtensilsCrossed, 
  FileText, 
  Bot, 
  Settings, 
  Database,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  Shield,
  Bell,
  Activity,
  Zap
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface MenuGroup {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: { text: string; variant: "default" | "destructive" | "secondary" };
    notifications?: number;
  }[];
}

const menuGroups: MenuGroup[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "analytics", label: "Analytics", icon: BarChart3, badge: { text: "New", variant: "secondary" } },
      { id: "system", label: "System Monitor", icon: Monitor, notifications: 3 },
    ]
  },
  {
    title: "Management",
    items: [
      { id: "users", label: "User Management", icon: Users },
      { id: "payments", label: "Payments", icon: CreditCard },
      { id: "meals", label: "Meal Database", icon: UtensilsCrossed },
      { id: "content", label: "Content Manager", icon: FileText },
    ]
  },
  {
    title: "Configuration",
    items: [
      { id: "ai-config", label: "AI Configuration", icon: Bot, badge: { text: "Critical", variant: "destructive" } },
      { id: "settings", label: "System Settings", icon: Settings },
      { id: "backup", label: "Backup & Recovery", icon: Database },
    ]
  },
  {
    title: "Advanced",
    items: [
      { id: "security", label: "Security Center", icon: Shield },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "performance", label: "Performance", icon: Activity },
      { id: "integrations", label: "Integrations", icon: Zap },
    ]
  }
];

export default function AdminSidebar({ 
  activeTab, 
  onTabChange, 
  collapsed = false, 
  onToggleCollapse 
}: AdminSidebarProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>("Overview");

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroup(expandedGroup === groupTitle ? null : groupTitle);
  };

  const getActiveItem = () => {
    for (const group of menuGroups) {
      const item = group.items.find(item => item.id === activeTab);
      if (item) return item;
    }
    return null;
  };

  const activeItem = getActiveItem();

  return (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">System Control</p>
            </div>
          )}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", !collapsed && "rotate-180")} />
            </Button>
          )}
        </div>
      </div>

      {/* Current Active Item */}
      {!collapsed && activeItem && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <activeItem.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{activeItem.label}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {menuGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <Button
                  variant="ghost"
                  className="w-full justify-between h-8 px-2 mb-1"
                  onClick={() => toggleGroup(group.title)}
                >
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {group.title}
                  </span>
                  {expandedGroup === group.title ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              {(collapsed || expandedGroup === group.title) && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start h-9",
                          collapsed ? "px-2" : "px-3",
                          isActive && "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
                        )}
                        onClick={() => onTabChange(item.id)}
                      >
                        <Icon className={cn("h-4 w-4", collapsed ? "mx-auto" : "mr-2")} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.badge && (
                              <Badge variant={item.badge.variant} className="ml-2 h-5 text-xs">
                                {item.badge.text}
                              </Badge>
                            )}
                            {item.notifications && (
                              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                                {item.notifications}
                              </Badge>
                            )}
                          </>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>System Online</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <TrendingUp className="h-3 w-3" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}