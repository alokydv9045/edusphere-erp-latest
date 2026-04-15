'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ChatInterface } from './ChatInterface';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const AiFloatingWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Only show the widget for STUDENTS and TEACHERS
  const isTargetRole = user && ['STUDENT', 'TEACHER'].includes(user.role);
  
  if (!isAuthenticated || !isTargetRole) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-2"
          >
            <ChatInterface onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
            isOpen 
              ? "bg-destructive hover:bg-destructive/90 rotate-90" 
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          {isOpen ? (
            <X size={28} />
          ) : (
            <div className="relative">
              <MessageSquare size={28} />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles size={16} className="text-yellow-400 fill-yellow-400" />
              </motion.div>
            </div>
          )}
        </Button>
      </motion.div>

      {/* "How can I help?" Tooltip (Only when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 1 }}
            className="absolute right-20 bottom-3 bg-background border px-3 py-1.5 rounded-lg shadow-lg hidden md:block"
          >
            <p className="text-xs font-semibold whitespace-nowrap">
              Hi {user.firstName}! How can I help today?
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
