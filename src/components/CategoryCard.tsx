import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  MessageSquare, 
  Mail, 
  Users, 
  Video, 
  Hash, 
  Phone, 
  FileText, 
  ShoppingCart, 
  FolderOpen, 
  ArrowUpDown, 
  Briefcase, 
  Cpu, 
  GraduationCap, 
  Factory, 
  Play, 
  HelpCircle, 
  DollarSign, 
  Monitor, 
  Edit, 
  Building, 
  Shield, 
  BarChart3, 
  Camera, 
  Clipboard, 
  Calendar, 
  Search, 
  Server, 
  Code, 
  Globe, 
  CheckSquare, 
  Ticket, 
  Clock, 
  Link, 
  Eye, 
  Database, 
  BookOpen 
} from 'lucide-react';
import type { ParsedCategory } from '@/services/github';

// Function to get the appropriate icon for each category
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  
  // Communication categories
  if (name.includes('communication')) {
    if (name.includes('email')) return Mail;
    if (name.includes('video')) return Video;
    if (name.includes('irc')) return Hash;
    if (name.includes('sip')) return Phone;
    if (name.includes('social') || name.includes('forum')) return Users;
    if (name.includes('xmpp')) return MessageSquare;
    return MessageSquare; // Default for communication
  }
  
  // Main category mappings
  if (name.includes('content management')) return FileText;
  if (name.includes('document management')) return FolderOpen;
  if (name.includes('e-commerce')) return ShoppingCart;
  if (name.includes('file transfer') || name.includes('synchronization')) return ArrowUpDown;
  if (name.includes('human resources')) return Briefcase;
  if (name.includes('internet of things') || name.includes('iot')) return Cpu;
  if (name.includes('knowledge management')) return BookOpen;
  if (name.includes('learning') || name.includes('courses')) return GraduationCap;
  if (name.includes('manufacturing')) return Factory;
  if (name.includes('media streaming')) return Play;
  if (name.includes('miscellaneous')) return HelpCircle;
  if (name.includes('money') || name.includes('budgeting') || name.includes('finance')) return DollarSign;
  if (name.includes('monitoring')) return Monitor;
  if (name.includes('note-taking') || name.includes('editors')) return Edit;
  if (name.includes('office suites')) return Building;
  if (name.includes('password managers')) return Shield;
  if (name.includes('personal dashboards') || name.includes('dashboard')) return BarChart3;
  if (name.includes('photo') || name.includes('video galleries') || name.includes('gallery')) return Camera;
  if (name.includes('project management')) return Clipboard;
  if (name.includes('resource planning')) return Calendar;
  if (name.includes('search engines')) return Search;
  if (name.includes('self-hosting')) return Server;
  if (name.includes('software development') || name.includes('dev tools')) return Code;
  if (name.includes('static site generators')) return Globe;
  if (name.includes('task management') || name.includes('to-do')) return CheckSquare;
  if (name.includes('ticketing')) return Ticket;
  if (name.includes('time tracking')) return Clock;
  if (name.includes('url shorteners')) return Link;
  if (name.includes('video surveillance') || name.includes('surveillance')) return Eye;
  if (name.includes('web servers')) return Database;
  if (name.includes('wikis')) return BookOpen;
  
  // Default fallback
  return FileText;
};

interface CategoryCardProps {
  category: ParsedCategory;
  onClick: (categoryName: string) => void;
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  const handleClick = () => {
    onClick(category.name);
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-border bg-card flex flex-col h-full"
      onClick={handleClick}
    >
      <CardHeader className="pb-3 flex-grow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {(() => {
                const IconComponent = getCategoryIcon(category.name);
                return <IconComponent className="h-5 w-5 text-primary" />;
              })()}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {category.name}
              </CardTitle>
              {category.description && (
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  {category.description}
                </CardDescription>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {category.apps.length} {category.apps.length === 1 ? 'app' : 'apps'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Click to explore
          </span>
        </div>
      </CardContent>
    </Card>
  );
}