"use client";

import Link from "next/link";
import { MessageCircleQuestion } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FaleConoscoButton = () => {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="mailto:aquitemods@gmail.com"
            className="hidden sm:flex fixed bottom-5 left-8 z-50 p-3 bg-[#027dba]  text-white rounded-full shadow-lg hover:bg-gradient-to-br from-[#027dba] to-[#a7cf44] transition-colors duration-300 items-center justify-center"
            aria-label="Fale Conosco"
          >
            <MessageCircleQuestion size={28} />
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Fale Conosco</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FaleConoscoButton;
