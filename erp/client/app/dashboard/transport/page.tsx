'use client';

import React, { useEffect, useState } from 'react';
import { 
  Bus, 
  MapPin, 
  Users, 
  AlertTriangle, 
  Navigation, 
  Settings, 
  TrendingUp,
  Clock,
  ShieldCheck,
  Wrench,
  Loader2,
  Phone,
  ArrowLeft,
  Zap,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { transportAPI } from '@/lib/api/transport';
import { socketService } from '@/lib/socket';

export default function TransportDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [allocation, setAllocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'TRANSPORT_MANAGER'].includes(user?.role || '');
  const isDriver = user?.role === 'DRIVER';
  const isStudentParent = ['STUDENT', 'PARENT'].includes(user?.role || '');

  // Use the custom map hook
  const mapRef = useHubMap(isAdmin);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isAdmin) {
          await fetchStats();
          const socket = socketService.connect();
          socket.emit('join_dashboard', user?.role);
          const handleRefresh = () => fetchStats();
          socket.on('TRANSPORT_TRIP_STARTED', handleRefresh);
          socket.on('TRANSPORT_TRIP_COMPLETED', handleRefresh);
        } else if (isStudentParent) {
          const res = await transportAPI.getMyAllocation();
          if (res.data?.success) setAllocation(res.data.allocation);
        }
      } catch (err) {
        console.error('Info sync error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      if (isAdmin) {
        socketService.disconnect();
      }
    };
  }, [isAdmin, isStudentParent, user?.role]);

  const fetchStats = async () => {
    const res = await transportAPI.getStats();
    if (res.data?.success) setStats(res.data.stats);
  };

  const statCards = [
    { name: 'Fleet Size', value: stats?.totalVehicles || '0', icon: Bus, color: 'text-slate-900', bg: 'bg-slate-50' },
    { name: 'Active Routes', value: stats?.activeRoutes || '0', icon: Navigation, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Enrolled Stu.', value: stats?.totalAllocations || '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Compliance Alerts', value: stats?.expiringDocs || '0', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const adminActions = [
    { title: 'Fleet Directory', desc: 'Vehicles & compliance documents.', icon: Bus, href: '/dashboard/transport/vehicles', color: 'slate' },
    { title: 'Route Master', desc: 'Network mapping & stop timings.', icon: MapPin, href: '/dashboard/transport/routes', color: 'blue' },
    { title: 'Student Allocations', desc: 'Assigning students to routes.', icon: Users, href: '/dashboard/transport/allocations', color: 'purple' },
    { title: 'Global Live Map', desc: 'Real-time GPS fleet monitoring.', icon: Globe, href: '/dashboard/transport/track', color: 'emerald' },
    { title: 'Operational Logs', desc: 'Maintenance and fuel history.', icon: Wrench, href: '/dashboard/transport/logs', color: 'amber' },
    { title: 'Network Settings', desc: 'Alerts and geofence config.', icon: Settings, href: '/dashboard/transport/settings', color: 'rose' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-slate-900" />
        <p className="text-slate-900 text-sm font-black uppercase tracking-[0.2em] animate-pulse">Synchronizing Intelligence Hub...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit rounded-lg hover:bg-slate-100 font-bold h-10 px-4 text-xs" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Main Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transport Hub</h1>
          <p className="text-sm text-muted-foreground font-medium">Enterprise fleet management and real-time safety monitoring.</p>
        </div>
      </div>

      {isAdmin && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, idx) => (
              <Card key={stat.name} className={cn(
                "border-l-4 shadow-sm rounded-xl",
                idx === 0 ? "border-l-slate-500" :
                idx === 1 ? "border-l-emerald-500" :
                idx === 2 ? "border-l-blue-500" : "border-l-rose-500"
              )}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
                  <div className={cn("p-2 rounded-full", stat.bg)}>
                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium tracking-tight">Active synchronization</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {adminActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="group hover:shadow-md transition-all cursor-pointer rounded-xl border-slate-100 h-full">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{action.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                          {action.desc}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors">
                        Launch Module
                        <TrendingUp className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                  <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Fleet Overview</h2>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time Network Visualization</p>
                  </div>
                  <Button variant="ghost" className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest" onClick={() => router.push('/dashboard/transport/track')}>
                      Enter Full Terminal
                  </Button>
              </div>
              <Card className="overflow-hidden border-slate-100 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] bg-white group">
                  <CardContent className="p-0 relative h-[500px]">
                      <div ref={mapRef} className="absolute inset-0 bg-slate-50 z-0" />
                      <div className="absolute top-6 left-6 z-10 pointer-events-none">
                          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-2xl flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center shadow-lg">
                                  <Globe className="h-5 w-5 animate-pulse" />
                              </div>
                              <div>
                                  <p className="font-black text-slate-900 text-xs leading-none">Hub Satellite</p>
                                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Syncing Every 200ms</p>
                              </div>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </div>
        </>
      )}

      {isStudentParent && (
        <Card className="border-none shadow-md bg-slate-950 text-white rounded-2xl overflow-hidden group">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 md:p-12 space-y-8">
                    <div className="flex items-center gap-3 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Synchronized Protocol
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight leading-tight">
                        {allocation ? `Bound for ${allocation.route.name}` : "Transport Protocol Standby"}
                    </h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
                        {allocation 
                          ? `Your route includes ${allocation.route.stops.length} checkpoints. Pickup scheduled at ${allocation.stop.name}.`
                          : "EduSphere TMS leverages real-time telemetry and geofencing to ensure every journey is tracked and secure."}
                    </p>
                    <Link href="/dashboard/transport/track" className="block w-fit">
                        <Button className="h-12 px-8 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            VIEW LIVE TRACKER
                        </Button>
                    </Link>
                </div>
                <div className="bg-white/5 p-8 md:p-12 flex flex-col justify-center gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <div>
                            <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Scheduled ETA</p>
                            <p className="font-bold text-xl">{allocation?.stop?.arrivalTime || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        <div>
                            <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Status</p>
                            <p className="font-bold text-xl uppercase">{allocation?.status || 'Active'}</p>
                        </div>
                    </div>
                </div>
              </div>
            </CardContent>
        </Card>
      )}

      {isDriver && (
        <div className="flex items-center justify-center py-12">
             <Card className="w-full max-w-xl p-8 md:p-12 rounded-2xl border-none shadow-lg bg-slate-900 text-white relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />
                <div className="relative z-10 text-center space-y-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:rotate-6 transition-transform">
                        <Zap className="h-8 w-8 text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Ready for Duty?</h2>
                        <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs mx-auto">Systems checks complete. Your route matrix is synchronized and awaiting departure.</p>
                    </div>
                    <Link href="/dashboard/transport/driver" className="block mx-auto max-w-xs">
                        <Button className="w-full h-12 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                            <Bus className="h-5 w-5" />
                            START SHIFT
                        </Button>
                    </Link>
                </div>
             </Card>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </div>
  );
}

// Map Logic Hook for the Hub
function useHubMap(isAdmin: boolean) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [tripsLocation, setTripsLocation] = useState<Record<string, {lat: number, lng: number}>>({});
  const markersRef = React.useRef<Record<string, any>>({});
  const mapInstanceRef = React.useRef<any>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchActiveTrips = async () => {
        try {
            const res = await transportAPI.getActiveTrip();
            if (res.data?.success && res.data.trip) {
                const tripsData = Array.isArray(res.data.trip) ? res.data.trip : [res.data.trip];
                setActiveTrips(tripsData);
                
                const locations: Record<string, {lat: number, lng: number}> = {};
                tripsData.forEach((t: any) => {
                    locations[t.id] = { 
                        lat: t.vehicle?.latitude || 17.4483, 
                        lng: t.vehicle?.longitude || 78.3915 
                    };
                });
                setTripsLocation(locations);

                const socket = socketService.connect();
                socket.on('bus_location_update', (data: any) => {
                    setTripsLocation(prev => ({
                        ...prev,
                        [data.tripId]: { lat: data.latitude, lng: data.longitude }
                    }));
                });

                return () => {
                    socket.off('bus_location_update');
                };
            }
        } catch (err) {
            console.error('Hub map data sync error:', err);
        }
    };

    fetchActiveTrips();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !mapRef.current) return;

    const initMap = async () => {
        // @ts-ignore
        const google = window.google;
        if (!google) return;

        try {
            const { Map } = await google.maps.importLibrary("maps");
            const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

            if (!mapInstanceRef.current) {
                mapInstanceRef.current = new Map(mapRef.current, {
                    center: { lat: 17.4483, lng: 78.3915 },
                    zoom: 12,
                    mapId: 'DEMO_MAP_ID',
                    disableDefaultUI: true,
                });
            }

            activeTrips.forEach(trip => {
                const loc = tripsLocation[trip.id];
                if (!loc) return;

                if (!markersRef.current[trip.id]) {
                    const pin = new PinElement({
                        glyph: '🚌',
                        background: '#0F172A',
                        borderColor: '#1E293B',
                    });
                    markersRef.current[trip.id] = new AdvancedMarkerElement({
                        map: mapInstanceRef.current,
                        position: loc,
                        content: pin.element,
                    });
                } else {
                    markersRef.current[trip.id].position = loc;
                }
            });
        } catch (err) {
            console.error('Hub map init error:', err);
        }
    };

    initMap();
  }, [isAdmin, activeTrips, tripsLocation]);

  return mapRef;
}
