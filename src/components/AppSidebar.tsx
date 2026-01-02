import { 
  Heart, 
  Phone, 
  Bot, 
  Activity, 
  Cross, 
  MapPin,
  User,
  Mic,
  Users,
  Stethoscope,
  Pill,
  Smile,
  Brain,
  BookOpen,
  FileText,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

// Patient navigation items
const patientMainItems = [
  { title: 'Dashboard', url: '/', icon: Heart },
  { title: 'Nearby Hospitals', url: '/hospitals', icon: MapPin },
  { title: 'My Details', url: '/patient-details', icon: FileText },
  { title: 'Emergency', url: '/emergency', icon: Phone },
];

const patientMedicalTools = [
  { title: 'Medical Chatbot', url: '/medical-chatbot', icon: Bot },
  { title: 'Lab Report', url: '/voice-ai', icon: FileText },
  { title: 'Disease Risk', url: '/disease-risk', icon: Brain },
  { title: 'Disease Identifier', url: '/disease-identifier', icon: Stethoscope },
  
];

const patientWellnessItems = [
  { title: 'Calm Corner', url: '/calm', icon: Heart },
  { title: 'First Aid Guide', url: '/first-aid', icon: Cross },
  //{ title: 'Companion Care', url: '/companion-care', icon: Smile },
];

// Doctor navigation items
const doctorMainItems = [
  { title: 'Dashboard', url: '/', icon: Stethoscope },
];

export function AppSidebar() {
  const { profile } = useAuth();
  const isDoctor = profile?.role === 'doctor';

  const mainItems = isDoctor ? doctorMainItems : patientMainItems;

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border/30 card-gentle">
      <SidebarContent className="p-4">
        {/* Main Navigation */}
        <SidebarGroup className="mb-6">
          <SidebarGroupLabel className="text-[#0066cc] font-semibold mb-3 px-2">
            {isDoctor ? 'Doctor Portal' : 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl soft-transition hover:scale-[1.02] ${
                          isActive 
                            ? 'bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30 soft-glow shadow-lg' 
                            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Medical Tools - Only for Patients */}
        {!isDoctor && (
          <SidebarGroup className="mb-6">
            <SidebarGroupLabel className="text-[#2e8b57] font-semibold mb-3 px-2">Medical Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {patientMedicalTools.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl soft-transition hover:scale-[1.02] ${
                            isActive 
                              ? 'bg-gradient-to-r from-secondary/20 to-calming/20 text-foreground border border-secondary/30 soft-glow shadow-lg' 
                              : 'text-muted-foreground hover:text-secondary hover:bg-secondary/10'
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Wellness - Only for Patients */}
        {!isDoctor && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[#2e8b57] font-semibold mb-3 px-2">Wellness</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {patientWellnessItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl soft-transition hover:scale-[1.02] ${
                            isActive 
                              ? 'bg-gradient-to-r from-secondary/20 to-calming/20 text-foreground border border-secondary/30 soft-glow shadow-lg' 
                              : 'text-muted-foreground hover:text-secondary hover:bg-secondary/10'
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Gentle decorative element */}
        <div className="mt-8 p-4 card-gentle rounded-xl text-center gentle-float">
          <div 
            className="w-8 h-8 mx-auto mb-2 rounded-full soft-glow flex items-center justify-center"
            style={{ background: isDoctor ? 'linear-gradient(to right, #0066cc, #00bcd4)' : 'linear-gradient(to right, #0066cc, #2e8b57)' }}
          >
            {isDoctor ? (
              <Stethoscope className="h-4 w-4 text-white" />
            ) : (
              <Heart className="h-4 w-4 text-white" />
            )}
          </div>
          <p className="text-xs text-gray-500">
            {isDoctor ? 'Caring for patients' : 'Stay calm & healthy'}
          </p>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}