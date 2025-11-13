"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import { BookOpen } from "lucide-react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";

interface NavbarProps {
  completedPagesCount?: number;
  onViewBook?: () => void;
}

export const Navbar = ({
  completedPagesCount = 0,
  onViewBook,
}: NavbarProps) => {
  return (
    <HeroUINavbar maxWidth="full" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-2" href="/">
            <span className="text-2xl">✨</span>
            <p className="font-bold text-xl bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              {siteConfig.name}
            </p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-4">
        {/* Page Counter */}
        {completedPagesCount > 0 && (
          <div className="text-center bg-blue-50 rounded-lg px-4 py-2">
            <div className="text-lg font-bold text-blue-600">
              {completedPagesCount}
            </div>
            <div className="text-xs text-blue-700">
              page{completedPagesCount !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* View Book Button */}
        {completedPagesCount > 0 && (
          <Button
            color="primary"
            variant="flat"
            size="sm"
            startContent={<BookOpen size={16} />}
            onPress={onViewBook}
          >
            View Book
          </Button>
        )}

        <ThemeSwitch />
      </NavbarContent>
    </HeroUINavbar>
  );
};
